import { configure } from "@vendia/serverless-express";
import type { Handler } from "aws-lambda";
import { Server } from "./app.js";

// Build the Express app once (cold start), reuse on warm invocations
const server = new Server("3000");
const app = server.httpServer;

export const handler: Handler = configure({ app });