import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

const VALID_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export class OrderUpdateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing order ID" });
        return;
      }

      if (status && !VALID_STATUSES.includes(status)) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
          });
        return;
      }

      const client = SupabaseClientFactory.createClient();
      const { data, error } = await client
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({ error: "Order not found" });
        return;
      }

      res.status(httpStatus.OK).json(data);
    } catch (err: any) {
      console.error("OrderUpdateController Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}
