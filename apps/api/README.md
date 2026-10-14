# API Application

The API application establishes the Node.js 24, TypeScript, and Express 5 runtime foundation for Phase 2.

## Requirements

- Node.js 24
- npm 10 or later

## Commands

Run these commands from this directory (`apps/api`):

| Command | Purpose |
|---|---|
| `npm install` | Install API dependencies |
| `npm run dev` | Run the API with the development runner |
| `npm run build` | Compile TypeScript to `dist` |
| `npm start` | Run the compiled API |
| `npm test` | Run API tests with the Node.js test runner through `tsx` |
| `npm run typecheck` | Type-check the API without emitting files |

## Environment Configuration

Configuration is read and validated once at startup. Invalid configuration prevents application construction and listener startup.

| Variable | Default | Accepted values |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test`, `production` |
| `HOST` | `127.0.0.1` | Any non-empty host value |
| `PORT` | `3000` | Integer from `1` through `65535` |

Environment values are normalized before validation. The resulting configuration object is frozen at runtime. Only the configuration boundary reads `process.env`; application components receive the validated configuration through startup.

Example for Git Bash:

```bash
NODE_ENV=development HOST=127.0.0.1 PORT=3000 npm run dev
```

The initial bootstrap response is available at `GET /` on `http://127.0.0.1:3000` with the default configuration.

The API owns its backend implementation, dependencies, database integration, and persistence models. The admin and web applications are independent frontend API consumers; they do not import API internals or access its database directly.

Explicit composition beyond the startup boundary, request execution context, the stable HTTP error contract, and graceful shutdown remain subsequent Phase 2 slices. This application is not yet the completed Phase 2 foundation.
