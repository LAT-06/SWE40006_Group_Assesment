import type { Request, Response } from "express";
import httpStatus from "http-status";

export class StatusGetController {
  async run(req: Request, res: Response): Promise<void> {
    res.status(httpStatus.OK).send();
  }
}
