import { Router } from "express";
import type { Request, Response } from "express";
import { ProductListController } from "../controllers/ProductListController.js";
import { ProductGetController } from "../controllers/ProductGetController.js";
import { ProductCreateController } from "../controllers/ProductCreateController.js";
import { ProductUpdateController } from "../controllers/ProductUpdateController.js";
import { ProductDeleteController } from "../controllers/ProductDeleteController.js";

import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { AdminMiddleware } from "../middlewares/AdminMiddleware.js";

export const register = (router: Router) => {
  const listController = new ProductListController();
  const getController = new ProductGetController();
  const createController = new ProductCreateController();
  const updateController = new ProductUpdateController();
  const deleteController = new ProductDeleteController();

  // Public Routes
  router.get("/products", (req: Request, res: Response) =>
    listController.run(req, res),
  );

  router.get("/products/:id", (req: Request, res: Response) =>
    getController.run(req, res),
  );

  // Admin Routes (Protected)
  router.post(
    "/products",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => createController.run(req, res),
  );

  router.put(
    "/products/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => updateController.run(req, res),
  );

  router.delete(
    "/products/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => deleteController.run(req, res),
  );
};