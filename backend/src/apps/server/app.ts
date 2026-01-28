import express from "express";
import { register as registerStatusRoute } from "./routes/status.route.js";

export class Server {
  private app: express.Express;
  private port: string;

  constructor(port: string) {
    this.port = port;
    this.app = express();

    // Middlewares (CORS, JSON, etc.)
    this.app.use(express.json());

    // Register Routes
    const router = express.Router();

    // Root route
    router.get("/", (req, res) => {
      res.json({ message: "Backend API Server" });
    });

    registerStatusRoute(router);

    this.app.use(router);
  }

  async listen(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(
          `  Backend App is running at http://localhost:${this.port} in ${this.app.get("env")} mode`,
        );
        console.log("  Press CTRL-C to stop\n");
        resolve();
      });
    });
  }

  get httpServer() {
    return this.app;
  }
}
