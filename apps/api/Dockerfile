FROM node:24.22.0-bookworm-slim

WORKDIR /app/apps/api

# Keep dependency installation tied to the API's own manifest and lockfile.
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

COPY apps/api/tsconfig.json apps/api/tsconfig.build.json ./
COPY apps/api/src ./src
COPY apps/api/openapi ./openapi

EXPOSE 3000

CMD ["npm", "run", "dev"]
