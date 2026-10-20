import { readFile } from "node:fs/promises";
import express, { type Express, type RequestHandler } from "express";
import { createV1Router } from "./routes/v1/index.js";
import { httpErrorHandler, notFoundHandler } from "./http/middleware/http-error-middleware.js";

const openApiUrl = new URL("../openapi/openapi.yaml", import.meta.url);
const swaggerUiHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MERN Enterprise Starter API — Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true
        });
      };
    </script>
  </body>
</html>`;

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

  app.get("/openapi.yaml", async (_request, response, next) => {
    try {
      const specification = await readFile(openApiUrl, "utf8");
      response.type("application/yaml").send(specification);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api-docs", (_request, response) => {
    response.type("html").send(swaggerUiHtml);
  });

  app.use("/api/v1", createV1Router());

  app.use(notFoundHandler);
  app.use(httpErrorHandler);

  return app;
}
