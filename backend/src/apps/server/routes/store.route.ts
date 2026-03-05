import { Router } from "express";
import type { Request, Response } from "express";
import { StoreListController } from "../controllers/StoreListController.js";
import { StoreCreateController } from "../controllers/StoreCreateController.js";
import { StoreUpdateController } from "../controllers/StoreUpdateController.js";
import { StoreDeleteController } from "../controllers/StoreDeleteController.js";
import { StoreInventoryListController } from "../controllers/StoreInventoryListController.js";
import { StoreInventoryUpdateController } from "../controllers/StoreInventoryUpdateController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { AdminMiddleware } from "../middlewares/AdminMiddleware.js";

export const register = (router: Router) => {
  const list = new StoreListController();
  const create = new StoreCreateController();
  const update = new StoreUpdateController();
  const del = new StoreDeleteController();
  const invList = new StoreInventoryListController();
  const invUpdate = new StoreInventoryUpdateController();

  // ── Public ──────────────────────────────────────────────────────────────────
  router.get("/stores", (req: Request, res: Response) => list.run(req, res));

  router.get("/stores/:storeId/inventory", (req: Request, res: Response) =>
    invList.byStore(req, res),
  );

  // Which stores carry a given product (used on product detail page)
  router.get("/products/:productId/stores", (req: Request, res: Response) =>
    invList.byProduct(req, res),
  );

  // ── Admin ────────────────────────────────────────────────────────────────────
  router.post(
    "/admin/stores",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => create.run(req, res),
  );

  router.patch(
    "/admin/stores/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => update.run(req, res),
  );

  router.delete(
    "/admin/stores/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => del.run(req, res),
  );

  router.patch(
    "/admin/stores/:storeId/inventory/:productId",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => invUpdate.run(req, res),
  );
};
