import { createFileRoute } from "@tanstack/react-router";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isMissingColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err && typeof err.code === "string" ? err.code : "";
  const msg = "message" in err && typeof err.message === "string" ? err.message : "";
  return code === "PGRST204" || code === "42703" || /column|schema cache/i.test(msg);
}

/**
 * PATCH /api/admin/orders/:id/confirm-payment
 * Admin xác nhận đã nhận chuyển khoản VietQR cho đơn đang chờ xác nhận tiền:
 *   payment_status: pending → paid · paid_at = now · status: pending → searching (để người dọn nhận việc)
 * Trả về: 200 { order } · 401 chưa đăng nhập · 403 không phải admin · 404 không có đơn · 409 đơn không còn chờ xác nhận
 */
export const Route = createFileRoute("/api/admin/orders/$id/confirm-payment")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const { requireAdmin, jsonResponse, errorResponse, HttpError } = await import(
          "@/lib/admin-auth.server"
        );
        try {
          const { supabase, userId } = await requireAdmin(request);

          const id = params.id;
          if (!UUID_RE.test(id)) throw new HttpError(400, "Mã đơn không hợp lệ");

          const { data: existing, error: lookupError } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (!existing) throw new HttpError(404, "Không tìm thấy đơn");

          const currentPaymentStatus =
            (existing as { payment_status?: string | null }).payment_status ??
            (existing.status === "pending" ? "pending" : "paid");

          if (currentPaymentStatus === "paid" && existing.status !== "pending") {
            throw new HttpError(409, "Đơn này đã được xác nhận thanh toán trước đó");
          }

          const now = new Date().toISOString();
          let updatedOrder = null;

          const { data: order, error } = await supabase
            .from("bookings")
            .update({
              payment_status: "paid",
              paid_at: now,
              payment_confirmed_by: userId,
              status: "searching",
              updated_at: now,
            })
            .eq("id", id)
            .select("*")
            .maybeSingle();

          if (error) {
            if (!isMissingColumnError(error)) throw error;
            // Fallback khi DB từ xa chưa chạy migration 0006 (chưa có cột payment_status/paid_at)
            const { data: fallbackOrder, error: fallbackError } = await supabase
              .from("bookings")
              .update({
                status: "searching",
                updated_at: now,
              })
              .eq("id", id)
              .select("*")
              .maybeSingle();
            if (fallbackError) throw fallbackError;
            updatedOrder = fallbackOrder;
          } else {
            updatedOrder = order;
          }

          return jsonResponse({
            order: {
              ...(updatedOrder ?? existing),
              status: "searching",
              payment_status: "paid",
              paid_at: now,
              payment_confirmed_by: userId,
            },
          });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});
