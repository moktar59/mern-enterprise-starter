import express, { type Express } from "express";

/** Creates the HTTP application without opening a network listener. */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  // Minimal bootstrap response; the Phase 2 HTTP PR will establish the
  // documented endpoint and error contracts around this application.
  app.get("/", (_request, response) => {
    response.status(200).json({ message: "MERN Enterprise Starter API" });
  });

  return app;
}
