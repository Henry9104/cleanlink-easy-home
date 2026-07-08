import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePartner } from "@/lib/cleanlink-data";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { CheckCircle2, Sparkles, Wallet, CalendarClock } from "lucide-react";
import staffImg from "@/assets/staff.jpg";

export const Route = createFileRoute("/cong-tac-vien")({
  head: () => ({
    meta: [
      { title: "Trở thành cộng tác viên Cleanlink" },
      { name: "description", content: "Đăng ký làm cộng tác viên vệ sinh cùng Cleanlink – thu nhập ổn định, chủ động thời gian, được đào tạo miễn phí." },
    ],
  }),
  component: PartnerPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[0-9+\s.-]{9,15}$/),
  area: z.string().trim().min(2).max(100),
  experience: z.string().max(500).optional().default(""),
  availability: z.string().max(200).optional().default(""),
});

const perks = [
  { icon: Wallet, title: "Thu nhập ổn định", desc: "Nhận việc đều đặn qua nền tảng, thanh toán đúng hạn." },
  { icon: CalendarClock, title: "Chủ động thời gian", desc: "Chọn ca làm phù hợp với lịch cá nhân." },
  { icon: Sparkles, title: "Được đào tạo miễn phí", desc: "Trang bị kỹ năng và tiêu chuẩn dịch vụ Cleanlink." },
];

function PartnerPage() {
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      area: String(fd.get("area") || ""),
      experience: String(fd.get("experience") || ""),
      availability: String(fd.get("availability") || ""),
    };
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }
    savePartner(parsed.data);
    toast.success("Đã gửi đăng ký thành công");
    setDone(true);
  }

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold">Trở thành cộng tác viên Cleanlink</h1>
            <p className="mt-4 text-muted-foreground text-lg max-w-lg">
              Cleanlink chào đón những cộng tác viên chăm chỉ, trung thực, có trách nhiệm và mong muốn có thu nhập ổn định.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {perks.map((p) => (
                <div key={p.title} className="rounded-xl bg-white/70 backdrop-blur p-4 shadow-card">
                  <p.icon className="h-5 w-5 text-primary" />
                  <p className="mt-2 font-semibold text-sm">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-soft">
            <img src={staffImg} alt="Cộng tác viên Cleanlink chuyên nghiệp" width={1200} height={1400} loading="lazy" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 md:px-6 py-16">
        {done ? (
          <div className="text-center rounded-3xl bg-card border border-border/60 shadow-card p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint/60 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Cảm ơn bạn đã đăng ký!</h2>
            <p className="mt-3 text-muted-foreground">
              Cleanlink sẽ liên hệ trong vòng 48 giờ để phỏng vấn và hướng dẫn tiếp theo.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="rounded-3xl bg-card border border-border/60 shadow-card p-6 md:p-10 space-y-5">
            <h2 className="text-2xl font-bold">Đăng ký cộng tác viên</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="p-name">Họ tên *</Label>
                <Input id="p-name" name="name" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="p-phone">Số điện thoại *</Label>
                <Input id="p-phone" name="phone" required className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="p-area">Khu vực làm việc *</Label>
              <Input id="p-area" name="area" required placeholder="VD: Quận 1, Quận 3, TP.HCM" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="p-exp">Kinh nghiệm</Label>
              <Textarea id="p-exp" name="experience" rows={3} placeholder="Bạn đã từng làm việc ở đâu, kỹ năng nổi bật..." className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="p-avail">Thời gian có thể làm việc</Label>
              <Input id="p-avail" name="availability" placeholder="VD: T2–T6 sau 17h, cuối tuần cả ngày" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="p-id">Ảnh CCCD / hồ sơ cá nhân</Label>
              <Input id="p-id" name="id-photo" type="file" accept="image/*" className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">Chúng tôi bảo mật thông tin cá nhân của bạn.</p>
            </div>
            <Button type="submit" size="lg" className="w-full rounded-full">Đăng ký cộng tác viên</Button>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}
