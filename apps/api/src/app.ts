import express, { type Express, type RequestHandler } from "express";
import { httpErrorHandler, notFoundHandler } from "./http/middleware/http-error-middleware.js";

/** Creates the HTTP application without opening a network listener. */
export function createApp(executionContextMiddleware: RequestHandler): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(executionContextMiddleware);
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.status(200).json({ message: "MERN Enterprise Starter API" });
  });

  // Liveness only confirms that the HTTP process can serve requests.
  app.get("/health/live", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use(notFoundHandler);
  app.use(httpErrorHandler);

  return app;
}
