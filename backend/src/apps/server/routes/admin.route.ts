import { Router } from "express";
import { AdminStatsController } from "../controllers/AdminStatsController.js";
import { StockUpdateController } from "../controllers/StockUpdateController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { AdminMiddleware } from "../middlewares/AdminMiddleware.js";

export const register = (router: Router) => {
  const statsController = new AdminStatsController();
  const stockUpdate = new StockUpdateController();

  router.get(
    "/admin/dashboard/stats",
    AuthMiddleware,
    AdminMiddleware,
    (req, res) => statsController.run(req, res),
  );

  router.patch(
    "/admin/stock/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req, res) => stockUpdate.run(req, res),
  );
};
