import { Router } from "express";
import type { Request, Response } from "express";
import { DeliveryZoneListController } from "../controllers/DeliveryZoneListController.js";
import { DeliveryZoneCreateController } from "../controllers/DeliveryZoneCreateController.js";
import { DeliveryZoneUpdateController } from "../controllers/DeliveryZoneUpdateController.js";
import { DeliveryZoneDeleteController } from "../controllers/DeliveryZoneDeleteController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { AdminMiddleware } from "../middlewares/AdminMiddleware.js";

export const register = (router: Router) => {
  const list   = new DeliveryZoneListController();
  const create = new DeliveryZoneCreateController();
  const update = new DeliveryZoneUpdateController();
  const del    = new DeliveryZoneDeleteController();

  // Public: clients need zone list to validate their address
  router.get("/delivery-zones", (req: Request, res: Response) =>
    list.run(req, res),
  );

  // Admin only
  router.post(
    "/delivery-zones",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => create.run(req, res),
  );

  router.patch(
    "/delivery-zones/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => update.run(req, res),
  );

  router.delete(
    "/delivery-zones/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => del.run(req, res),
  );
};
