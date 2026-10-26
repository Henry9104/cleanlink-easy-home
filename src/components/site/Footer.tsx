import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, MessageCircle, Facebook } from "lucide-react";
import { BrandLogo } from "@/components/site/BrandLogo";
import { CONTACT } from "@/lib/contact-info";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-14 w-14 object-contain" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            CleanLink là nền tảng kết nối chủ cơ sở lưu trú với người dọn tại Quy Nhơn.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Dành cho chủ cơ sở</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/dat-lich" className="hover:text-primary">Đặt lịch dọn phòng</Link></li>
            <li><Link to="/gia-du-kien" className="hover:text-primary">Xem giá dự kiến</Link></li>
            <li><Link to="/theo-doi-don" className="hover:text-primary">Theo dõi trạng thái đơn</Link></li>
            <li><Link to="/anh-xac-nhan" className="hover:text-primary">Kiểm tra hình ảnh sau khi dọn</Link></li>
            <li><Link to="/danh-gia" className="hover:text-primary">Đánh giá dịch vụ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Dành cho người dọn</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/nguoi-don" className="hover:text-primary">Xem công việc mới</Link></li>
            <li><Link to="/nguoi-don" className="hover:text-primary">Yêu cầu và thu nhập dự kiến</Link></li>
            <li><Link to="/nguoi-don" className="hover:text-primary">Nhận việc</Link></li>
            <li><Link to="/checklist" className="hover:text-primary">Đánh dấu công việc đã hoàn thành</Link></li>
            <li><Link to="/anh-xac-nhan" className="hover:text-primary">Gửi ảnh xác nhận</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Liên hệ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={CONTACT.hotlineHref} className="hover:text-primary">{CONTACT.hotline}</a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <a href={CONTACT.zaloUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Zalo: {CONTACT.zaloDisplay}</a>
            </li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> cleanlink.quynhon@gmail.com</li>
            <li className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              <a href={CONTACT.fanpageUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Fanpage CleanLink</a>
            </li>
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /> Khu vực hoạt động: {CONTACT.area}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-5 text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} CleanLink. Nền tảng kết nối chủ cơ sở lưu trú với người dọn.</p>
          <p>Khu vực hoạt động: {CONTACT.area}</p>
        </div>
      </div>
    </footer>
  );
}
