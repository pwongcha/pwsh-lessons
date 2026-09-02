# syntax=docker/dockerfile:1

# ---- Stage 1: build the static site ----
FROM python:3.12-slim AS build

WORKDIR /app

COPY mkdocs/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY mkdocs/ ./

# The GSAP platform serves every app under a path prefix. Baking the full public
# URL in at build time makes canonical links, sitemap and Material's instant
# navigation resolve correctly. Page assets are emitted as relative paths, so the
# site still works at any prefix (or at "/") regardless of this value.
ARG SITE_URL=https://gsap.akamai.com/pwsh-lessons/
ENV SITE_URL=${SITE_URL}

RUN mkdocs build --strict -d /site

# ---- Stage 2: serve it ----
# nginx-unprivileged already listens on 8080 (plain HTTP) and runs as a non-root
# user — exactly what GSAP asks for.
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site /usr/share/nginx/html/pwsh-lessons/

EXPOSE 8080
