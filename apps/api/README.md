# API Workspace

The API workspace establishes the initial Node.js, TypeScript, and Express runtime foundation for Phase 2.

## Requirements

- Node.js 24
- npm 10 or later

## Commands

Run these commands from the repository root:

| Command | Purpose |
|---|---|
| `npm install` | Install workspace dependencies |
| `npm run dev` | Run the API with the development runner |
| `npm run build` | Compile TypeScript to `apps/api/dist` |
| `npm start` | Run the compiled API |
| `npm test` | Run API tests with the Node.js test runner through `tsx` |
| `npm run typecheck` | Type-check the API without emitting files |

The initial bootstrap response is available at `GET /` on `http://127.0.0.1:3000`.

Configuration validation, explicit composition, request execution context, the stable HTTP error contract, and graceful shutdown are implemented in subsequent Phase 2 slices. This workspace is not yet the completed Phase 2 foundation.
