import {
  Clock,
  Repeat,
  Sparkles,
  Building2,
  Hotel,
  HardHat,
  Sofa,
  ChefHat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Service = {
  slug: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  icon: LucideIcon;
};

export const services: Service[] = [
  {
    slug: "theo-gio",
    name: "Dọn dẹp nhà theo giờ",
    description: "Lau dọn, hút bụi, làm sạch bề mặt cho gia đình bận rộn cần hỗ trợ nhanh.",
    duration: "2 – 4 giờ",
    price: "Từ 80.000đ/giờ",
    icon: Clock,
  },
  {
    slug: "dinh-ky",
    name: "Dọn dẹp định kỳ",
    description: "Gói hằng tuần hoặc hằng tháng, cùng một cộng tác viên quen thuộc, ưu đãi tốt.",
    duration: "3 – 5 giờ/lần",
    price: "Từ 70.000đ/giờ",
    icon: Repeat,
  },
  {
    slug: "tong-ve-sinh",
    name: "Tổng vệ sinh nhà ở",
    description: "Vệ sinh sâu toàn bộ căn hộ, nhà phố – phù hợp trước Tết hoặc khi chuyển nhà.",
    duration: "4 – 8 giờ",
    price: "Báo giá theo diện tích",
    icon: Sparkles,
  },
  {
    slug: "van-phong",
    name: "Vệ sinh văn phòng",
    description: "Gói định kỳ cho văn phòng, showroom, phòng họp – linh hoạt ngoài giờ.",
    duration: "Theo gói",
    price: "Liên hệ báo giá",
    icon: Building2,
  },
  {
    slug: "homestay",
    name: "Vệ sinh homestay & khách sạn",
    description: "Turnover nhanh giữa các lượt khách, thay ga, dọn phòng chuẩn dịch vụ.",
    duration: "1 – 3 giờ/phòng",
    price: "Từ 120.000đ/phòng",
    icon: Hotel,
  },
  {
    slug: "sau-xay-dung",
    name: "Vệ sinh sau xây dựng",
    description: "Xử lý bụi xi măng, sơn, keo dán – trả lại không gian sẵn sàng dọn vào ở.",
    duration: "6 – 12 giờ",
    price: "Từ 25.000đ/m²",
    icon: HardHat,
  },
  {
    slug: "sofa-nem",
    name: "Giặt sofa, rèm, nệm",
    description: "Giặt hấp chuyên dụng, khử khuẩn, khử mùi cho sofa vải, nệm và rèm cửa.",
    duration: "2 – 5 giờ",
    price: "Từ 250.000đ/món",
    icon: Sofa,
  },
  {
    slug: "bep-nha-tam",
    name: "Vệ sinh bếp & nhà tắm chuyên sâu",
    description: "Đánh bay dầu mỡ, cặn xà phòng, ố vàng – trả lại bề mặt sáng bóng.",
    duration: "2 – 4 giờ",
    price: "Từ 350.000đ/khu vực",
    icon: ChefHat,
  },
];

export type Booking = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  service: string;
  area: string;
  date: string;
  time: string;
  hours: string;
  bringTools: boolean;
  payment: string;
  note?: string;
  status: "pending" | "confirmed" | "in_progress" | "done" | "cancelled";
};

const BOOKINGS_KEY = "cleanlink_bookings";
const PARTNERS_KEY = "cleanlink_partners";

export function getBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveBooking(b: Omit<Booking, "id" | "createdAt" | "status">) {
  const list = getBookings();
  const item: Booking = {
    ...b,
    id: `CL${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  list.unshift(item);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
  return item;
}

export function updateBookingStatus(id: string, status: Booking["status"]) {
  const list = getBookings().map((b) => (b.id === id ? { ...b, status } : b));
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
}

export type Partner = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  area: string;
  experience: string;
  availability: string;
};

export function getPartners(): Partner[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PARTNERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function savePartner(p: Omit<Partner, "id" | "createdAt">) {
  const list = getPartners();
  const item: Partner = {
    ...p,
    id: `PT${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
  };
  list.unshift(item);
  localStorage.setItem(PARTNERS_KEY, JSON.stringify(list));
  return item;
}

export const statusLabel: Record<Booking["status"], string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  in_progress: "Đang thực hiện",
  done: "Hoàn thành",
  cancelled: "Đã hủy",
};
