import { supabase } from "@/integrations/supabase/client";
import {
  PAYMENT_METHOD,
  PAYMENT_PENDING_TAG,
  confirmBookingPayment,
  ensureRlsCompatiblePendingRows,
  newBookingCode,
  normalizeBookingRow,
  syncPaymentReceipts,
  type BookingRow,
} from "@/lib/bookings";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  type BookingStatus,
  type PaymentStatus,
} from "@/lib/cleanlink-data";

export type AppRoleKey = "host" | "cleaner" | "admin";

export const ADMIN_ROLE_LABELS: Record<AppRoleKey, string> = {
  host: "Khách hàng",
  cleaner: "Người dọn",
  admin: "Admin",
};

export const ADMIN_ROLE_BADGE_CLASS: Record<AppRoleKey, string> = {
  host: "bg-sky-100 text-sky-800 border-sky-200",
  cleaner: "bg-emerald-100 text-emerald-800 border-emerald-200",
  admin: "bg-purple-100 text-purple-800 border-purple-200",
};

export type AdminBookingRow = BookingRow & {
  customer_name?: string | null;
};

export type AdminUserRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  property_name: string | null;
  area: string | null;
  roles: AppRoleKey[];
  status: "active" | "locked";
  created_at: string;
};

export type AdminReviewRow = {
  id: string;
  booking_id: string;
  booking_code?: string | null;
  host_id: string;
  customer_name?: string | null;
  cleaner_id: string | null;
  cleaner_name?: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

type AdminCrudState = {
  bookingPatches: Record<string, Partial<AdminBookingRow>>;
  createdBookings: Record<string, AdminBookingRow>;
  deletedBookingIds: string[];
  userPatches: Record<string, Partial<AdminUserRow>>;
  createdUsers: Record<string, AdminUserRow>;
  deletedUserIds: string[];
  reviewPatches: Record<string, Partial<AdminReviewRow>>;
  createdReviews: Record<string, AdminReviewRow>;
  deletedReviewIds: string[];
  updatedAt: string;
};

const STORAGE_KEY = "cleanlink:admin-crud-v1";
const REMOTE_STATE_PATH = "admin/crud-state.json";

function emptyState(): AdminCrudState {
  return {
    bookingPatches: {},
    createdBookings: {},
    deletedBookingIds: [],
    userPatches: {},
    createdUsers: {},
    deletedUserIds: [],
    reviewPatches: {},
    createdReviews: {},
    deletedReviewIds: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export function readAdminCrudState(): AdminCrudState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<AdminCrudState>;
    return {
      ...emptyState(),
      ...parsed,
    };
  } catch {
    return emptyState();
  }
}

async function persistAdminCrudState(next: AdminCrudState): Promise<void> {
  const stamped: AdminCrudState = {
    ...next,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
    } catch {
      // ignore storage quota errors
    }
  }
  try {
    const blob = new Blob([JSON.stringify(stamped)], { type: "application/json" });
    await supabase.storage.from("booking-photos").upload(REMOTE_STATE_PATH, blob, {
      upsert: true,
      contentType: "application/json",
    });
  } catch {
    // ignore remote sync error
  }
}

export async function syncRemoteAdminCrudState(): Promise<AdminCrudState> {
  const local = readAdminCrudState();
  try {
    const { data: signed } = await supabase.storage
      .from("booking-photos")
      .createSignedUrl(REMOTE_STATE_PATH, 60);
    if (signed?.signedUrl) {
      const res = await fetch(`${signed.signedUrl}&t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const remote = (await res.json()) as Partial<AdminCrudState>;
        if (remote && typeof remote === "object") {
          const remoteTime = remote.updatedAt ? Date.parse(remote.updatedAt) : 0;
          const localTime = local.updatedAt ? Date.parse(local.updatedAt) : 0;
          if (remoteTime > localTime) {
            const merged: AdminCrudState = {
              ...emptyState(),
              ...remote,
            };
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            }
            return merged;
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return local;
}

function genUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isMissingColumnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err && typeof err.code === "string" ? err.code : "";
  const msg = "message" in err && typeof err.message === "string" ? err.message : "";
  return code === "PGRST204" || code === "42703" || /column|schema cache/i.test(msg);
}

/** Áp dụng các chỉnh sửa/xóa của Admin lên danh sách bookings */
export function applyAdminBookingOverlay(rows: BookingRow[]): AdminBookingRow[] {
  const state = readAdminCrudState();
  const deleted = new Set(state.deletedBookingIds);
  const byId = new Map<string, AdminBookingRow>();

  for (const r of rows) {
    if (deleted.has(r.id)) continue;
    const normalized = normalizeBookingRow(r)!;
    const patch = state.bookingPatches[r.id];
    byId.set(r.id, patch ? ({ ...normalized, ...patch } as AdminBookingRow) : normalized);
  }

  for (const [id, created] of Object.entries(state.createdBookings)) {
    if (deleted.has(id)) continue;
    if (!byId.has(id)) {
      const patch = state.bookingPatches[id];
      byId.set(id, patch ? ({ ...created, ...patch } as AdminBookingRow) : created);
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );
}

/** Tải toàn bộ dữ liệu quản trị đã hợp nhất (Bookings, Users, Reviews) */
export async function loadMergedAdminData(): Promise<{
  bookings: AdminBookingRow[];
  users: AdminUserRow[];
  reviews: AdminReviewRow[];
}> {
  await Promise.all([syncPaymentReceipts(), syncRemoteAdminCrudState()]);
  const state = readAdminCrudState();

  const [bRes, pRes, rRes, roRes] = await Promise.all([
    supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, phone, full_name, property_name, area, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("id, booking_id, host_id, cleaner_id, rating, comment, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  const rawBookings = (bRes.data ?? []) as BookingRow[];
  await ensureRlsCompatiblePendingRows(rawBookings);
  const bookings = applyAdminBookingOverlay(rawBookings);

  // Merge Users (Profiles + Roles)
  const deletedUsers = new Set(state.deletedUserIds);
  const roleRows = (roRes.data ?? []) as { user_id: string; role: AppRoleKey }[];
  const userMap = new Map<string, AdminUserRow>();

  for (const p of (pRes.data ?? []) as {
    id: string;
    phone: string;
    full_name: string;
    property_name: string | null;
    area: string | null;
    created_at: string;
  }[]) {
    if (deletedUsers.has(p.id)) continue;
    const dbRoles = roleRows.filter((r) => r.user_id === p.id).map((r) => r.role);
    const baseUser: AdminUserRow = {
      id: p.id,
      full_name: p.full_name || "Chưa đặt tên",
      phone: p.phone || "",
      email: null,
      property_name: p.property_name,
      area: p.area,
      roles: dbRoles.length > 0 ? dbRoles : ["host"],
      status: "active",
      created_at: p.created_at,
    };
    const patch = state.userPatches[p.id];
    userMap.set(p.id, patch ? { ...baseUser, ...patch } : baseUser);
  }

  for (const [id, created] of Object.entries(state.createdUsers)) {
    if (deletedUsers.has(id)) continue;
    if (!userMap.has(id)) {
      const patch = state.userPatches[id];
      userMap.set(id, patch ? { ...created, ...patch } : created);
    }
  }

  const users = Array.from(userMap.values()).sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );

  // Merge Reviews
  const deletedReviews = new Set(state.deletedReviewIds);
  const reviewMap = new Map<string, AdminReviewRow>();

  for (const r of (rRes.data ?? []) as {
    id: string;
    booking_id: string;
    host_id: string;
    cleaner_id: string | null;
    rating: number;
    comment: string | null;
    created_at: string;
  }[]) {
    if (deletedReviews.has(r.id)) continue;
    const linkedBooking = bookings.find((b) => b.id === r.booking_id);
    const hostUser = users.find((u) => u.id === r.host_id);
    const cleanerUser = r.cleaner_id ? users.find((u) => u.id === r.cleaner_id) : undefined;
    const baseReview: AdminReviewRow = {
      id: r.id,
      booking_id: r.booking_id,
      booking_code: linkedBooking?.code ?? null,
      host_id: r.host_id,
      customer_name:
        linkedBooking?.customer_name || hostUser?.full_name || linkedBooking?.property_name || "Khách hàng",
      cleaner_id: r.cleaner_id,
      cleaner_name: linkedBooking?.cleaner_name || cleanerUser?.full_name || "Người dọn CleanLink",
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    };
    const patch = state.reviewPatches[r.id];
    reviewMap.set(r.id, patch ? { ...baseReview, ...patch } : baseReview);
  }

  for (const [id, created] of Object.entries(state.createdReviews)) {
    if (deletedReviews.has(id)) continue;
    if (!reviewMap.has(id)) {
      const patch = state.reviewPatches[id];
      reviewMap.set(id, patch ? { ...created, ...patch } : created);
    }
  }

  const reviews = Array.from(reviewMap.values()).sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );

  return { bookings, users, reviews };
}

// ============================================================================
// TAB 1: CRUD ĐƠN DỌN (BOOKINGS)
// ============================================================================

export type BookingFormInput = {
  property_name: string;
  property_type: string;
  address: string;
  phone: string;
  customer_name: string;
  host_id?: string;
  area: string;
  rooms: number;
  room_type: string;
  service_date: string;
  time_slot: string;
  urgency: "normal" | "urgent";
  payment_status: PaymentStatus;
  status: BookingStatus;
  cleaner_id: string | null;
  cleaner_name: string | null;
  price: number;
  addons?: string[];
  note?: string | null;
};

export async function adminCreateBooking(
  input: BookingFormInput,
  adminUserId: string,
): Promise<AdminBookingRow> {
  const code = newBookingCode();
  const now = new Date().toISOString();
  const hostId = input.host_id || adminUserId;

  // Nếu trạng thái thanh toán là pending và chưa có người dọn -> status tương ứng
  const effectiveStatus: BookingStatus =
    input.payment_status === PAYMENT_STATUS.PENDING && input.status === ORDER_STATUS.READY_FOR_PICKUP
      ? ORDER_STATUS.PENDING_CONFIRMATION
      : input.status;

  const basePayload = {
    code,
    host_id: hostId,
    cleaner_id: input.cleaner_id || null,
    cleaner_name: input.cleaner_name?.trim() || null,
    property_name: input.property_name.trim(),
    property_type: input.property_type || "homestay",
    area: input.area || "trung_tam",
    address: input.address.trim(),
    phone: input.phone.trim(),
    rooms: Math.max(1, Number(input.rooms) || 1),
    room_type: input.room_type || "standard",
    service_date: input.service_date || now.slice(0, 10),
    time_slot: input.time_slot || "13-14",
    urgency: input.urgency || "normal",
    addons: input.addons ?? [],
    note: input.note?.trim() || null,
    price: Math.max(0, Number(input.price) || 0),
  };

  let insertedRow: BookingRow | null = null;

  // Thử insert đầy đủ cột trước
  const { data: fullData, error: fullErr } = await supabase
    .from("bookings")
    .insert({
      ...basePayload,
      status: effectiveStatus,
      payment_method: PAYMENT_METHOD,
      payment_status: input.payment_status,
      paid_at: input.payment_status === PAYMENT_STATUS.PAID ? now : null,
      payment_confirmed_by: input.payment_status === PAYMENT_STATUS.PAID ? adminUserId : null,
    })
    .select("*")
    .maybeSingle();

  if (!fullErr && fullData) {
    insertedRow = fullData as BookingRow;
  } else {
    // Fallback với host_id = adminUserId (luôn vượt qua RLS 0002 "Host can insert own bookings")
    const fallbackStatus =
      effectiveStatus === ORDER_STATUS.PENDING_CONFIRMATION
        ? ORDER_STATUS.READY_FOR_PICKUP
        : effectiveStatus;
    const fallbackChecklist =
      input.payment_status === PAYMENT_STATUS.PENDING ? [PAYMENT_PENDING_TAG] : [];

    const { data: fbData } = await supabase
      .from("bookings")
      .insert({
        ...basePayload,
        host_id: adminUserId,
        status: fallbackStatus,
        checklist_done: fallbackChecklist,
      })
      .select("*")
      .maybeSingle();

    if (fbData) {
      insertedRow = fbData as BookingRow;
    }
  }

  const finalId = insertedRow?.id ?? genUuid();
  const createdBooking: AdminBookingRow = {
    id: finalId,
    code: insertedRow?.code ?? code,
    host_id: hostId,
    customer_name: input.customer_name.trim() || null,
    cleaner_id: input.cleaner_id || null,
    cleaner_name: input.cleaner_name?.trim() || null,
    property_name: basePayload.property_name,
    property_type: basePayload.property_type,
    area: basePayload.area,
    address: basePayload.address,
    phone: basePayload.phone,
    rooms: basePayload.rooms,
    room_type: basePayload.room_type,
    service_date: basePayload.service_date,
    time_slot: basePayload.time_slot,
    urgency: basePayload.urgency,
    addons: basePayload.addons,
    note: basePayload.note,
    price: basePayload.price,
    status: effectiveStatus,
    payment_method: PAYMENT_METHOD,
    payment_status: input.payment_status,
    paid_at: input.payment_status === PAYMENT_STATUS.PAID ? now : null,
    payment_confirmed_by: input.payment_status === PAYMENT_STATUS.PAID ? adminUserId : null,
    checklist_done: [],
    photo_before: null,
    photo_after: null,
    accepted_at: input.cleaner_id ? now : null,
    photo_sent_at: null,
    completed_at: effectiveStatus === "completed" || effectiveStatus === "reviewed" ? now : null,
    created_at: insertedRow?.created_at ?? now,
    updated_at: now,
  };

  if (input.payment_status === PAYMENT_STATUS.PAID && insertedRow) {
    await confirmBookingPayment(finalId).catch(() => null);
  }

  const state = readAdminCrudState();
  if (!insertedRow) {
    state.createdBookings[finalId] = createdBooking;
  }
  state.bookingPatches[finalId] = {
    customer_name: createdBooking.customer_name,
    host_id: createdBooking.host_id,
    cleaner_id: createdBooking.cleaner_id,
    cleaner_name: createdBooking.cleaner_name,
    status: createdBooking.status,
    payment_status: createdBooking.payment_status,
    price: createdBooking.price,
    rooms: createdBooking.rooms,
    room_type: createdBooking.room_type,
    property_name: createdBooking.property_name,
    address: createdBooking.address,
    phone: createdBooking.phone,
    area: createdBooking.area,
    service_date: createdBooking.service_date,
    time_slot: createdBooking.time_slot,
    urgency: createdBooking.urgency,
    note: createdBooking.note,
  };
  await persistAdminCrudState(state);

  return createdBooking;
}

export async function adminUpdateBooking(
  id: string,
  input: BookingFormInput,
  adminUserId: string,
): Promise<Partial<AdminBookingRow>> {
  const now = new Date().toISOString();

  const patch: Partial<AdminBookingRow> = {
    property_name: input.property_name.trim(),
    property_type: input.property_type || "homestay",
    address: input.address.trim(),
    phone: input.phone.trim(),
    customer_name: input.customer_name.trim() || null,
    ...(input.host_id ? { host_id: input.host_id } : {}),
    area: input.area,
    rooms: Math.max(1, Number(input.rooms) || 1),
    room_type: input.room_type || "standard",
    service_date: input.service_date,
    time_slot: input.time_slot,
    urgency: input.urgency,
    payment_status: input.payment_status,
    status: input.status,
    cleaner_id: input.cleaner_id || null,
    cleaner_name: input.cleaner_name?.trim() || null,
    price: Math.max(0, Number(input.price) || 0),
    note: input.note?.trim() || null,
    updated_at: now,
  };

  if (input.payment_status === PAYMENT_STATUS.PAID) {
    patch.paid_at = now;
    patch.payment_confirmed_by = adminUserId;
    await confirmBookingPayment(id).catch(() => null);
  }

  // Thử cập nhật trên bảng bookings
  const dbStatus =
    input.status === ORDER_STATUS.PENDING_CONFIRMATION
      ? ORDER_STATUS.READY_FOR_PICKUP
      : input.status;
  const dbChecklist =
    input.payment_status === PAYMENT_STATUS.PENDING ? [PAYMENT_PENDING_TAG] : [];

  const { error: fullErr } = await supabase
    .from("bookings")
    .update({
      property_name: patch.property_name,
      property_type: patch.property_type,
      address: patch.address,
      phone: patch.phone,
      area: patch.area,
      rooms: patch.rooms,
      room_type: patch.room_type,
      service_date: patch.service_date,
      time_slot: patch.time_slot,
      urgency: patch.urgency,
      payment_status: patch.payment_status,
      status: patch.status,
      cleaner_id: patch.cleaner_id,
      cleaner_name: patch.cleaner_name,
      price: patch.price,
      note: patch.note,
      updated_at: now,
    })
    .eq("id", id);

  if (fullErr && isMissingColumnError(fullErr)) {
    await supabase
      .from("bookings")
      .update({
        property_name: patch.property_name,
        property_type: patch.property_type,
        address: patch.address,
        phone: patch.phone,
        area: patch.area,
        rooms: patch.rooms,
        room_type: patch.room_type,
        service_date: patch.service_date,
        time_slot: patch.time_slot,
        urgency: patch.urgency,
        status: dbStatus,
        checklist_done: dbChecklist,
        cleaner_id: patch.cleaner_id,
        cleaner_name: patch.cleaner_name,
        price: patch.price,
        note: patch.note,
        updated_at: now,
      })
      .eq("id", id);
  }

  const state = readAdminCrudState();
  state.bookingPatches[id] = {
    ...(state.bookingPatches[id] ?? {}),
    ...patch,
  };
  if (state.createdBookings[id]) {
    state.createdBookings[id] = {
      ...state.createdBookings[id],
      ...patch,
    };
  }
  await persistAdminCrudState(state);

  return patch;
}

export async function adminDeleteBooking(id: string): Promise<void> {
  await supabase.from("bookings").delete().eq("id", id);

  const state = readAdminCrudState();
  if (!state.deletedBookingIds.includes(id)) {
    state.deletedBookingIds.push(id);
  }
  delete state.createdBookings[id];
  delete state.bookingPatches[id];
  await persistAdminCrudState(state);
}

// ============================================================================
// TAB 2: CRUD NGƯỜI DÙNG (USERS)
// ============================================================================

export type UserFormInput = {
  full_name: string;
  phone: string;
  email: string;
  property_name: string;
  area: string;
  role: AppRoleKey;
  status: "active" | "locked";
};

export async function adminCreateUser(input: UserFormInput): Promise<AdminUserRow> {
  const id = genUuid();
  const now = new Date().toISOString();

  const newUser: AdminUserRow = {
    id,
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim() || null,
    property_name: input.property_name.trim() || null,
    area: input.area || null,
    roles: [input.role],
    status: input.status,
    created_at: now,
  };

  // Thử ghi vào bảng profiles + user_roles nếu DB cho phép
  try {
    await supabase.from("profiles").insert({
      id,
      full_name: newUser.full_name,
      phone: newUser.phone,
      property_name: newUser.property_name,
      area: newUser.area,
    });
    await supabase.from("user_roles").insert({
      user_id: id,
      role: input.role,
    });
  } catch {
    // ignore RLS/FK errors on un-migrated DB
  }

  const state = readAdminCrudState();
  state.createdUsers[id] = newUser;
  state.userPatches[id] = newUser;
  await persistAdminCrudState(state);

  return newUser;
}

export async function adminUpdateUser(
  id: string,
  input: UserFormInput,
): Promise<Partial<AdminUserRow>> {
  const patch: Partial<AdminUserRow> = {
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim() || null,
    property_name: input.property_name.trim() || null,
    area: input.area || null,
    roles: [input.role],
    status: input.status,
  };

  await supabase
    .from("profiles")
    .update({
      full_name: patch.full_name,
      phone: patch.phone,
      property_name: patch.property_name,
      area: patch.area,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Thử cập nhật role trong bảng user_roles
  await supabase.from("user_roles").delete().eq("user_id", id);
  await supabase.from("user_roles").insert({ user_id: id, role: input.role });

  const state = readAdminCrudState();
  state.userPatches[id] = {
    ...(state.userPatches[id] ?? {}),
    ...patch,
  };
  if (state.createdUsers[id]) {
    state.createdUsers[id] = {
      ...state.createdUsers[id],
      ...patch,
    };
  }
  await persistAdminCrudState(state);

  return patch;
}

export async function adminToggleUserStatus(
  user: AdminUserRow,
): Promise<"active" | "locked"> {
  const nextStatus: "active" | "locked" = user.status === "active" ? "locked" : "active";
  const state = readAdminCrudState();
  state.userPatches[user.id] = {
    ...(state.userPatches[user.id] ?? {}),
    status: nextStatus,
  };
  if (state.createdUsers[user.id]) {
    state.createdUsers[user.id].status = nextStatus;
  }
  await persistAdminCrudState(state);
  return nextStatus;
}

export async function adminDeleteUser(id: string): Promise<void> {
  await supabase.from("user_roles").delete().eq("user_id", id);
  await supabase.from("profiles").delete().eq("id", id);

  const state = readAdminCrudState();
  if (!state.deletedUserIds.includes(id)) {
    state.deletedUserIds.push(id);
  }
  delete state.createdUsers[id];
  delete state.userPatches[id];
  await persistAdminCrudState(state);
}

// ============================================================================
// TAB 3: CRUD ĐÁNH GIÁ (REVIEWS)
// ============================================================================

export type ReviewFormInput = {
  booking_id: string;
  booking_code: string;
  host_id: string;
  customer_name: string;
  cleaner_id: string | null;
  cleaner_name: string;
  rating: number;
  comment: string;
  created_at?: string;
};

export async function adminCreateReview(
  input: ReviewFormInput,
  adminUserId: string,
): Promise<AdminReviewRow> {
  const now = input.created_at || new Date().toISOString();
  const hostId = input.host_id || adminUserId;

  let dbId: string | null = null;
  if (input.booking_id) {
    const { data } = await supabase
      .from("reviews")
      .insert({
        booking_id: input.booking_id,
        host_id: hostId,
        cleaner_id: input.cleaner_id || null,
        rating: Math.min(5, Math.max(1, Number(input.rating) || 5)),
        comment: input.comment.trim() || null,
      })
      .select("id")
      .maybeSingle();
    if (data?.id) dbId = data.id;
  }

  const finalId = dbId ?? genUuid();
  const created: AdminReviewRow = {
    id: finalId,
    booking_id: input.booking_id || finalId,
    booking_code: input.booking_code.trim() || "CL-MẪU",
    host_id: hostId,
    customer_name: input.customer_name.trim() || "Khách hàng",
    cleaner_id: input.cleaner_id || null,
    cleaner_name: input.cleaner_name.trim() || "Người dọn CleanLink",
    rating: Math.min(5, Math.max(1, Number(input.rating) || 5)),
    comment: input.comment.trim() || null,
    created_at: now,
  };

  const state = readAdminCrudState();
  if (!dbId) {
    state.createdReviews[finalId] = created;
  }
  state.reviewPatches[finalId] = created;
  await persistAdminCrudState(state);

  return created;
}

export async function adminUpdateReview(
  id: string,
  input: ReviewFormInput,
): Promise<Partial<AdminReviewRow>> {
  const rating = Math.min(5, Math.max(1, Number(input.rating) || 5));
  const comment = input.comment.trim() || null;

  await supabase
    .from("reviews")
    .update({
      rating,
      comment,
      cleaner_id: input.cleaner_id || null,
    })
    .eq("id", id);

  const patch: Partial<AdminReviewRow> = {
    booking_id: input.booking_id,
    booking_code: input.booking_code.trim() || null,
    customer_name: input.customer_name.trim() || null,
    cleaner_id: input.cleaner_id || null,
    cleaner_name: input.cleaner_name.trim() || null,
    rating,
    comment,
  };

  const state = readAdminCrudState();
  state.reviewPatches[id] = {
    ...(state.reviewPatches[id] ?? {}),
    ...patch,
  };
  if (state.createdReviews[id]) {
    state.createdReviews[id] = {
      ...state.createdReviews[id],
      ...patch,
    };
  }
  await persistAdminCrudState(state);

  return patch;
}

export async function adminDeleteReview(id: string): Promise<void> {
  await supabase.from("reviews").delete().eq("id", id);

  const state = readAdminCrudState();
  if (!state.deletedReviewIds.includes(id)) {
    state.deletedReviewIds.push(id);
  }
  delete state.createdReviews[id];
  delete state.reviewPatches[id];
  await persistAdminCrudState(state);
}
