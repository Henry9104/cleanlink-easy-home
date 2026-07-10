import {
  LogOut,
  Zap,
  Building2,
  Camera,
  ListChecks,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Service = {
  slug: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  icon: LucideIcon;
  tag?: string;
};

export const services: Service[] = [
  {
    slug: "co-ban",
    name: "Dọn phòng cơ bản sau check-out",
    description:
      "Vệ sinh phòng chuẩn turnover: thay ga, dọn rác, lau bề mặt, chỉnh ga giường – sẵn sàng cho lượt khách kế tiếp.",
    duration: "45 – 60 phút/phòng",
    price: "Từ 90.000đ/phòng",
    icon: LogOut,
    tag: "Phổ biến nhất",
  },
  {
    slug: "gap",
    name: "Dọn gấp trong giờ check-in/check-out",
    description:
      "Điều phối người dọn có mặt trong 30–60 phút, ưu tiên các đơn khung 11:00–14:00 khi turnover dày.",
    duration: "30 – 45 phút/phòng",
    price: "Phụ phí 20%",
    icon: Zap,
    tag: "Gấp",
  },
  {
    slug: "nhieu-phong",
    name: "Dọn nhiều phòng cho homestay / mini hotel",
    description:
      "Đội 2–4 người dọn xử lý cùng lúc 3–10 phòng, hoàn tất trước giờ khách check-in, có điều phối viên theo dõi.",
    duration: "1 – 3 giờ",
    price: "Từ 80.000đ/phòng",
    icon: Building2,
  },
  {
    slug: "anh-xac-nhan",
    name: "Gửi ảnh xác nhận sau khi dọn",
    description:
      "Người dọn chụp ảnh từng phòng sau khi hoàn tất, gửi trực tiếp về app cho chủ cơ sở kiểm tra từ xa.",
    duration: "Đi kèm mọi đơn",
    price: "Miễn phí",
    icon: Camera,
  },
  {
    slug: "checklist",
    name: "Checklist chất lượng từng phòng",
    description:
      "Chuẩn hóa 7 hạng mục dọn phòng theo tiêu chuẩn homestay/mini hotel, đảm bảo không sót đầu việc.",
    duration: "Đi kèm mọi đơn",
    price: "Miễn phí",
    icon: ListChecks,
  },
  {
    slug: "mo-rong",
    name: "Dịch vụ mở rộng (giặt ga, tổng vệ sinh)",
    description:
      "Giặt ga gối, giặt rèm, tổng vệ sinh sâu định kỳ 1–2 tuần cho toàn bộ cơ sở lưu trú.",
    duration: "Đặt theo yêu cầu",
    price: "Liên hệ báo giá",
    icon: Sparkles,
    tag: "Sắp mở",
  },
];

export const propertyTypes = [
  { value: "homestay", label: "Homestay" },
  { value: "mini_hotel", label: "Mini hotel" },
  { value: "apartment", label: "Căn hộ thuê ngắn hạn" },
] as const;

export const areas = [
  { value: "trung_tam", label: "Trung tâm Quy Nhơn" },
  { value: "nhon_ly", label: "Nhơn Lý" },
  { value: "eo_gio", label: "Eo Gió" },
  { value: "bai_xep", label: "Bãi Xếp" },
  { value: "nhon_hai", label: "Nhơn Hải" },
] as const;

export const timeSlots = [
  { value: "11-12", label: "11:00 – 12:00" },
  { value: "12-13", label: "12:00 – 13:00" },
  { value: "13-14", label: "13:00 – 14:00" },
  { value: "khac", label: "Khung giờ khác" },
] as const;

export const addonOptions = [
  { value: "toilet", label: "Dọn nhà vệ sinh" },
  { value: "rac", label: "Thu gom rác" },
  { value: "ga", label: "Chỉnh ga giường" },
  { value: "san", label: "Lau sàn" },
  { value: "khan", label: "Kiểm tra khăn / vật dụng" },
  { value: "khac", label: "Khác (ghi chú thêm)" },
] as const;

export type Booking = {
  id: string;
  createdAt: string;
  propertyName: string;
  propertyType: string;
  area: string;
  address: string;
  phone: string;
  rooms: number;
  timeSlot: string;
  urgency: "normal" | "urgent";
  addons: string[];
  note?: string;
  price: number;
  cleaner?: string;
  status: "pending" | "assigned" | "on_the_way" | "in_progress" | "done" | "cancelled";
};

export const statusLabel: Record<Booking["status"], string> = {
  pending: "Chờ nhận việc",
  assigned: "Đã ghép người dọn",
  on_the_way: "Người dọn đang di chuyển",
  in_progress: "Đang dọn phòng",
  done: "Hoàn thành",
  cancelled: "Đã hủy",
};

export const statusColor: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  assigned: "bg-sky-100 text-sky-800 border-sky-200",
  on_the_way: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

// ===== Pricing =====
const BASE_PER_ROOM = 90000;
const URGENT_MULTIPLIER = 1.2;

export function estimatePrice(rooms: number, urgency: "normal" | "urgent") {
  const r = Math.max(1, rooms);
  const perRoom = r >= 5 ? 80000 : r >= 3 ? 85000 : BASE_PER_ROOM;
  const subtotal = perRoom * r;
  const total = urgency === "urgent" ? Math.round(subtotal * URGENT_MULTIPLIER) : subtotal;
  return { perRoom, subtotal, total };
}

export function formatVND(v: number) {
  return v.toLocaleString("vi-VN") + "đ";
}

// ===== Sample data (in-memory demo) =====
export const sampleBookings: Booking[] = [
  {
    id: "CL240712",
    createdAt: new Date().toISOString(),
    propertyName: "Mai House Homestay",
    propertyType: "homestay",
    area: "trung_tam",
    address: "12 Xuân Diệu, Quy Nhơn",
    phone: "0905 111 222",
    rooms: 5,
    timeSlot: "13-14",
    urgency: "urgent",
    addons: ["toilet", "rac", "ga"],
    price: 480000,
    cleaner: "Chị Hồng",
    status: "on_the_way",
  },
  {
    id: "CL240711",
    createdAt: new Date().toISOString(),
    propertyName: "Seaview Mini Hotel",
    propertyType: "mini_hotel",
    area: "nhon_ly",
    address: "68 Nhơn Lý, Quy Nhơn",
    phone: "0905 333 444",
    rooms: 8,
    timeSlot: "12-13",
    urgency: "normal",
    addons: ["toilet", "rac", "ga", "san"],
    price: 640000,
    cleaner: "Anh Sơn + 1",
    status: "in_progress",
  },
  {
    id: "CL240710",
    createdAt: new Date().toISOString(),
    propertyName: "Bãi Xếp Ocean Studio",
    propertyType: "apartment",
    area: "bai_xep",
    address: "Bãi Xếp, Ghềnh Ráng",
    phone: "0905 555 666",
    rooms: 2,
    timeSlot: "11-12",
    urgency: "normal",
    addons: ["ga", "khan"],
    price: 180000,
    cleaner: "Chị Lan",
    status: "done",
  },
  {
    id: "CL240709",
    createdAt: new Date().toISOString(),
    propertyName: "Eo Gió Sunset Home",
    propertyType: "homestay",
    area: "eo_gio",
    address: "Eo Gió, Nhơn Lý",
    phone: "0905 777 888",
    rooms: 3,
    timeSlot: "13-14",
    urgency: "normal",
    addons: ["toilet", "ga"],
    price: 255000,
    status: "pending",
  },
  {
    id: "CL240708",
    createdAt: new Date().toISOString(),
    propertyName: "Nhơn Hải Beach Villa",
    propertyType: "homestay",
    area: "nhon_hai",
    address: "Thôn Hải Đông, Nhơn Hải",
    phone: "0905 999 000",
    rooms: 4,
    timeSlot: "12-13",
    urgency: "urgent",
    addons: ["toilet", "rac", "ga", "san", "khan"],
    price: 408000,
    cleaner: "Chị Mai + 1",
    status: "assigned",
  },
  {
    id: "CL240707",
    createdAt: new Date().toISOString(),
    propertyName: "Quy Nhơn Center Apartment",
    propertyType: "apartment",
    area: "trung_tam",
    address: "45 An Dương Vương, Quy Nhơn",
    phone: "0905 121 212",
    rooms: 1,
    timeSlot: "11-12",
    urgency: "normal",
    addons: ["ga"],
    price: 90000,
    cleaner: "Chị Thu",
    status: "done",
  },
];

// ===== Sample jobs for cleaner-facing screen =====
export type Job = {
  id: string;
  property: string;
  address: string;
  area: string;
  rooms: number;
  timeSlot: string;
  distanceKm: number;
  earnMin: number;
  earnMax: number;
  urgency: "normal" | "urgent";
};

export const sampleJobs: Job[] = [
  {
    id: "JOB-1042",
    property: "Mai House Homestay",
    address: "12 Xuân Diệu, Quy Nhơn",
    area: "trung_tam",
    rooms: 5,
    timeSlot: "13-14",
    distanceKm: 2.1,
    earnMin: 500000,
    earnMax: 550000,
    urgency: "urgent",
  },
  {
    id: "JOB-1041",
    property: "Seaview Mini Hotel",
    address: "68 Nhơn Lý, Quy Nhơn",
    area: "nhon_ly",
    rooms: 8,
    timeSlot: "12-13",
    distanceKm: 12.4,
    earnMin: 640000,
    earnMax: 700000,
    urgency: "normal",
  },
  {
    id: "JOB-1040",
    property: "Bãi Xếp Ocean Studio",
    address: "Bãi Xếp, Ghềnh Ráng",
    area: "bai_xep",
    rooms: 2,
    timeSlot: "11-12",
    distanceKm: 5.8,
    earnMin: 180000,
    earnMax: 210000,
    urgency: "normal",
  },
];

// ===== Checklist =====
export const checklistItems = [
  { id: "rac", label: "Thu gom rác" },
  { id: "toilet", label: "Dọn nhà vệ sinh" },
  { id: "surface", label: "Lau bàn / kệ / bề mặt dễ thấy" },
  { id: "floor", label: "Quét và lau sàn" },
  { id: "bed", label: "Chỉnh ga giường" },
  { id: "khan", label: "Kiểm tra khăn / vật dụng cơ bản" },
  { id: "photo", label: "Gửi ảnh sau khi dọn" },
];

export function labelFrom<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string,
) {
  return list.find((x) => x.value === value)?.label ?? value;
}
