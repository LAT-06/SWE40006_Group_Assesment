import { Router } from "express";
import type { Request, Response } from "express";
import { StatusGetController } from "../controllers/StatusGetController.js";

export const register = (router: Router) => {
  const controller = new StatusGetController();

  router.get("/status", (req: Request, res: Response) =>
    controller.run(req, res),
  );
};
