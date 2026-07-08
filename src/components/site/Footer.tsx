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
            Cleanlink
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Nền tảng đặt lịch dịch vụ dọn dẹp vệ sinh chuyên nghiệp, minh bạch và tận tâm.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Dịch vụ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/dich-vu" className="hover:text-primary">Dọn dẹp theo giờ</Link></li>
            <li><Link to="/dich-vu" className="hover:text-primary">Tổng vệ sinh</Link></li>
            <li><Link to="/dich-vu" className="hover:text-primary">Vệ sinh văn phòng</Link></li>
            <li><Link to="/dich-vu" className="hover:text-primary">Giặt sofa, nệm</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Công ty</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/gioi-thieu" className="hover:text-primary">Giới thiệu</Link></li>
            <li><Link to="/quy-trinh" className="hover:text-primary">Quy trình</Link></li>
            <li><Link to="/cong-tac-vien" className="hover:text-primary">Cộng tác viên</Link></li>
            <li><Link to="/lien-he" className="hover:text-primary">Liên hệ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Liên hệ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 1900 8686</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@cleanlink.vn</li>
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /> 12 Nguyễn Huệ, Q.1, TP.HCM</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-5 text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Cleanlink. Sạch sẽ – Trung thực – Đúng giờ.</p>
          <p>Đặt lịch dọn dẹp dễ dàng tại Việt Nam</p>
        </div>
      </div>
    </footer>
  );
}
