import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  type BookingStatus,
  type PaymentStatus,
} from "@/lib/cleanlink-data";

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

export const PAYMENT_PENDING_TAG = "__payment_pending__";

/** Các bước trạng thái hiển thị cho chủ cơ sở, quản trị viên và người dọn */
export const flowSteps: { key: BookingStatus; label: string }[] = [
  { key: "pending", label: "Chờ Admin duyệt tiền chuyển khoản" },
  { key: "searching", label: "Đã duyệt tiền – Đang chờ người dọn nhận đơn" },
  { key: "accepted", label: "Người dọn đã nhận đơn" },
  { key: "in_progress", label: "Đang thực hiện dọn phòng" },
  { key: "photo_sent", label: "Đã gửi ảnh xác nhận sau khi dọn" },
  { key: "completed", label: "Chủ cơ sở đã xác nhận hoàn thành" },
  { key: "reviewed", label: "Đã đánh giá dịch vụ" },
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
const ADMIN_CRUD_STORAGE_KEY = "cleanlink:admin-crud-v1";

type LocalPaymentMeta = {
  paid_at: string;
  confirmed_by?: string | null;
};

type AdminBookingOverlaySlice = {
  bookingPatches?: Record<string, Partial<BookingRow>>;
  createdBookings?: Record<string, BookingRow>;
  deletedBookingIds?: string[];
};

function readAdminBookingOverlay(): AdminBookingOverlaySlice {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ADMIN_CRUD_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminBookingOverlaySlice) : {};
  } catch {
    return {};
  }
}

// Bộ nhớ đệm biên nhận thanh toán (đồng bộ từ cả localStorage và Supabase Storage)
let memoryConfirmedIds = new Set<string>();

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
  memoryConfirmedIds.add(bookingId);
  if (typeof window === "undefined") return;
  try {
    const map = readConfirmedMap();
    map[bookingId] = meta;
    localStorage.setItem(CONFIRMED_PAYMENTS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

/**
 * Đồng bộ danh sách biên nhận xác nhận thanh toán từ bucket `booking-photos/payments`
 * để mọi tài khoản (Host, Admin, Cleaner) trên các trình duyệt khác nhau đều nhận biết ngay
 * đơn nào đã được Admin duyệt tiền.
 */
export async function syncPaymentReceipts(): Promise<Set<string>> {
  try {
    const { data: files } = await supabase.storage
      .from("booking-photos")
      .list("payments", { limit: 1000 });
    if (files && files.length > 0) {
      const next = new Set<string>(memoryConfirmedIds);
      for (const f of files) {
        const id = f.name.replace(/\.json$/i, "");
        if (id && id.length >= 32) {
          next.add(id);
          if (!readConfirmedMap()[id]) {
            recordLocalPaymentConfirmation(id, {
              paid_at: f.created_at ?? new Date().toISOString(),
            });
          }
        }
      }
      memoryConfirmedIds = next;
    }
  } catch {
    // ignore storage list errors
  }
  return memoryConfirmedIds;
}

function isConfirmedInCache(bookingId?: string): boolean {
  if (!bookingId) return false;
  return memoryConfirmedIds.has(bookingId) || Boolean(readConfirmedMap()[bookingId]);
}

/** Xác định trạng thái thanh toán của đơn (tương thích cả trước và sau khi chạy migration 0006) */
export function getPaymentStatus(
  b: Pick<BookingRow, "status"> & {
    payment_status?: string | null;
    checklist_done?: string[] | null;
    cleaner_id?: string | null;
    id?: string;
  },
): PaymentStatus {
  const adminPatch = b.id ? readAdminBookingOverlay().bookingPatches?.[b.id] : undefined;
  if (adminPatch?.payment_status === PAYMENT_STATUS.PENDING) return PAYMENT_STATUS.PENDING;
  if (adminPatch?.payment_status === PAYMENT_STATUS.PAID) return PAYMENT_STATUS.PAID;
  if (isConfirmedInCache(b.id)) return PAYMENT_STATUS.PAID;
  if (b.payment_status === PAYMENT_STATUS.PAID) return PAYMENT_STATUS.PAID;
  if (b.cleaner_id) return PAYMENT_STATUS.PAID;
  if (
    ["accepted", "on_the_way", "in_progress", "work_done", "photo_sent", "completed", "reviewed"].includes(
      b.status,
    )
  ) {
    return PAYMENT_STATUS.PAID;
  }
  if (b.payment_status === PAYMENT_STATUS.PENDING) return PAYMENT_STATUS.PENDING;
  if ((b.checklist_done ?? []).includes(PAYMENT_PENDING_TAG)) return PAYMENT_STATUS.PENDING;
  return b.status === ORDER_STATUS.PENDING_CONFIRMATION
    ? PAYMENT_STATUS.PENDING
    : PAYMENT_STATUS.PAID;
}

/**
 * Chuẩn hoá bản ghi đơn hàng:
 * - Tách bỏ thẻ nội bộ `__payment_pending__` khỏi `checklist_done`
 * - Hợp nhất các chỉnh sửa của Admin (nếu có)
 * - Đồng bộ `payment_status` và `status` theo đúng bước nghiệp vụ
 */
export function normalizeBookingRow(row: BookingRow | null): BookingRow | null {
  if (!row) return null;
  const overlay = readAdminBookingOverlay();
  if ((overlay.deletedBookingIds ?? []).includes(row.id)) return null;
  const adminPatch = overlay.bookingPatches?.[row.id];
  const mergedRow: BookingRow = adminPatch ? { ...row, ...adminPatch } : row;

  const local = readConfirmedMap()[mergedRow.id];
  const paymentStatus = getPaymentStatus(mergedRow);
  const cleanChecklist = (mergedRow.checklist_done ?? []).filter((x) => x !== PAYMENT_PENDING_TAG);

  let effectiveStatus = mergedRow.status;
  if (
    paymentStatus === PAYMENT_STATUS.PENDING &&
    !mergedRow.cleaner_id &&
    mergedRow.status !== "cancelled"
  ) {
    effectiveStatus = ORDER_STATUS.PENDING_CONFIRMATION;
  } else if (
    paymentStatus === PAYMENT_STATUS.PAID &&
    mergedRow.status === ORDER_STATUS.PENDING_CONFIRMATION
  ) {
    effectiveStatus = ORDER_STATUS.READY_FOR_PICKUP;
  }

  return {
    ...mergedRow,
    checklist_done: cleanChecklist,
    payment_status: paymentStatus,
    paid_at: mergedRow.paid_at ?? local?.paid_at ?? null,
    payment_confirmed_by: mergedRow.payment_confirmed_by ?? local?.confirmed_by ?? null,
    status: effectiveStatus,
  };
}

export function normalizeBookingRows(rows: BookingRow[]): BookingRow[] {
  const overlay = readAdminBookingOverlay();
  const deleted = new Set(overlay.deletedBookingIds ?? []);
  const result: BookingRow[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    if (deleted.has(r.id)) continue;
    const normalized = normalizeBookingRow(r);
    if (normalized) {
      result.push(normalized);
      seen.add(r.id);
    }
  }

  for (const [id, created] of Object.entries(overlay.createdBookings ?? {})) {
    if (deleted.has(id) || seen.has(id)) continue;
    const normalized = normalizeBookingRow(created);
    if (normalized) {
      result.push(normalized);
      seen.add(id);
    }
  }

  return result.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

// Giữ alias tương thích ngược
export const applyLocalPaymentConfirmation = normalizeBookingRow;
export const applyLocalPaymentConfirmations = normalizeBookingRows;

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
 * Lưu đơn đặt dọn phòng khi khách bấm "Tôi đã chuyển khoản" ở trang /thanh-toan:
 * - Nếu DB đã có cột `payment_status` (migration 0006): lưu `status = "pending"`, `payment_status = "pending"`.
 * - Nếu DB từ xa chưa chạy migration 0006: lưu `status = "searching"` kèm `checklist_done = ["__payment_pending__"]`
 *   để RLS của Người dọn (0002) cho phép truy vấn/nhận việc ngay sau khi Admin duyệt tiền, trong khi
 *   trước lúc duyệt tiền đơn vẫn hiển thị là "Chờ duyệt tiền" và hoàn toàn ẩn khỏi màn hình Người dọn.
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
    };

    const fullPayload = {
      ...basePayload,
      status: ORDER_STATUS.PENDING_CONFIRMATION,
      payment_method: PAYMENT_METHOD,
      payment_status: PAYMENT_STATUS.PENDING,
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
      // Fallback tương thích RLS 0002: lưu status = "searching" + cờ "__payment_pending__" trong checklist_done
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("bookings")
        .insert({
          ...basePayload,
          status: ORDER_STATUS.READY_FOR_PICKUP,
          checklist_done: [PAYMENT_PENDING_TAG],
        })
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
 * - Gọi API PATCH /api/admin/orders/:id/confirm-payment (kiểm tra quyền ADMIN).
 * - Cập nhật payment_status = "paid", paid_at = now, status = "searching" (READY_FOR_PICKUP).
 * - Lưu biên nhận vào bucket `booking-photos/payments/${id}.json` để màn hình Người dọn nhận đơn ngay lập tức.
 */
export async function confirmBookingPayment(bookingId: string): Promise<BookingRow> {
  const now = new Date().toISOString();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const adminUserId = sessionData.session?.user?.id ?? null;

  const uploadReceipt = async () => {
    try {
      const blob = new Blob(
        [JSON.stringify({ booking_id: bookingId, paid_at: now, confirmed_by: adminUserId })],
        { type: "application/json" },
      );
      await supabase.storage.from("booking-photos").upload(`payments/${bookingId}.json`, blob, {
        upsert: true,
        contentType: "application/json",
      });
    } catch {
      // ignore storage error
    }
  };

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
      await uploadReceipt();
      return normalizeBookingRow(body.order)!;
    }

    if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 409) {
      throw new Error(body?.error || "Không thể xác nhận thanh toán cho đơn này");
    }
  } catch (err) {
    if (
      err instanceof Error &&
      /đăng nhập|quản trị|Không tìm thấy|trước đó|không hợp lệ/i.test(err.message)
    ) {
      throw err;
    }
  }

  await uploadReceipt();
  recordLocalPaymentConfirmation(bookingId, { paid_at: now, confirmed_by: adminUserId });

  const { data: fullUpdate, error: fullError } = await supabase
    .from("bookings")
    .update({
      payment_status: PAYMENT_STATUS.PAID,
      paid_at: now,
      payment_confirmed_by: adminUserId,
      status: ORDER_STATUS.READY_FOR_PICKUP,
      checklist_done: [],
      updated_at: now,
    })
    .eq("id", bookingId)
    .select("*")
    .maybeSingle();

  if (!fullError && fullUpdate) {
    return normalizeBookingRow(fullUpdate as BookingRow)!;
  }

  if (fullError && !isMissingColumnError(fullError)) {
    throw new Error(getErrorMessage(fullError, "Không xác nhận được thanh toán, vui lòng thử lại"));
  }

  const { data: baseUpdate, error: baseError } = await supabase
    .from("bookings")
    .update({
      status: ORDER_STATUS.READY_FOR_PICKUP,
      checklist_done: [],
      updated_at: now,
    })
    .eq("id", bookingId)
    .select("*")
    .maybeSingle();

  if (baseError) {
    throw new Error(getErrorMessage(baseError, "Không xác nhận được thanh toán, vui lòng thử lại"));
  }

  const existing = baseUpdate ?? (await fetchBooking(bookingId));
  if (!existing) {
    throw new Error("Không tìm thấy đơn để xác nhận thanh toán");
  }

  return normalizeBookingRow({
    ...(existing as BookingRow),
    checklist_done: [],
    status: ORDER_STATUS.READY_FOR_PICKUP,
    payment_status: PAYMENT_STATUS.PAID,
    paid_at: now,
    payment_confirmed_by: adminUserId,
  })!;
}

/**
 * Tự động nâng cấp các đơn cũ đang ở `status = "pending"` (nếu DB chưa chạy migration 0006)
 * sang `status = "searching"` để sau khi Admin duyệt tiền, Người dọn có thể nhìn thấy và nhận đơn qua RLS 0002.
 */
export async function ensureRlsCompatiblePendingRows(rows: BookingRow[], currentUserId?: string) {
  for (const r of rows) {
    const rawPayStatus = (r as { payment_status?: string | null }).payment_status;
    if (
      r.status === ORDER_STATUS.PENDING_CONFIRMATION &&
      rawPayStatus === undefined &&
      (!currentUserId || r.host_id === currentUserId)
    ) {
      const nextChecklist = isConfirmedInCache(r.id)
        ? (r.checklist_done ?? []).filter((x) => x !== PAYMENT_PENDING_TAG)
        : Array.from(new Set([...(r.checklist_done ?? []), PAYMENT_PENDING_TAG]));
      await supabase
        .from("bookings")
        .update({
          status: ORDER_STATUS.READY_FOR_PICKUP,
          checklist_done: nextChecklist,
        })
        .eq("id", r.id);
    }
  }
}

export async function fetchBooking(id: string) {
  await syncPaymentReceipts();
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (data) {
    await ensureRlsCompatiblePendingRows([data as BookingRow]);
  }
  const normalized = normalizeBookingRow(data as BookingRow | null);
  if (normalized) return normalized;
  const created = readAdminBookingOverlay().createdBookings?.[id] ?? null;
  return normalizeBookingRow(created);
}

export async function fetchHostBookings(hostId: string) {
  await syncPaymentReceipts();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rawRows = (data ?? []) as BookingRow[];
  await ensureRlsCompatiblePendingRows(rawRows, hostId);
  return normalizeBookingRows(rawRows).filter((b) => b.host_id === hostId);
}

/**
 * Lấy danh sách đơn cho màn hình Người dọn:
 * - Gồm các đơn đã được Admin duyệt tiền & đang chờ người dọn (status = "searching", payment_status = "paid", cleaner_id = null)
 * - Và các đơn do chính người dọn hiện tại đã nhận (cleaner_id = user.id)
 */
export async function fetchCleanerBookings() {
  await syncPaymentReceipts();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return normalizeBookingRows((data ?? []) as BookingRow[]);
}

/**
 * Gọi API `GET /api/cleaner/available-orders` (kèm fallback qua Supabase client)
 * để lấy danh sách đơn mới chờ nhận việc, có hỗ trợ lọc theo khu vực (`area`).
 */
export async function fetchAvailableOrders(area?: string): Promise<BookingRow[]> {
  await syncPaymentReceipts();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (token) {
    try {
      const qs = area && area !== "all" ? `?area=${encodeURIComponent(area)}` : "";
      const res = await fetch(`/api/cleaner/available-orders${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = (await res.json()) as { orders?: BookingRow[] };
        if (Array.isArray(body.orders)) {
          return normalizeBookingRows(body.orders).filter(
            (b) =>
              !b.cleaner_id &&
              b.status === ORDER_STATUS.READY_FOR_PICKUP &&
              getPaymentStatus(b) === PAYMENT_STATUS.PAID &&
              (!area || area === "all" || b.area === area),
          );
        }
      }
    } catch {
      // Fallback sang truy vấn trực tiếp bên dưới
    }
  }

  const all = await fetchCleanerBookings();
  return all.filter(
    (b) =>
      !b.cleaner_id &&
      b.status === ORDER_STATUS.READY_FOR_PICKUP &&
      getPaymentStatus(b) === PAYMENT_STATUS.PAID &&
      (!area || area === "all" || b.area === area),
  );
}

/**
 * Người dọn bấm "Nhận đơn":
 * - Gọi `POST /api/cleaner/orders/:id/claim` (kiểm tra race condition)
 * - Cập nhật `cleaner_id = cleanerId`, `cleaner_name = cleanerName`, `status = "in_progress"`
 * - Tránh 2 thợ cùng nhận 1 đơn bằng điều kiện `.is("cleaner_id", null).eq("status", "searching")`.
 */
export async function acceptJob(
  bookingId: string,
  cleanerId: string,
  cleanerName: string,
): Promise<BookingRow> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (token) {
    try {
      const res = await fetch(`/api/cleaner/orders/${bookingId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cleanerName }),
      });
      const body = (await res.json().catch(() => null)) as {
        order?: BookingRow;
        error?: string;
      } | null;

      if (res.ok && body?.order) {
        return normalizeBookingRow(body.order)!;
      }
      if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 409) {
        throw new Error(body?.error || "Không thể nhận đơn này");
      }
    } catch (err) {
      if (
        err instanceof Error &&
        /người dọn khác|không còn|đăng nhập|Không tìm thấy/i.test(err.message)
      ) {
        throw err;
      }
    }
  }

  // Fallback atomic update trực tiếp qua Supabase
  const now = new Date().toISOString();
  const { data: claimed, error } = await supabase
    .from("bookings")
    .update({
      cleaner_id: cleanerId,
      cleaner_name: cleanerName,
      status: ORDER_STATUS.IN_PROGRESS,
      checklist_done: [],
      accepted_at: now,
      updated_at: now,
    })
    .eq("id", bookingId)
    .is("cleaner_id", null)
    .eq("status", ORDER_STATUS.READY_FOR_PICKUP)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "Không nhận được đơn này, vui lòng thử lại"));
  }
  if (!claimed) {
    throw new Error("Đơn này vừa được người dọn khác nhận hoặc không còn khả dụng");
  }

  return normalizeBookingRow(claimed as BookingRow)!;
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
