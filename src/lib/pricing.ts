import {
  AFTER_HOURS_FEE,
  addonOptions,
  AREA_PRICING,
  CLEANER_SHARE_RATE,
  EXTRA_OPTIONS,
  HOURLY_PRICING,
  PLATFORM_FEE_RATE,
  ROOM_COUNT_CONTRACT_THRESHOLD,
  ROOM_COUNT_PRICING,
  ROOM_PRICE,
  ROOM_PRICE_ORDER,
  ROOM_PRICING,
  URGENT_FEE,
  serviceTypes,
  timeSlots,
  type RoomTypeKey,
  type ServiceType,
} from "@/lib/cleanlink-data";

/** Toàn bộ lựa chọn của khách trong form ước tính / đặt lịch */
export type ServiceSelection = {
  serviceType: ServiceType;
  /** Gói 1 – loại phòng */
  roomType: RoomTypeKey;
  /** Gói 1 – số phòng */
  rooms: number;
  /** Gói 2 – khóa số giờ (vd "3h") */
  hourlyKey: string;
  /** Gói 3 – khóa loại nhà / căn hộ (vd "2br") */
  areaKey: string;
  urgency: "normal" | "urgent";
  timeSlot: string;
  /** Khóa các dịch vụ bổ sung có phụ thu (EXTRA_OPTIONS) */
  extras: string[];
};

export type SavedEstimateMeta = {
  propertyName?: string;
  address?: string;
  area?: string;
};

export const MAX_ROOMS = 15;

export const DEFAULT_SELECTION: ServiceSelection = {
  serviceType: "lodging",
  roomType: "standard",
  rooms: 3,
  hourlyKey: "3h",
  areaKey: "studio",
  urgency: "normal",
  timeSlot: "13-14",
  extras: [],
};

/** Cấu trúc phân chia doanh thu theo tỷ lệ 88% (Người dọn) / 12% (CleanLink) */
export type RevenueSplit = {
  customerTotal: number;
  cleanerAmount: number;
  platformFee: number;
  cleanerRate: number;
  platformRate: number;
};

/** Tính phân chia doanh thu 88% Người dọn / 12% CleanLink từ tổng tiền khách trả */
export function calculateRevenueSplit(customerTotal: number): RevenueSplit {
  const safeTotal = Math.max(0, Math.round(customerTotal || 0));
  const cleanerAmount = Math.round(safeTotal * CLEANER_SHARE_RATE);
  const platformFee = safeTotal - cleanerAmount;
  return {
    customerTotal: safeTotal,
    cleanerAmount,
    platformFee,
    cleanerRate: CLEANER_SHARE_RATE,
    platformRate: PLATFORM_FEE_RATE,
  };
}

/** amount = null nghĩa là hạng mục báo giá riêng (hiển thị note thay cho số tiền) */
export type PriceLine = { label: string; amount: number | null; note?: string };

export type Estimate = {
  lines: PriceLine[];
  /** Tổng các khoản đã có giá cố định (chưa gồm hạng mục báo giá riêng) */
  total: number;
  /** Số tiền Người dọn nhận (88%) */
  cleanerAmount: number;
  /** Số tiền CleanLink thu (12%) */
  platformFee: number;
  /** Cấu trúc phân tách đầy đủ để đính kèm vào payload đơn đặt phòng */
  split: RevenueSplit;
  /** Dịch vụ chính cần báo giá riêng / liên hệ → không có tổng tiền */
  baseQuote: boolean;
  /** Có ít nhất một hạng mục báo giá riêng (dịch vụ chính hoặc bổ sung) */
  hasQuote: boolean;
};

/** Khung giờ bắt đầu hoặc kéo dài sau 20:00 (ví dụ "20-22") */
export function isAfter20(timeSlot: string) {
  const m = /^(\d{2})-(\d{2})$/.exec(timeSlot);
  if (!m) return false;
  return Number(m[1]) >= 20 || Number(m[2]) > 20;
}

export function estimateOrder(sel: ServiceSelection): Estimate {
  const lines: PriceLine[] = [];
  let baseQuote = false;

  if (sel.serviceType === "lodging") {
    const rooms = Math.min(Math.max(1, Math.round(sel.rooms)), MAX_ROOMS);
    const info = ROOM_PRICING[sel.roomType];
    const label = `${info.label} × ${rooms} phòng`;
    if (sel.roomType === "special") {
      baseQuote = true;
      lines.push({ label, amount: null, note: "Báo giá riêng" });
    } else if (rooms > ROOM_COUNT_CONTRACT_THRESHOLD) {
      baseQuote = true;
      lines.push({ label, amount: null, note: "Liên hệ báo giá" });
    } else {
      // Phòng tiêu chuẩn áp dụng Bảng giá theo số lượng phòng (1 - 10 phòng)
      const amount =
        sel.roomType === "standard"
          ? (ROOM_COUNT_PRICING.find((r) => r.rooms === rooms)?.price ?? ROOM_PRICE.standard * rooms)
          : ROOM_PRICE[sel.roomType] * rooms;
      lines.push({ label, amount });
    }
  } else {
    const list = sel.serviceType === "hourly" ? HOURLY_PRICING : AREA_PRICING;
    const key = sel.serviceType === "hourly" ? sel.hourlyKey : sel.areaKey;
    const opt = list.find((o) => o.value === key) ?? list[0];
    const label =
      sel.serviceType === "hourly"
        ? `Dọn nhà theo giờ – ${opt.label}`
        : `Dọn căn hộ – ${opt.label}`;
    if (opt.customer === null) {
      baseQuote = true;
      lines.push({ label, amount: null, note: "Báo giá riêng" });
    } else {
      lines.push({ label, amount: opt.customer });
    }
  }

  if (sel.urgency === "urgent") {
    lines.push({ label: "Đặt gấp (bắt đầu trong 2 giờ)", amount: URGENT_FEE });
  }
  if (isAfter20(sel.timeSlot)) {
    lines.push({ label: "Dọn sau 20 giờ", amount: AFTER_HOURS_FEE });
  }
  for (const opt of EXTRA_OPTIONS) {
    if (!sel.extras.includes(opt.value)) continue;
    lines.push({ label: opt.label, amount: opt.fee, note: opt.fee === null ? opt.note : undefined });
  }

  const total = baseQuote ? 0 : lines.reduce((sum, l) => sum + (l.amount ?? 0), 0);
  const split = calculateRevenueSplit(total);
  return {
    lines,
    total,
    cleanerAmount: split.cleanerAmount,
    platformFee: split.platformFee,
    split,
    baseQuote,
    hasQuote: lines.some((l) => l.amount === null),
  };
}

/** Số tiền ghi vào đơn / hiển thị trên mã QR (0 nếu dịch vụ chính cần báo giá riêng) */
export function bookingPrice(estimate: Estimate) {
  return estimate.baseQuote ? 0 : estimate.total;
}

/**
 * Tính số tiền công thợ nhận được (cleanerTotal = 88%) và phí nền tảng CleanLink (platformFee = 12%)
 * từ thông tin đơn đặt dọn phòng.
 */
export function cleanerPayoutFromBooking(b: {
  room_type?: string | null;
  rooms?: number | null;
  urgency?: string | null;
  time_slot?: string | null;
  addons?: string[] | null;
  price?: number | null;
  cleaner_amount?: number | null;
  platform_fee?: number | null;
}): {
  cleanerTotal: number;
  platformFee: number;
  customerTotal: number;
  cleanerRate: number;
  platformRate: number;
} {
  const sel = selectionFromBooking(b);
  const est = estimateOrder(sel);
  const customerTotal =
    typeof b.price === "number" && b.price > 0 ? b.price : est.total;

  if (
    typeof b.cleaner_amount === "number" &&
    typeof b.platform_fee === "number" &&
    b.cleaner_amount + b.platform_fee === customerTotal &&
    customerTotal > 0
  ) {
    return {
      cleanerTotal: b.cleaner_amount,
      platformFee: b.platform_fee,
      customerTotal,
      cleanerRate: CLEANER_SHARE_RATE,
      platformRate: PLATFORM_FEE_RATE,
    };
  }

  const split = calculateRevenueSplit(customerTotal);
  return {
    cleanerTotal: split.cleanerAmount,
    platformFee: split.platformFee,
    customerTotal: split.customerTotal,
    cleanerRate: split.cleanerRate,
    platformRate: split.platformRate,
  };
}

/**
 * Trả về số tiền phí nền tảng "CleanLink thu" (12%) của một đơn hàng.
 */
export function platformFeeFromBooking(b: {
  room_type?: string | null;
  rooms?: number | null;
  urgency?: string | null;
  time_slot?: string | null;
  addons?: string[] | null;
  price?: number | null;
  cleaner_amount?: number | null;
  platform_fee?: number | null;
}): number {
  return cleanerPayoutFromBooking(b).platformFee;
}

// ===== Lưu dịch vụ vào cột room_type của đơn (không cần đổi cấu trúc database) =====
// Gói 1: "standard" | "large" | "family" | "kitchen" | "special"
// Gói 2: "hourly_<khóa>" · Gói 3: "area_<khóa>"
export function serviceKeyOf(sel: ServiceSelection) {
  if (sel.serviceType === "hourly") return `hourly_${sel.hourlyKey}`;
  if (sel.serviceType === "area") return `area_${sel.areaKey}`;
  return sel.roomType;
}

function isOneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (list as readonly string[]).includes(v);
}

export function parseServiceKey(
  key: string,
): Pick<ServiceSelection, "serviceType" | "roomType" | "hourlyKey" | "areaKey"> {
  const d = DEFAULT_SELECTION;
  if (key.startsWith("hourly_")) {
    const k = key.slice("hourly_".length);
    return {
      serviceType: "hourly",
      roomType: d.roomType,
      hourlyKey: HOURLY_PRICING.some((o) => o.value === k) ? k : d.hourlyKey,
      areaKey: d.areaKey,
    };
  }
  if (key.startsWith("area_")) {
    const k = key.slice("area_".length);
    return {
      serviceType: "area",
      roomType: d.roomType,
      hourlyKey: d.hourlyKey,
      areaKey: AREA_PRICING.some((o) => o.value === k) ? k : d.areaKey,
    };
  }
  return {
    serviceType: "lodging",
    roomType: isOneOf(ROOM_PRICE_ORDER, key) ? key : d.roomType,
    hourlyKey: d.hourlyKey,
    areaKey: d.areaKey,
  };
}

/** Dựng lại lựa chọn từ dữ liệu đơn đã lưu (bản nháp hoặc bản ghi database) */
export function selectionFromBooking(b: {
  room_type?: string | null;
  rooms?: number | null;
  urgency?: string | null;
  time_slot?: string | null;
  addons?: string[] | null;
}): ServiceSelection {
  const d = DEFAULT_SELECTION;
  return {
    ...parseServiceKey(b.room_type ?? d.roomType),
    rooms: Math.min(Math.max(1, b.rooms ?? 1), MAX_ROOMS),
    urgency: b.urgency === "urgent" ? "urgent" : "normal",
    timeSlot: b.time_slot ?? d.timeSlot,
    extras: (b.addons ?? []).filter((a) => EXTRA_OPTIONS.some((o) => o.value === a)),
  };
}

// ===== Hiển thị dịch vụ trong danh sách / chi tiết đơn =====
/** Chi tiết dịch vụ, không kèm số phòng (vd "Phòng lớn 25–40m²") */
export function serviceDetail(key: string) {
  const p = parseServiceKey(key);
  if (p.serviceType === "hourly") {
    return `Dọn nhà theo giờ – ${HOURLY_PRICING.find((o) => o.value === p.hourlyKey)?.label ?? ""}`;
  }
  if (p.serviceType === "area") {
    return `Dọn căn hộ – ${AREA_PRICING.find((o) => o.value === p.areaKey)?.label ?? ""}`;
  }
  return ROOM_PRICING[p.roomType].label;
}

export function serviceSummary(key: string, rooms: number) {
  const p = parseServiceKey(key);
  return p.serviceType === "lodging"
    ? `${rooms} phòng · ${serviceDetail(key)}`
    : serviceDetail(key);
}

export function serviceHeadline(key: string, rooms: number) {
  const p = parseServiceKey(key);
  if (p.serviceType === "hourly") return "Dọn nhà theo giờ";
  if (p.serviceType === "area") return "Dọn căn hộ theo diện tích";
  return `Dọn ${rooms} phòng`;
}

// ===== Chuyển lựa chọn từ trang "Giá dự kiến" sang form đặt lịch =====
const SELECTION_KEY = "cleanlink:estimate-selection";
const SELECTION_META_KEY = "cleanlink:estimate-selection-meta";

export function sanitizeSelection(raw: unknown): ServiceSelection {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SELECTION;
  const rooms = Number(r.rooms);
  return {
    serviceType: isOneOf(
      serviceTypes.map((t) => t.value),
      r.serviceType,
    )
      ? r.serviceType
      : d.serviceType,
    roomType: isOneOf(ROOM_PRICE_ORDER, r.roomType) ? r.roomType : d.roomType,
    rooms: Number.isFinite(rooms) ? Math.min(Math.max(1, Math.round(rooms)), MAX_ROOMS) : d.rooms,
    hourlyKey: HOURLY_PRICING.some((o) => o.value === r.hourlyKey)
      ? String(r.hourlyKey)
      : d.hourlyKey,
    areaKey: AREA_PRICING.some((o) => o.value === r.areaKey) ? String(r.areaKey) : d.areaKey,
    urgency: r.urgency === "urgent" ? "urgent" : "normal",
    timeSlot: isOneOf(
      timeSlots.map((t) => t.value),
      r.timeSlot,
    )
      ? r.timeSlot
      : d.timeSlot,
    extras: Array.isArray(r.extras)
      ? r.extras.filter(
          (e): e is string => typeof e === "string" && EXTRA_OPTIONS.some((o) => o.value === e),
        )
      : [],
  };
}

export function saveSelection(sel: ServiceSelection, meta?: SavedEstimateMeta) {
  sessionStorage.setItem(SELECTION_KEY, JSON.stringify(sel));
  if (meta) {
    sessionStorage.setItem(SELECTION_META_KEY, JSON.stringify(meta));
  }
}

/** Đọc rồi xóa lựa chọn đã chuyển sang (chỉ dùng một lần) */
export function takeSelection(): ServiceSelection | null {
  try {
    const raw = sessionStorage.getItem(SELECTION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SELECTION_KEY);
    return sanitizeSelection(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function takeSelectionMeta(): SavedEstimateMeta | null {
  try {
    const raw = sessionStorage.getItem(SELECTION_META_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SELECTION_META_KEY);
    return JSON.parse(raw) as SavedEstimateMeta;
  } catch {
    return null;
  }
}

/** Nhãn các yêu cầu thêm / dịch vụ bổ sung của đơn (theo khóa lưu trong cột addons) */
export function addonLabels(keys: string[]) {
  return keys.map(
    (k) =>
      addonOptions.find((o) => o.value === k)?.label ??
      EXTRA_OPTIONS.find((o) => o.value === k)?.label ??
      k,
  );
}
