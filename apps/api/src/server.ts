import { createApp } from "./app.js";

const host = "127.0.0.1";
const port = 3000;
const app = createApp();

const server = app.listen(port, host, () => {
  console.info(`API listening at http://${host}:${port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error("API failed to start.", error.message);
  process.exitCode = 1;
});
