import { createFileRoute } from "@tanstack/react-router";
import { ORDER_STATUS } from "@/lib/cleanlink-data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYMENT_PENDING_TAG = "__payment_pending__";

/**
 * POST /api/cleaner/orders/:id/claim
 * Người dọn bấm "Nhận đơn":
 *  - Kiểm tra race condition bằng điều kiện nguyên tử: id = :id AND cleaner_id IS NULL AND status = 'searching'
 *  - Gán cleaner_id = userId, cleaner_name = fullName, chuyển status = 'in_progress'
 *  - Trả về 409 nếu đã có thợ khác nhận trước đó.
 */
export const Route = createFileRoute("/api/cleaner/orders/$id/claim")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { requireCleaner, jsonResponse, errorResponse, HttpError } = await import(
          "@/lib/admin-auth.server"
        );
        try {
          const { supabase, userId, fullName } = await requireCleaner(request);

          const id = params.id;
          if (!UUID_RE.test(id)) throw new HttpError(400, "Mã đơn không hợp lệ");

          let bodyName: string | undefined;
          try {
            const body = (await request.json()) as { cleanerName?: string } | null;
            if (body?.cleanerName && body.cleanerName.trim()) {
              bodyName = body.cleanerName.trim();
            }
          } catch {
            // body optional
          }

          const cleanerName = bodyName || fullName;
          const now = new Date().toISOString();

          // Atomic UPDATE chống race condition (2 thợ bấm cùng lúc)
          const { data: claimed, error } = await supabase
            .from("bookings")
            .update({
              cleaner_id: userId,
              cleaner_name: cleanerName,
              status: ORDER_STATUS.IN_PROGRESS,
              checklist_done: [],
              accepted_at: now,
              updated_at: now,
            })
            .eq("id", id)
            .is("cleaner_id", null)
            .eq("status", ORDER_STATUS.READY_FOR_PICKUP)
            .select("*")
            .maybeSingle();

          if (error) throw error;

          if (!claimed) {
            throw new HttpError(
              409,
              "Đơn này vừa được người dọn khác nhận hoặc không còn ở trạng thái chờ nhận việc",
            );
          }

          return jsonResponse({
            order: {
              ...claimed,
              checklist_done: (claimed.checklist_done ?? []).filter(
                (x) => x !== PAYMENT_PENDING_TAG,
              ),
            },
          });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

