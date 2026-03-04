import { Router } from "express";
import { AdminStatsController } from "../controllers/AdminStatsController.js";
import { StockUpdateController } from "../controllers/StockUpdateController.js";
import { UserListController } from "../controllers/UserListController.js";
import { UserRoleUpdateController } from "../controllers/UserRoleUpdateController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { AdminMiddleware } from "../middlewares/AdminMiddleware.js";

export const register = (router: Router) => {
  const statsController = new AdminStatsController();
  const stockUpdate = new StockUpdateController();
  const userList = new UserListController();
  const userRoleUpdate = new UserRoleUpdateController();

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

  // ── Users ──────────────────────────────────────────────────────────────
  router.get(
    "/admin/users",
    AuthMiddleware,
    AdminMiddleware,
    (req, res) => userList.run(req, res),
  );

  router.patch(
    "/admin/users/:id/role",
    AuthMiddleware,
    AdminMiddleware,
    (req, res) => userRoleUpdate.run(req, res),
  );
};
