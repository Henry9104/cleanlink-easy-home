import { createFileRoute } from "@tanstack/react-router";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/cleanlink-data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYMENT_PENDING_TAG = "__payment_pending__";

function isMissingColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err && typeof err.code === "string" ? err.code : "";
  const msg = "message" in err && typeof err.message === "string" ? err.message : "";
  return code === "PGRST204" || code === "42703" || /column|schema cache/i.test(msg);
}

/**
 * PATCH /api/admin/orders/:id/confirm-payment
 * Admin xác nhận đã nhận chuyển khoản VietQR cho đơn đang chờ duyệt tiền:
 *   payment_status: pending → paid · paid_at = now · status: pending → searching (READY_FOR_PICKUP)
 * Trả về: 200 { order } · 401 chưa đăng nhập · 403 không phải admin · 404 không có đơn · 409 đơn đã duyệt
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

          const hasPendingTag = (existing.checklist_done ?? []).includes(PAYMENT_PENDING_TAG);
          const rawPaymentStatus = (existing as { payment_status?: string | null }).payment_status;
          const isAlreadyPaid =
            rawPaymentStatus === PAYMENT_STATUS.PAID ||
            (!rawPaymentStatus && existing.status !== ORDER_STATUS.PENDING_CONFIRMATION && !hasPendingTag);

          if (isAlreadyPaid && existing.status !== ORDER_STATUS.PENDING_CONFIRMATION && !hasPendingTag) {
            throw new HttpError(409, "Đơn này đã được xác nhận thanh toán trước đó");
          }

          const now = new Date().toISOString();
          const cleanChecklist = (existing.checklist_done ?? []).filter(
            (item) => item !== PAYMENT_PENDING_TAG,
          );
          let updatedOrder = null;

          const { data: order, error } = await supabase
            .from("bookings")
            .update({
              payment_status: PAYMENT_STATUS.PAID,
              paid_at: now,
              payment_confirmed_by: userId,
              status: ORDER_STATUS.READY_FOR_PICKUP,
              checklist_done: cleanChecklist,
              updated_at: now,
            })
            .eq("id", id)
            .select("*")
            .maybeSingle();

          if (error) {
            if (!isMissingColumnError(error)) throw error;
            // Fallback khi DB từ xa chưa chạy migration 0006
            const { data: fallbackOrder, error: fallbackError } = await supabase
              .from("bookings")
              .update({
                status: ORDER_STATUS.READY_FOR_PICKUP,
                checklist_done: cleanChecklist,
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

          // Lưu biên nhận xác nhận thanh toán vào bucket booking-photos/payments để đồng bộ mọi tài khoản
          const receiptBlob = new Blob(
            [JSON.stringify({ booking_id: id, paid_at: now, confirmed_by: userId })],
            { type: "application/json" },
          );
          await supabase.storage
            .from("booking-photos")
            .upload(`payments/${id}.json`, receiptBlob, {
              upsert: true,
              contentType: "application/json",
            })
            .catch(() => null);

          return jsonResponse({
            order: {
              ...(updatedOrder ?? existing),
              checklist_done: cleanChecklist,
              status: ORDER_STATUS.READY_FOR_PICKUP,
              payment_status: PAYMENT_STATUS.PAID,
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
