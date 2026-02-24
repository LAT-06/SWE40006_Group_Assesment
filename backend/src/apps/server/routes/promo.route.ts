import { Router } from "express";
import type { Request, Response } from "express";
import { PromoCodeValidateController } from "../controllers/PromoCodeValidateController.js";

export const register = (router: Router) => {
  const validate = new PromoCodeValidateController();

  router.post("/promo/validate", (req: Request, res: Response) =>
    validate.run(req, res),
  );
};
