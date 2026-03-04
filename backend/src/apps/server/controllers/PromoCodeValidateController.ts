import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class PromoCodeValidateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { code, order_total } = req.body;

      if (!code) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "Missing promo code" });
        return;
      }

      const client = SupabaseClientFactory.createClient();

      const { data: promo, error } = await (client as any)
        .from("promo_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !promo) {
        res.status(httpStatus.NOT_FOUND).json({ error: "Invalid promo code" });
        return;
      }

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        res.status(httpStatus.GONE).json({ error: "Promo code has expired" });
        return;
      }

      if (promo.max_uses !== null && promo.uses >= promo.max_uses) {
        res.status(httpStatus.GONE).json({ error: "Promo code usage limit reached" });
        return;
      }

      const total = Number(order_total) || 0;
      if (total < Number(promo.min_order_amount)) {
        res.status(httpStatus.BAD_REQUEST).json({
          error: `Minimum order amount $${promo.min_order_amount} required for this code`,
        });
        return;
      }

      const discountAmount =
        promo.discount_type === "percent"
          ? (total * Number(promo.discount_value)) / 100
          : Number(promo.discount_value);

      res.status(httpStatus.OK).json({
        valid: true,
        discount_type: promo.discount_type,
        discount_value: Number(promo.discount_value),
        discount_amount: Math.min(discountAmount, total),
      });
    } catch (err: any) {
      console.error("PromoCodeValidateController Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}
