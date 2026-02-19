import { Router } from "express";
import type { Request, Response } from "express";
import { CategoryListController } from "../controllers/CategoryListController.js";
import { CategoryGetController } from "../controllers/CategoryGetController.js";
import { CategoryCreateController } from "../controllers/CategoryCreateController.js";
import { CategoryUpdateController } from "../controllers/CategoryUpdateController.js";
import { CategoryDeleteController } from "../controllers/CategoryDeleteController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { AdminMiddleware } from "../middlewares/AdminMiddleware.js";

export const register = (router: Router) => {
  const list = new CategoryListController();
  const get = new CategoryGetController();
  const create = new CategoryCreateController();
  const update = new CategoryUpdateController();
  const del = new CategoryDeleteController();

  router.get("/categories", (req, res) => list.run(req, res));
  router.get("/categories/:slug", (req, res) => get.run(req, res));

  router.post("/categories", AuthMiddleware, AdminMiddleware, (req, res) =>
    create.run(req, res),
  );
  router.put("/categories/:id", AuthMiddleware, AdminMiddleware, (req, res) =>
    update.run(req, res),
  );
  router.delete(
    "/categories/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req, res) => del.run(req, res),
  );
};
