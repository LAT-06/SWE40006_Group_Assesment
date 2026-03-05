import serverlessExpress from "@vendia/serverless-express";
import type { Handler } from "aws-lambda";
import { Server } from "./app.js";

// Instantiate Express once per cold start — reused across warm invocations
const server = new Server("3000");
const app = server.httpServer;

export const handler: Handler = serverlessExpress({ app });
