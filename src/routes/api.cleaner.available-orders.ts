import { createFileRoute } from "@tanstack/react-router";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/cleanlink-data";
import { cleanerPayoutFromBooking } from "@/lib/pricing";

const PAYMENT_PENDING_TAG = "__payment_pending__";

/**
 * GET /api/cleaner/available-orders?area=<area>
 * Lấy danh sách các đơn đã được Admin xác nhận thanh toán (status = "searching" / READY_FOR_PICKUP)
 * và chưa có người dọn nhận (cleaner_id IS NULL).
 * Hỗ trợ lọc theo khu vực hoạt động (area).
 */
export const Route = createFileRoute("/api/cleaner/available-orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { requireCleaner, jsonResponse, errorResponse } = await import(
          "@/lib/admin-auth.server"
        );
        try {
          const { supabase } = await requireCleaner(request);
          const url = new URL(request.url);
          const areaFilter = url.searchParams.get("area");

          let query = supabase
            .from("bookings")
            .select("*")
            .is("cleaner_id", null)
            .eq("status", ORDER_STATUS.READY_FOR_PICKUP)
            .order("created_at", { ascending: false });

          if (areaFilter && areaFilter !== "all") {
            query = query.eq("area", areaFilter);
          }

          const [{ data: rows, error }, { data: paymentFiles }] = await Promise.all([
            query,
            supabase.storage.from("booking-photos").list("payments", { limit: 1000 }),
          ]);
          if (error) throw error;

          const confirmedIds = new Set(
            (paymentFiles ?? [])
              .map((f) => f.name.replace(/\.json$/i, ""))
              .filter(Boolean),
          );

          const available = (rows ?? [])
            .filter((b) => {
              const rawPayStatus = (b as { payment_status?: string | null }).payment_status;
              if (rawPayStatus === PAYMENT_STATUS.PAID || confirmedIds.has(b.id)) return true;
              if (rawPayStatus === PAYMENT_STATUS.PENDING) return false;
              const hasPendingTag = (b.checklist_done ?? []).includes(PAYMENT_PENDING_TAG);
              return !hasPendingTag;
            })
            .map((b) => {
              const payout = cleanerPayoutFromBooking(b);
              return {
                ...b,
                checklist_done: (b.checklist_done ?? []).filter((x) => x !== PAYMENT_PENDING_TAG),
                payment_status: PAYMENT_STATUS.PAID,
                cleaner_earning: payout.cleanerTotal,
                platform_fee: payout.platformFee,
              };
            });

          return jsonResponse({ orders: available });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

