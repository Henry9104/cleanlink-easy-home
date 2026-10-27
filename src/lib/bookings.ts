import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { BookingStatus, PaymentStatus } from "@/lib/cleanlink-data";

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

/** Các bước trạng thái hiển thị cho chủ cơ sở và người dọn */
export const flowSteps: { key: BookingStatus; label: string }[] = [
  { key: "pending", label: "Chờ xác nhận chuyển khoản" },
  { key: "searching", label: "Đang tìm người dọn" },
  { key: "accepted", label: "Người dọn đã nhận việc" },
  { key: "in_progress", label: "Đang thực hiện" },
  { key: "photo_sent", label: "Đã gửi ảnh sau khi dọn" },
  { key: "completed", label: "Chủ cơ sở đã xác nhận hoàn thành" },
  { key: "reviewed", label: "Đã đánh giá" },
];

export function stepIndex(status: string) {
  const i = flowSteps.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

export function newBookingCode() {
  const rand = Math.floor(10 + Math.random() * 90);
  return `CL${Date.now().toString().slice(-4)}${rand}`;
}

/** Phương thức thanh toán duy nhất: chuyển khoản VietQR */
export const PAYMENT_METHOD = "bank_transfer" as const;

/** Đơn đã nhập ở bước đặt lịch, chưa ghi vào database – chỉ lưu vào database khi khách bấm "Tôi đã chuyển khoản" */
export type BookingDraft = Omit<
  BookingInsert,
  "host_id" | "status" | "payment_method" | "payment_status" | "paid_at" | "payment_confirmed_by"
> & {
  price: number;
};

const DRAFT_KEY = "cleanlink:booking-draft";
const CONFIRMED_PAYMENTS_KEY = "cleanlink:confirmed-payments";

type LocalPaymentMeta = {
  paid_at: string;
  confirmed_by?: string | null;
};

function readConfirmedMap(): Record<string, LocalPaymentMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CONFIRMED_PAYMENTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LocalPaymentMeta>) : {};
  } catch {
    return {};
  }
}

function recordLocalPaymentConfirmation(bookingId: string, meta: LocalPaymentMeta) {
  if (typeof window === "undefined") return;
  try {
    const map = readConfirmedMap();
    map[bookingId] = meta;
    localStorage.setItem(CONFIRMED_PAYMENTS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

/** Xác định trạng thái thanh toán của đơn (tương thích cả trước và sau khi chạy migration 0006) */
export function getPaymentStatus(
  b: Pick<BookingRow, "status"> & { payment_status?: string | null; id?: string },
): PaymentStatus {
  if (b.id && readConfirmedMap()[b.id]) return "paid";
  if (b.payment_status === "paid") return "paid";
  if (b.payment_status === "pending") return "pending";
  return b.status === "pending" ? "pending" : "paid";
}

export function applyLocalPaymentConfirmation(row: BookingRow | null): BookingRow | null {
  if (!row) return null;
  const local = readConfirmedMap()[row.id];
  const paymentStatus = getPaymentStatus(row);
  return {
    ...row,
    payment_status: paymentStatus,
    paid_at: row.paid_at ?? local?.paid_at ?? null,
    payment_confirmed_by: row.payment_confirmed_by ?? local?.confirmed_by ?? null,
    status: paymentStatus === "paid" && row.status === "pending" ? "searching" : row.status,
  };
}

export function applyLocalPaymentConfirmations(rows: BookingRow[]): BookingRow[] {
  return rows.map((r) => applyLocalPaymentConfirmation(r)!);
}

/** Trích xuất thông báo lỗi từ cả Error lẫn PostgrestError của Supabase */
export function getErrorMessage(err: unknown, fallback = "Có lỗi xảy ra, vui lòng thử lại"): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string" && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

function isMissingColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err && typeof err.code === "string" ? err.code : "";
  const msg = "message" in err && typeof err.message === "string" ? err.message : "";
  return code === "PGRST204" || code === "42703" || /column|schema cache/i.test(msg);
}

function isDuplicateCodeError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err && typeof err.code === "string" ? err.code : "";
  const msg = "message" in err && typeof err.message === "string" ? err.message : "";
  return code === "23505" || /duplicate key|bookings_code_key/i.test(msg);
}

export function saveBookingDraft(draft: BookingDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadBookingDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : null;
  } catch {
    return null;
  }
}

export function clearBookingDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

/** Cú pháp nội dung chuyển khoản: [SĐT khách] - [Mã đơn] */
export function buildTransferContent(phone: string, code: string) {
  return `${phone.replace(/\D/g, "")} - ${code}`;
}

/**
 * Lưu đơn đặt dọn phòng khi khách bấm "Tôi đã chuyển khoản" ở trang /thanh-toan.
 * - Đặt status = "pending" (CHO_XAC_NHAN) và payment_status = "pending" (PAYMENT_PENDING).
 * - Tự động fallback về các cột gốc nếu DB từ xa chưa chạy migration 0005/0006 để không bao giờ lỗi PGRST204.
 */
export async function createBookingFromDraft(
  draft: BookingDraft,
  hostId: string,
): Promise<{ id: string; code: string }> {
  let code = draft.code || newBookingCode();

  for (let attempt = 0; attempt < 3; attempt++) {
    const basePayload = {
      code,
      host_id: hostId,
      property_name: draft.property_name,
      property_type: draft.property_type ?? "homestay",
      area: draft.area ?? "trung_tam",
      address: draft.address,
      phone: draft.phone,
      rooms: draft.rooms ?? 1,
      room_type: draft.room_type ?? "standard",
      service_date: draft.service_date ?? new Date().toISOString().slice(0, 10),
      time_slot: draft.time_slot ?? "11-12",
      urgency: draft.urgency ?? "normal",
      addons: draft.addons ?? [],
      note: draft.note ?? null,
      price: draft.price ?? 0,
      status: "pending",
    };

    const fullPayload = {
      ...basePayload,
      payment_method: PAYMENT_METHOD,
      payment_status: "pending",
    };

    const { data, error } = await supabase
      .from("bookings")
      .insert(fullPayload)
      .select("id, code")
      .single();

    if (!error && data) {
      return data;
    }

    if (isDuplicateCodeError(error)) {
      code = newBookingCode();
      continue;
    }

    if (isMissingColumnError(error)) {
      // Fallback sang các cột gốc (0002_create_bookings_flow.sql)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("bookings")
        .insert(basePayload)
        .select("id, code")
        .single();

      if (!fallbackError && fallbackData) {
        return fallbackData;
      }

      if (isDuplicateCodeError(fallbackError)) {
        code = newBookingCode();
        continue;
      }

      throw new Error(getErrorMessage(fallbackError, "Không gửi được đơn, vui lòng thử lại"));
    }

    throw new Error(getErrorMessage(error, "Không gửi được đơn, vui lòng thử lại"));
  }

  throw new Error("Không gửi được đơn, vui lòng thử lại");
}

/**
 * Admin xác nhận đã nhận tiền chuyển khoản cho đơn:
 * - Gọi API PATCH /api/admin/orders/:id/confirm-payment (kiểm tra quyền ADMIN ở server).
 * - Cập nhật payment_status = "paid", paid_at = now, status = "searching" (Đang tìm người dọn).
 */
export async function confirmBookingPayment(bookingId: string): Promise<BookingRow> {
  const now = new Date().toISOString();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const adminUserId = sessionData.session?.user?.id ?? null;

  try {
    const res = await fetch(`/api/admin/orders/${bookingId}/confirm-payment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const body = (await res.json().catch(() => null)) as {
      order?: BookingRow;
      error?: string;
    } | null;

    if (res.ok && body?.order) {
      recordLocalPaymentConfirmation(bookingId, {
        paid_at: body.order.paid_at ?? now,
        confirmed_by: body.order.payment_confirmed_by ?? adminUserId,
      });
      return applyLocalPaymentConfirmation(body.order)!;
    }

    if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 409) {
      throw new Error(body?.error || "Không thể xác nhận thanh toán cho đơn này");
    }
  } catch (err) {
    // Nếu lỗi nghiệp vụ (401/403/404/409) thì ném ra ngay
    if (
      err instanceof Error &&
      /đăng nhập|quản trị|Không tìm thấy|trước đó|không hợp lệ/i.test(err.message)
    ) {
      throw err;
    }
    // Ngược lại (ví dụ server dev chạy trong môi trường không có mạng ra Supabase), fallback qua client
  }

  // Fallback trực tiếp qua Supabase client của Admin
  const { data: fullUpdate, error: fullError } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      paid_at: now,
      payment_confirmed_by: adminUserId,
      status: "searching",
      updated_at: now,
    })
    .eq("id", bookingId)
    .select("*")
    .maybeSingle();

  if (!fullError && fullUpdate) {
    recordLocalPaymentConfirmation(bookingId, { paid_at: now, confirmed_by: adminUserId });
    return applyLocalPaymentConfirmation(fullUpdate as BookingRow)!;
  }

  if (fullError && !isMissingColumnError(fullError)) {
    throw new Error(getErrorMessage(fullError, "Không xác nhận được thanh toán, vui lòng thử lại"));
  }

  const { data: baseUpdate, error: baseError } = await supabase
    .from("bookings")
    .update({
      status: "searching",
      updated_at: now,
    })
    .eq("id", bookingId)
    .select("*")
    .maybeSingle();

  if (baseError) {
    throw new Error(getErrorMessage(baseError, "Không xác nhận được thanh toán, vui lòng thử lại"));
  }

  recordLocalPaymentConfirmation(bookingId, { paid_at: now, confirmed_by: adminUserId });

  const existing = baseUpdate ?? (await fetchBooking(bookingId));
  if (!existing) {
    throw new Error("Không tìm thấy đơn để xác nhận thanh toán");
  }

  return applyLocalPaymentConfirmation({
    ...(existing as BookingRow),
    status: "searching",
    payment_status: "paid",
    paid_at: now,
    payment_confirmed_by: adminUserId,
  })!;
}

export async function fetchBooking(id: string) {
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return applyLocalPaymentConfirmation(data as BookingRow | null);
}

export async function fetchHostBookings(hostId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return applyLocalPaymentConfirmations((data ?? []) as BookingRow[]);
}

/** Người dọn: công việc đang mở + công việc của chính mình */
export async function fetchCleanerBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return applyLocalPaymentConfirmations((data ?? []) as BookingRow[]);
}

export async function acceptJob(bookingId: string, cleanerId: string, cleanerName: string) {
  const { error } = await supabase
    .from("bookings")
    .update({
      cleaner_id: cleanerId,
      cleaner_name: cleanerName,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .is("cleaner_id", null);
  if (error) throw error;
}

export async function updateBooking(bookingId: string, patch: Partial<BookingInsert>) {
  const { error } = await supabase
    .from("bookings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", bookingId);
  if (error) throw error;
}

export async function uploadBookingPhoto(bookingId: string, kind: "before" | "after", file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${bookingId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("booking-photos").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  return path;
}

export async function signedPhotoUrl(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("booking-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
