import { Link } from "@tanstack/react-router";
import { Sparkles, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            CleanLink
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Nền tảng đặt người dọn dành cho chủ homestay, mini hotel và căn hộ thuê ngắn hạn tại Quy Nhơn.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Cho chủ cơ sở</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/dat-lich" className="hover:text-primary">Đặt lịch dọn</Link></li>
            <li><Link to="/gia-du-kien" className="hover:text-primary">Giá dự kiến</Link></li>
            <li><Link to="/theo-doi-don" className="hover:text-primary">Theo dõi đơn</Link></li>
            <li><Link to="/thanh-toan" className="hover:text-primary">Thanh toán</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Cho người dọn</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/nguoi-don" className="hover:text-primary">Nhận việc</Link></li>
            <li><Link to="/checklist" className="hover:text-primary">Checklist</Link></li>
            <li><Link to="/anh-xac-nhan" className="hover:text-primary">Ảnh xác nhận</Link></li>
            <li><Link to="/tin-nhan" className="hover:text-primary">Tin nhắn</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Liên hệ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 0905 123 456</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@cleanlink.vn</li>
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /> Trung tâm Quy Nhơn, Bình Định</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-5 text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} CleanLink. Nền tảng dọn phòng lưu trú ngắn hạn.</p>
          <p>Khu vực hoạt động: Quy Nhơn, Bình Định</p>
        </div>
      </div>
    </footer>
  );
}
