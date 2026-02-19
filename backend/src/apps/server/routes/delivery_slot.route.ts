import { Router } from "express";
import type { Request, Response } from "express";
import { DeliverySlotListController } from "../controllers/DeliverySlotListController.js";
import { DeliverySlotCreateController } from "../controllers/DeliverySlotCreateController.js";
import { DeliverySlotUpdateController } from "../controllers/DeliverySlotUpdateController.js";
import { DeliverySlotDeleteController } from "../controllers/DeliverySlotDeleteController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { AdminMiddleware } from "../middlewares/AdminMiddleware.js";

export const register = (router: Router) => {
  const list = new DeliverySlotListController();
  const create = new DeliverySlotCreateController();
  const update = new DeliverySlotUpdateController();
  const del = new DeliverySlotDeleteController();

  // Public: list available open slots (for client to pick)
  router.get("/delivery-slots", (req: Request, res: Response) =>
    list.run(req, res),
  );

  // Admin: create a new slot
  router.post(
    "/delivery-slots",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => create.run(req, res),
  );

  // Admin: update slot (capacity, status, etc.)
  router.patch(
    "/delivery-slots/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => update.run(req, res),
  );

  // Admin: delete a slot (only if no orders assigned)
  router.delete(
    "/delivery-slots/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => del.run(req, res),
  );
};
