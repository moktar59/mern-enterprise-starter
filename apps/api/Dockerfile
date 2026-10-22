FROM node:24.22.0-bookworm-slim

WORKDIR /app/apps/api

# Argon2 may compile its native binding when a matching prebuilt binary is unavailable.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Keep dependency installation tied to the API's own manifest and lockfile.
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

COPY apps/api/tsconfig.json apps/api/tsconfig.build.json ./
COPY apps/api/src ./src
COPY apps/api/openapi ./openapi

EXPOSE 3000

CMD ["npm", "run", "dev"]
