#!/usr/bin/env bash
#
# Build the app image and scan it for known CVEs and Dockerfile / config
# misconfiguration, using Trivy (https://trivy.dev).
#
#   ./scripts/security-scan.sh
#
# Uses a native `trivy` if one is on PATH (faster, caches its DB); otherwise
# runs Trivy from its official container via docker/podman — nothing to install.
#
# Env knobs:
#   IMAGE=name:tag      image to build/scan   (default: pwsh-lessons:scan)
#   SEVERITY=list       comma-separated       (default: HIGH,CRITICAL)
#   IGNORE_UNFIXED=0    also fail on CVEs with no upstream fix yet (default: 1)

set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE="${IMAGE:-pwsh-lessons:scan}"
SEVERITY="${SEVERITY:-HIGH,CRITICAL}"
IGNORE_UNFIXED="${IGNORE_UNFIXED:-1}"
TRIVY_IMAGE="aquasec/trivy:0.70.0"
CACHE_DIR="${TMPDIR:-/tmp}/trivy-cache"

unfixed_flag=()
[ "$IGNORE_UNFIXED" = "1" ] && unfixed_flag=(--ignore-unfixed)

# --- pick a container engine ------------------------------------------------
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  ENGINE=docker
elif command -v podman >/dev/null 2>&1; then
  ENGINE=podman
else
  echo "error: need docker or podman on PATH" >&2
  exit 1
fi

NATIVE_TRIVY=0
command -v trivy >/dev/null 2>&1 && NATIVE_TRIVY=1
mkdir -p "$CACHE_DIR"

echo ">> engine: $ENGINE   trivy: $([ $NATIVE_TRIVY = 1 ] && echo native || echo "container ($TRIVY_IMAGE)")"

# --- build -----------------------------------------------------------------
echo ">> building $IMAGE"
"$ENGINE" build -t "$IMAGE" .

rc=0

# --- 1. Dockerfile / IaC misconfiguration --------------------------------
echo
echo ">> [1/2] config & Dockerfile misconfiguration"
if [ "$NATIVE_TRIVY" = 1 ]; then
  trivy config --severity "$SEVERITY" --exit-code 1 . || rc=1
else
  "$ENGINE" run --rm -v "$CACHE_DIR:/root/.cache/trivy" -v "$PWD:/work:ro" \
    "$TRIVY_IMAGE" config --severity "$SEVERITY" --exit-code 1 /work || rc=1
fi

# --- 2. image CVEs ------------------------------------------------------
echo
echo ">> [2/2] image vulnerabilities ($IMAGE)"
if [ "$NATIVE_TRIVY" = 1 ]; then
  trivy image "${unfixed_flag[@]}" --severity "$SEVERITY" --exit-code 1 "$IMAGE" || rc=1
else
  # hand the image to the trivy container as a tar so it needs no daemon socket
  tar="$(mktemp "${TMPDIR:-/tmp}/pwsh-lessons.XXXXXX.tar")"
  trap 'rm -f "$tar"' EXIT
  "$ENGINE" save -o "$tar" "$IMAGE"
  "$ENGINE" run --rm -v "$CACHE_DIR:/root/.cache/trivy" -v "$tar:/img.tar:ro" \
    "$TRIVY_IMAGE" image "${unfixed_flag[@]}" \
      --severity "$SEVERITY" --exit-code 1 --input /img.tar || rc=1
fi

echo
if [ "$rc" -eq 0 ]; then
  echo ">> PASS — no $SEVERITY findings"
else
  echo ">> FAIL — $SEVERITY findings above"
fi
exit "$rc"
