import express from "express";
import { register as registerStatusRoute } from "./routes/status.route.js";
import { register as registerProductRoute } from "./routes/product.route.js";
import { register as registerCategoryRoute } from "./routes/category.route.js";
import { register as registerCartRoute } from "./routes/cart.route.js";
import { register as registerOrderRoute } from "./routes/order.route.js";
import { register as registerDeliverySlotRoute } from "./routes/delivery_slot.route.js";
import { register as registerAdminRoute } from "./routes/admin.route.js";
import cors from "cors";

export class Server {
  private app: express.Express;
  private port: string;

  constructor(port: string) {
    this.port = port;
    this.app = express();

    // CORS Configuration
    this.app.use(
      cors({
        origin: "*", // Allow all origins for dev. For prod, set to specific domain.
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        credentials: true,
      }),
    );

    // Middlewares
    this.app.use(express.json());

    // Register Routes
    const router = express.Router();

    // Root route
    router.get("/", (req, res) => {
      res.json({ message: "Backend API Server" });
    });

    registerStatusRoute(router);
    registerProductRoute(router);
    registerCategoryRoute(router);
    registerCartRoute(router);
    registerOrderRoute(router);
    registerDeliverySlotRoute(router);
    registerAdminRoute(router);

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
