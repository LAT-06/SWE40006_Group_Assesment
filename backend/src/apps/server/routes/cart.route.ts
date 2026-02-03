import { Router } from "express";
import { CartGetController } from "../controllers/CartGetController.js";
import { CartItemAddController } from "../controllers/CartItemAddController.js";
import { CartItemRemoveController } from "../controllers/CartItemRemoveController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";

export const register = (router: Router) => {
  const get = new CartGetController();
  const add = new CartItemAddController();
  const remove = new CartItemRemoveController();

  router.get("/cart", AuthMiddleware, (req, res) => get.run(req, res));
  router.post("/cart/items", AuthMiddleware, (req, res) => add.run(req, res));
  router.delete("/cart/items/:id", AuthMiddleware, (req, res) => remove.run(req, res));
};
