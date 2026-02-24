import { Router } from "express";
import type { Request, Response } from "express";
import { OrderCreateController } from "../controllers/OrderCreateController.js";
import { OrderListController } from "../controllers/OrderListController.js";
import { OrderGetController } from "../controllers/OrderGetController.js";
import { OrderUpdateController } from "../controllers/OrderUpdateController.js";
import { OrderCancelController } from "../controllers/OrderCancelController.js";
import { OrderSelectSlotController } from "../controllers/OrderSelectSlotController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";
import { AdminMiddleware } from "../middlewares/AdminMiddleware.js";

export const register = (router: Router) => {
  const create = new OrderCreateController();
  const list = new OrderListController();
  const get = new OrderGetController();
  const update = new OrderUpdateController();
  const cancel = new OrderCancelController();
  const selectSlot = new OrderSelectSlotController();

  // User: place an order from their cart
  router.post("/orders", AuthMiddleware, (req: Request, res: Response) =>
    create.run(req, res),
  );

  // User: cancel their own pending order
  router.patch(
    "/orders/:id/cancel",
    AuthMiddleware,
    (req: Request, res: Response) => cancel.run(req, res),
  );

  // User: select/update delivery slot and notes on a pending order
  router.patch(
    "/orders/:id/slot",
    AuthMiddleware,
    (req: Request, res: Response) => selectSlot.run(req, res),
  );

  // Admin: list all orders (paginated, lightweight)
  router.get(
    "/orders",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => list.run(req, res),
  );

  // Admin: get single order with items
  router.get(
    "/orders/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => get.run(req, res),
  );

  // Admin: update order status
  router.patch(
    "/orders/:id",
    AuthMiddleware,
    AdminMiddleware,
    (req: Request, res: Response) => update.run(req, res),
  );
};
