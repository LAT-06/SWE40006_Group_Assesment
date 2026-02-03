import { Router } from "express";
import { AdminStatsController } from "../controllers/AdminStatsController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { AdminMiddleware } from "../middlewares/AdminMiddleware.js";

export const register = (router: Router) => {
  const statsController = new AdminStatsController();

  router.get(
    "/admin/dashboard/stats",
    AuthMiddleware,
    AdminMiddleware,
    (req, res) => statsController.run(req, res)
  );
};
