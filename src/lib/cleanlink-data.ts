import {
  LogOut,
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
    name: "Dọn phòng tiêu chuẩn sau khi khách trả phòng",
    description:
      "Vệ sinh phòng chuẩn giữa hai lượt khách: dọn phòng thông thường, thay ga có sẵn, thu gom rác, lau sàn và vệ sinh nhà tắm – áp dụng cho phòng tiêu chuẩn dưới 25 m².",
    duration: "45 – 60 phút/phòng",
    price: "60.000đ/phòng",
    icon: LogOut,
    tag: "Phổ biến nhất",
  },
  {
    slug: "phong-lon",
    name: "Dọn phòng lớn, phòng gia đình hoặc phòng có bếp",
    description:
      "Áp dụng cho phòng từ 25 m² trở lên hoặc có bếp nhỏ – khối lượng công việc lớn hơn, thời gian dọn dài hơn. Phòng trên 60 m² được báo giá riêng.",
    duration: "60 – 90 phút/phòng",
    price: "80.000đ – 120.000đ/phòng",
    icon: Building2,
  },
  {
    slug: "nhieu-phong",
    name: "Dọn nhiều phòng cho homestay / khách sạn nhỏ",
    description:
      "Điều phối nhiều người dọn xử lý cùng lúc 3–5 phòng, hoàn tất trước khung giờ khách mới nhận phòng, có người điều phối theo dõi tiến độ.",
    duration: "1 – 3 giờ",
    price: "Từ 60.000đ/phòng",
    icon: Building2,
  },
  {
    slug: "anh-xac-nhan",
    name: "Gửi hình ảnh sau khi dọn",
    description:
      "Người dọn chụp hình từng phòng sau khi hoàn tất, gửi trực tiếp về ứng dụng cho chủ cơ sở kiểm tra từ xa.",
    duration: "Đi kèm mọi đơn",
    price: "Miễn phí",
    icon: Camera,
  },
  {
    slug: "checklist",
    name: "Danh sách công việc từng phòng",
    description:
      "Chuẩn hoá 7 hạng mục công việc cho từng phòng, giúp hạn chế bỏ sót và giữ chất lượng ổn định.",
    duration: "Đi kèm mọi đơn",
    price: "Miễn phí",
    icon: ListChecks,
  },
  {
    slug: "mo-rong",
    name: "Dịch vụ mở rộng (giặt ga, tổng vệ sinh)",
    description:
      "Giặt ga gối, giặt rèm, tổng vệ sinh sâu định kỳ cho toàn bộ cơ sở lưu trú.",
    duration: "Đặt theo yêu cầu",
    price: "Liên hệ báo giá",
    icon: Sparkles,
    tag: "Sắp mở",
  },
];

export const propertyTypes = [
  { value: "homestay", label: "Homestay" },
  { value: "mini_hotel", label: "Khách sạn nhỏ" },
  { value: "guesthouse", label: "Nhà nghỉ" },
  { value: "apartment", label: "Căn hộ thuê ngắn hạn" },
] as const;

export type RoomTypeKey = "standard" | "large" | "family" | "kitchen" | "special";

export const areas = [
  { value: "trung_tam", label: "Trung tâm Quy Nhơn" },
  { value: "nhon_ly", label: "Nhơn Lý" },
  { value: "eo_gio", label: "Eo Gió" },
  { value: "bai_xep", label: "Bãi Xếp" },
  { value: "nhon_hai", label: "Nhơn Hải" },
] as const;

export const timeSlots = [
  { value: "08-10", label: "08:00 – 10:00" },
  { value: "11-12", label: "11:00 – 12:00" },
  { value: "12-13", label: "12:00 – 13:00" },
  { value: "13-14", label: "13:00 – 14:00" },
  { value: "15-17", label: "15:00 – 17:00" },
  { value: "18-20", label: "18:00 – 20:00" },
  { value: "20-22", label: "20:00 – 22:00" },
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

export type BookingStatus =
  | "pending"
  | "created"
  | "searching"
  | "accepted"
  | "on_the_way"
  | "in_progress"
  | "work_done"
  | "photo_sent"
  | "completed"
  | "reviewed"
  | "cancelled";

/**
 * Hằng số ánh xạ các bước trạng thái đơn chuẩn theo luồng nghiệp vụ:
 * - PENDING_CONFIRMATION ("pending"): Chờ Admin duyệt tiền
 * - READY_FOR_PICKUP ("searching"): Đã duyệt tiền, đang chờ thợ nhận
 * - ACCEPTED ("accepted"): Thợ đã nhận đơn
 * - IN_PROGRESS ("in_progress"): Thợ đang thực hiện
 * - CONFIRMATION_SUBMITTED ("photo_sent"): Đã gửi ảnh xác nhận
 * - COMPLETED ("completed"): Hoàn thành dịch vụ
 * - REVIEWED ("reviewed"): Đã đánh giá
 */
export const ORDER_STATUS = {
  PENDING_CONFIRMATION: "pending",
  READY_FOR_PICKUP: "searching",
  ACCEPTED: "accepted",
  IN_PROGRESS: "in_progress",
  CONFIRMATION_SUBMITTED: "photo_sent",
  COMPLETED: "completed",
  REVIEWED: "reviewed",
  CANCELLED: "cancelled",
} as const satisfies Record<string, BookingStatus>;

export type Booking = {
  id: string;
  createdAt: string;
  propertyName: string;
  propertyType: string;
  area: string;
  address: string;
  phone: string;
  rooms: number;
  roomType: RoomTypeKey;
  timeSlot: string;
  urgency: "normal" | "urgent";
  addons: string[];
  note?: string;
  price: number;
  cleaner?: string;
  status: BookingStatus;
};

export const statusLabel: Record<BookingStatus, string> = {
  pending: "Chờ duyệt tiền",
  created: "Đã tạo đơn",
  searching: "Đang chờ người dọn",
  accepted: "Thợ đã nhận đơn",
  on_the_way: "Người dọn đang đến cơ sở",
  in_progress: "Đang thực hiện",
  work_done: "Đã hoàn thành các công việc",
  photo_sent: "Đã gửi ảnh xác nhận",
  completed: "Hoàn tất dịch vụ",
  reviewed: "Đã đánh giá",
  cancelled: "Đã huỷ",
};

export const statusColor: Record<BookingStatus, string> = {
  pending: "bg-orange-100 text-orange-800 border-orange-200",
  created: "bg-slate-100 text-slate-800 border-slate-200",
  searching: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-sky-100 text-sky-800 border-sky-200",
  on_the_way: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  work_done: "bg-teal-100 text-teal-800 border-teal-200",
  photo_sent: "bg-cyan-100 text-cyan-800 border-cyan-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  reviewed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

// ===== Trạng thái thanh toán =====
export type PaymentStatus = "pending" | "paid";

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
} as const satisfies Record<string, PaymentStatus>;

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: "Chờ duyệt tiền",
  paid: "Đã thanh toán",
};

export const paymentStatusColor: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

// ===== Pricing =====
// Mỗi mức giá gồm: Khách trả = Người dọn nhận + CleanLink thu (phí nền tảng).
// `null` nghĩa là báo giá riêng / theo thỏa thuận.
export type PriceSplit = {
  customer: number | null;
  cleaner: number | null;
  platform: number | null;
};

// Tuỳ chọn có khóa định danh (dùng cho form ước tính / đặt lịch)
export type PricedOption = PriceSplit & { value: string; label: string };

// Bảng 1: Giá dọn phòng lưu trú
export const ROOM_PRICING: Record<RoomTypeKey, PriceSplit & { label: string }> = {
  standard: { label: "Phòng tiêu chuẩn dưới 25m²", customer: 60000, cleaner: 50000, platform: 10000 },
  large: { label: "Phòng lớn 25–40m²", customer: 80000, cleaner: 65000, platform: 15000 },
  family: { label: "Phòng gia đình 40–60m²", customer: 110000, cleaner: 90000, platform: 20000 },
  kitchen: { label: "Phòng có bếp nhỏ", customer: 120000, cleaner: 100000, platform: 20000 },
  special: { label: "Phòng đặc biệt trên 60m²", customer: null, cleaner: null, platform: null },
};

export const ROOM_PRICE_ORDER: RoomTypeKey[] = ["standard", "large", "family", "kitchen", "special"];

// Giá khách trả / phòng (0 = báo giá riêng)
export const ROOM_PRICE: Record<RoomTypeKey, number> = {
  standard: 60000,
  large: 80000,
  family: 110000,
  kitchen: 120000,
  special: 0,
};

// Ví dụ minh họa cho Bảng 1
export const ROOM_EXAMPLE = {
  customerTotal: 300000,
  cleanerTotal: 250000,
  platformTotal: 50000,
  note: "Mức phí 10.000đ/phòng chỉ phù hợp nếu CleanLink kiểm soát tốt chi phí vận hành và có nhiều phòng được dọn trong cùng một địa điểm.",
};

// Bảng 2: Giá theo số lượng phòng (phòng tiêu chuẩn)
export const ROOM_COUNT_PRICING: { rooms: number; price: number }[] = [1, 2, 3, 4, 5, 6, 7, 8].map(
  (rooms) => ({ rooms, price: rooms * ROOM_PRICE.standard }),
);
export const ROOM_COUNT_CONTRACT_THRESHOLD = 10;

// Bảng 3: Hình thức A – Dọn dẹp nhà ở theo giờ
export const HOURLY_PRICING: PricedOption[] = [
  { value: "2h", label: "2 giờ", customer: 140000, cleaner: 120000, platform: 20000 },
  { value: "3h", label: "3 giờ", customer: 210000, cleaner: 180000, platform: 30000 },
  { value: "4h", label: "4 giờ", customer: 280000, cleaner: 240000, platform: 40000 },
  { value: "5h", label: "5 giờ", customer: 350000, cleaner: 300000, platform: 50000 },
  { value: "6h", label: "6 giờ", customer: 420000, cleaner: 360000, platform: 60000 },
];

// Hình thức B – Dọn căn hộ theo diện tích
export const AREA_PRICING: PricedOption[] = [
  { value: "studio", label: "Studio (dưới 40m²)", customer: 140000, cleaner: 120000, platform: 20000 },
  { value: "1br", label: "Căn hộ 1 phòng ngủ (40–60m²)", customer: 180000, cleaner: 155000, platform: 25000 },
  { value: "2br", label: "Căn hộ 2 phòng ngủ (60–80m²)", customer: 240000, cleaner: 205000, platform: 35000 },
  { value: "3br", label: "Căn hộ 3 phòng ngủ (80–110m²)", customer: 320000, cleaner: 275000, platform: 45000 },
  { value: "townhouse", label: "Nhà phố nhỏ (80–120m²)", customer: 350000, cleaner: 300000, platform: 50000 },
  { value: "large", label: "Nhà lớn trên 120m²", customer: null, cleaner: null, platform: null },
];

// Bảng giá phụ thu đề xuất
export const URGENT_FEE = 20000;
export const SURCHARGES: { label: string; value: string }[] = [
  { label: "Đặt lịch thông thường", value: "Miễn phí" },
  { label: "Đặt gấp, cần bắt đầu trong 2 giờ", value: "+20.000đ/đơn" },
  { label: "Dọn sau 20 giờ", value: "+20.000đ/đơn" },
  { label: "Dọn phòng bẩn nhiều", value: "Báo giá thêm trước khi thực hiện" },
  { label: "Vệ sinh tủ lạnh bên trong", value: "+30.000đ" },
  { label: "Vệ sinh lò vi sóng bên trong", value: "+20.000đ" },
  { label: "Vệ sinh kính khó tiếp cận", value: "Báo giá riêng" },
  { label: "Ngoài khu vực phục vụ tiêu chuẩn", value: "Phụ thu di chuyển được báo trước" },
];

// Phụ thu dọn sau 20 giờ (tính theo đơn)
export const AFTER_HOURS_FEE = 20000;

// Ba gói dịch vụ chính
export type ServiceType = "lodging" | "hourly" | "area";

export const serviceTypes: readonly { value: ServiceType; label: string; hint: string }[] = [
  { value: "lodging", label: "Dọn phòng lưu trú", hint: "Homestay / Khách sạn" },
  { value: "hourly", label: "Dọn dẹp nhà ở theo giờ", hint: "Hình thức A" },
  { value: "area", label: "Dọn căn hộ theo diện tích", hint: "Hình thức B" },
];

// Dịch vụ bổ sung có phụ thu (fee = null: báo giá riêng / báo giá thêm trước khi làm)
export const EXTRA_OPTIONS: readonly { value: string; label: string; fee: number | null; note: string }[] = [
  { value: "fridge", label: "Vệ sinh tủ lạnh bên trong", fee: 30000, note: "+30.000đ" },
  { value: "microwave", label: "Vệ sinh lò vi sóng bên trong", fee: 20000, note: "+20.000đ" },
  { value: "glass", label: "Vệ sinh kính khó tiếp cận", fee: null, note: "Báo giá riêng" },
  { value: "dirty", label: "Dọn phòng bẩn nhiều", fee: null, note: "Báo giá thêm trước khi làm" },
];

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
    roomType: "standard",
    timeSlot: "13-14",
    urgency: "urgent",
    addons: ["toilet", "rac", "ga"],
    price: 320000,
    cleaner: "Nguyễn Thị Lan",
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
    rooms: 4,
    roomType: "standard",
    timeSlot: "12-13",
    urgency: "normal",
    addons: ["toilet", "rac", "ga", "san"],
    price: 240000,
    cleaner: "Trần Văn Sơn + 1",
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
    roomType: "kitchen",
    timeSlot: "11-12",
    urgency: "normal",
    addons: ["ga", "khan"],
    price: 240000,
    cleaner: "Lê Thị Lan",
    status: "completed",
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
    roomType: "standard",
    timeSlot: "13-14",
    urgency: "normal",
    addons: ["toilet", "ga"],
    price: 180000,
    status: "searching",
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
    roomType: "standard",
    timeSlot: "12-13",
    urgency: "urgent",
    addons: ["toilet", "rac", "ga", "san", "khan"],
    price: 260000,
    cleaner: "Phạm Thị Mai + 1",
    status: "accepted",
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
    roomType: "standard",
    timeSlot: "11-12",
    urgency: "normal",
    addons: ["ga"],
    price: 60000,
    cleaner: "Đoàn Thị Thu",
    status: "reviewed",
  },
];

// ===== Sample jobs for cleaner-facing screen =====
export type Job = {
  id: string;
  property: string;
  address: string;
  area: string;
  rooms: number;
  roomType: RoomTypeKey;
  timeSlot: string;
  distanceKm: number;
  earnMin: number;
  earnMax: number;
  urgency: "normal" | "urgent";
  requirements: string[];
};

export const sampleJobs: Job[] = [
  {
    id: "JOB-1042",
    property: "Mai House Homestay",
    address: "12 Xuân Diệu, Quy Nhơn",
    area: "trung_tam",
    rooms: 5,
    roomType: "standard",
    timeSlot: "13-14",
    distanceKm: 2.1,
    earnMin: 250000,
    earnMax: 250000,
    urgency: "urgent",
    requirements: [
      "Dọn 5 phòng tiêu chuẩn sau khi khách trả phòng",
      "Chỉnh ga giường, kiểm tra khăn",
      "Gửi hình ảnh sau khi hoàn tất",
    ],
  },
  {
    id: "JOB-1041",
    property: "Seaview Mini Hotel",
    address: "68 Nhơn Lý, Quy Nhơn",
    area: "nhon_ly",
    rooms: 4,
    roomType: "standard",
    timeSlot: "12-13",
    distanceKm: 12.4,
    earnMin: 200000,
    earnMax: 200000,
    urgency: "normal",
    requirements: [
      "Dọn 4 phòng tiêu chuẩn",
      "Thu gom rác, lau sàn",
      "Kiểm tra khăn và vật dụng cơ bản",
    ],
  },
  {
    id: "JOB-1040",
    property: "Bãi Xếp Ocean Studio",
    address: "Bãi Xếp, Ghềnh Ráng",
    area: "bai_xep",
    rooms: 2,
    roomType: "kitchen",
    timeSlot: "11-12",
    distanceKm: 5.8,
    earnMin: 200000,
    earnMax: 200000,
    urgency: "normal",
    requirements: [
      "Dọn 2 phòng có bếp riêng",
      "Chú ý khu vực bếp và bồn rửa",
      "Chỉnh ga giường, kiểm tra khăn",
    ],
  },
];

// ===== Danh sách công việc cho từng phòng =====
export const checklistItems = [
  { id: "rac", label: "Thu gom rác" },
  { id: "toilet", label: "Dọn nhà vệ sinh" },
  { id: "surface", label: "Lau bàn, kệ và bề mặt dễ thấy" },
  { id: "floor", label: "Quét và lau sàn" },
  { id: "bed", label: "Chỉnh ga giường" },
  { id: "khan", label: "Kiểm tra khăn và vật dụng cơ bản" },
  { id: "photo", label: "Gửi ảnh sau khi dọn" },
];

export function labelFrom<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string,
) {
  return list.find((x) => x.value === value)?.label ?? value;
}
