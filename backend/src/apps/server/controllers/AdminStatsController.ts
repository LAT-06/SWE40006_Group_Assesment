import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class AdminStatsController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const client = SupabaseClientFactory.createServiceRoleClient();
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      const yesterdayEnd = todayStart;

      // 1. Orders
      const { count: todayOrders, error: err1 } = await client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      const { count: yesterdayOrders, error: err2 } = await client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart)
        .lt('created_at', yesterdayEnd);

      // 2. Revenue
      // Note: Supabase JS client doesn't support SUM directly easily without rpc or fetching all data. 
      // For efficiency with large data, RPC is better, but for now fetching is okay for prototype or small scale.
      // We will fetch only 'total_amount' column.
      const { data: todayRevenueData, error: err3 } = await client
        .from('orders')
        .select('total_amount')
        .gte('created_at', todayStart);
      
      const { data: yesterdayRevenueData, error: err4 } = await client
        .from('orders')
        .select('total_amount')
        .gte('created_at', yesterdayStart)
        .lt('created_at', yesterdayEnd);

      const todayRevenue = todayRevenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const yesterdayRevenue = yesterdayRevenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // 3. Active Deliveries (Processing or Shipped)
      const { count: activeDeliveries, error: err5 } = await client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['processing', 'shipped']);

      // 4. Low Stock (Currently tracking Out of Stock i.e., in_stock = false)
      const { count: lowStockItems, error: err6 } = await client
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('in_stock', false);

      if (err1 || err2 || err3 || err4 || err5 || err6) {
        throw new Error("Failed to fetch stats");
      }

      // Calculate trends
      const orderTrend = this.calculateTrend(todayOrders || 0, yesterdayOrders || 0);
      const revenueTrend = this.calculateTrend(todayRevenue, yesterdayRevenue);
      // For active deliveries and low stock, comparing to yesterday requires historical snapshots which we don't have.
      // We will just return 0 trend or null for those for now, or compare to a naive assumption.
      // Let's just return 0 trend for point-in-time metrics.

      res.status(httpStatus.OK).json({
        todayOrders: todayOrders || 0,
        todayOrdersTrend: orderTrend,
        todayRevenue: todayRevenue,
        todayRevenueTrend: revenueTrend,
        activeDeliveries: activeDeliveries || 0,
        activeDeliveriesTrend: 0, 
        lowStockItems: lowStockItems || 0,
        lowStockItemsTrend: 0 
      });

    } catch (err: any) {
      console.error("Admin Stats Error:", err);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}
