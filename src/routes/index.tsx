import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Clock3,
  BadgeCheck,
  CalendarCheck,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  Star,
} from "lucide-react";
import heroImg from "@/assets/hero-clean.jpg";
import staffImg from "@/assets/staff.jpg";
import { services } from "@/lib/cleanlink-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cleanlink – Đặt lịch dọn dẹp dễ dàng, nhà sạch chỉ sau vài giờ" },
      {
        name: "description",
        content:
          "Cleanlink kết nối bạn với cộng tác viên vệ sinh đã được xác minh. Đặt lịch dọn dẹp nhà theo giờ, tổng vệ sinh, vệ sinh văn phòng chỉ trong 60 giây.",
      },
    ],
  }),
  component: Home,
});

const benefits = [
  { icon: CalendarCheck, title: "Đặt lịch nhanh chóng", desc: "Chỉ 60 giây với vài thao tác đơn giản." },
  { icon: ShieldCheck, title: "Nhân viên được xác minh", desc: "Danh tính và kỹ năng đều được kiểm tra." },
  { icon: BadgeCheck, title: "Giá minh bạch", desc: "Báo giá rõ ràng, không phát sinh bất ngờ." },
  { icon: Clock3, title: "Theo dõi lịch hẹn", desc: "Cập nhật trạng thái theo thời gian thực." },
  { icon: HeartHandshake, title: "Hỗ trợ tận tâm", desc: "Đội ngũ chăm sóc khách hàng 7 ngày/tuần." },
];

function Home() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-primary shadow-card backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Nền tảng dọn dẹp #1 dành cho gia đình Việt
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-foreground">
              Đặt lịch dọn dẹp{" "}
              <span className="text-primary">dễ dàng</span>,
              <br className="hidden md:block" /> nhà sạch chỉ sau vài giờ
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl">
              Cleanlink kết nối khách hàng với cộng tác viên vệ sinh được đào tạo, kiểm tra và đánh giá chất lượng.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7 shadow-soft">
                <Link to="/dat-lich">
                  Đặt lịch ngay <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7 bg-white/60 backdrop-blur">
                <Link to="/bang-gia">Xem bảng giá</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {[0,1,2,3,4].map((i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                <span className="ml-2 font-semibold text-foreground">4.9/5</span>
              </div>
              <div>·  Hơn <span className="font-semibold text-foreground">12.000</span> lịch đặt đã hoàn thành</div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-soft aspect-[4/3]">
              <img src={heroImg} alt="Không gian nhà sạch sẽ tinh tế sau khi Cleanlink hoàn tất" width={1600} height={1200} className="h-full w-full object-cover" />
            </div>
            <div className="hidden md:block absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-card w-64">
              <div className="flex items-center gap-3">
                <img src={staffImg} alt="Cộng tác viên Cleanlink" width={48} height={48} loading="lazy" className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold">Chị Lan · CTV</p>
                  <p className="text-xs text-muted-foreground">Đã hoàn thành 320+ lịch</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-mint/40 px-3 py-2 text-xs text-mint-foreground font-medium">
                Đang đến trong 15 phút ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Vì sao chọn Cleanlink</h2>
          <p className="mt-3 text-muted-foreground">Dịch vụ tận tâm, minh bạch và đáng tin cậy cho mọi gia đình.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl bg-card p-6 shadow-card border border-border/60 hover:-translate-y-1 transition-transform">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint/50 text-mint-foreground">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="bg-gradient-soft">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Dịch vụ nổi bật</h2>
              <p className="mt-2 text-muted-foreground">Chọn gói phù hợp với nhu cầu của bạn.</p>
            </div>
            <Button asChild variant="ghost" className="text-primary">
              <Link to="/dich-vu">Xem tất cả <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((s) => (
              <div key={s.slug} className="group rounded-2xl bg-card p-6 shadow-card border border-border/60 hover:border-primary/40 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky/60 text-sky-foreground">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{s.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.duration}</span>
                  <span className="font-semibold text-primary">{s.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-20">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-14 shadow-soft text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Sẵn sàng có một ngôi nhà thơm sạch?</h2>
          <p className="mt-3 opacity-90 max-w-xl mx-auto">Đặt lịch trong 60 giây – Cleanlink sẽ lo phần còn lại.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
              <Link to="/dat-lich">Đặt lịch ngay</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/lien-he">Liên hệ tư vấn</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
