import type { Express } from "express";
import { createApp } from "../app.js";

/**
 * Constructs the HTTP application and its currently required dependencies.
 * This function must not open a network listener or start the process.
 */
export function composeApplication(): Express {
  return createApp();
}
