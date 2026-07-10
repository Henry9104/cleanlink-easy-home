import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LogIn,
  Building2,
  Camera,
  ListChecks,
  MapPin,
  ArrowRight,
  Star,
  Zap,
  ShieldCheck,
} from "lucide-react";
import heroImg from "@/assets/hero-clean.jpg";
import staffImg from "@/assets/staff.jpg";
import { services } from "@/lib/cleanlink-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CleanLink – Đặt người dọn nhanh cho homestay & mini hotel Quy Nhơn" },
      {
        name: "description",
        content:
          "CleanLink giúp chủ homestay, mini hotel và căn hộ thuê ngắn hạn tại Quy Nhơn đặt người dọn nhanh trong khung giờ check-out/check-in, có tracking, checklist và ảnh xác nhận.",
      },
    ],
  }),
  component: Home,
});

const promises = [
  { icon: LogOut, title: "Dọn phòng nhanh sau check-out", desc: "Điều phối người dọn trong 30–60 phút, kịp turnover trưa." },
  { icon: LogIn, title: "Sẵn sàng phòng trước giờ check-in", desc: "Cam kết phòng gọn gàng trước 14:00 mỗi ngày." },
  { icon: Building2, title: "Phù hợp homestay, mini hotel, căn hộ", desc: "Xử lý cùng lúc nhiều phòng cho cơ sở lưu trú ngắn hạn." },
  { icon: MapPin, title: "Phủ toàn Quy Nhơn", desc: "Trung tâm, Nhơn Lý, Eo Gió, Bãi Xếp, Nhơn Hải." },
  { icon: Camera, title: "Ảnh xác nhận sau khi dọn", desc: "Chủ cơ sở kiểm tra chất lượng ngay trên app từ xa." },
  { icon: ListChecks, title: "Checklist chuẩn cho từng phòng", desc: "7 hạng mục bắt buộc, không sót đầu việc." },
];

const flow = [
  { n: 1, title: "Chủ cơ sở đặt lịch", desc: "Điền số phòng, khung giờ, khu vực – 60 giây." },
  { n: 2, title: "Xem giá dự kiến & xác nhận", desc: "Giá minh bạch theo số phòng, phụ phí gấp rõ ràng." },
  { n: 3, title: "Người dọn nhận việc", desc: "Điều phối tự động, ưu tiên người dọn gần nhất." },
  { n: 4, title: "Theo dõi trạng thái", desc: "Đang di chuyển, đang dọn, đã hoàn thành – realtime." },
  { n: 5, title: "Checklist & ảnh xác nhận", desc: "Người dọn tick 7 hạng mục, chụp ảnh sau khi dọn." },
  { n: 6, title: "Thanh toán & đánh giá", desc: "Thanh toán trên app, đánh giá sao cho người dọn." },
];

function Home() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-primary shadow-card backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              Nền tảng dọn phòng lưu trú ngắn hạn tại Quy Nhơn
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-foreground">
              Đặt người dọn nhanh{" "}
              <span className="text-primary">trong giờ check-out</span>,
              <br className="hidden md:block" /> phòng sẵn sàng trước check-in
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl">
              CleanLink dành riêng cho chủ homestay, mini hotel và căn hộ thuê ngắn hạn tại Quy Nhơn – có tracking, checklist chất lượng và ảnh xác nhận sau khi dọn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7 shadow-soft">
                <Link to="/dat-lich">
                  Đặt người dọn <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7 bg-white/60 backdrop-blur">
                <Link to="/gia-du-kien">Xem giá dự kiến</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {[0,1,2,3,4].map((i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                <span className="ml-2 font-semibold text-foreground">4.8/5</span>
              </div>
              <div>· Đã hoàn tất <span className="font-semibold text-foreground">3.200+</span> lượt turnover</div>
              <div className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-primary" /> Người dọn đã xác minh</div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-soft aspect-[4/3]">
              <img src={heroImg} alt="Phòng homestay Quy Nhơn sạch sẽ sau khi CleanLink turnover" width={1600} height={1200} className="h-full w-full object-cover" />
            </div>
            <div className="hidden md:block absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-card w-72">
              <div className="flex items-center gap-3">
                <img src={staffImg} alt="Người dọn CleanLink" width={48} height={48} loading="lazy" className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold">Chị Hồng · Người dọn</p>
                  <p className="text-xs text-muted-foreground">5 phòng · Mai House Homestay</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-mint/40 px-3 py-2 text-xs text-mint-foreground font-medium">
                <span>Đang di chuyển · ETA 8 phút</span>
                <span className="rounded-full bg-white/70 px-2 py-0.5">2,1 km</span>
              </div>
            </div>
            <div className="hidden md:flex absolute -top-4 -right-4 items-center gap-2 rounded-full bg-white px-3 py-2 shadow-card text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 text-primary" /> Turnover 11:00–14:00
            </div>
          </div>
        </div>
      </section>

      {/* PROMISES */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Vì sao chủ cơ sở lưu trú chọn CleanLink</h2>
          <p className="mt-3 text-muted-foreground">Được thiết kế riêng cho bài toán turnover giữa các lượt khách ngắn ngày.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {promises.map((b) => (
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

      {/* FLOW */}
      <section className="bg-gradient-soft">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">Flow hai phía trên nền tảng</h2>
            <p className="mt-3 text-muted-foreground">Từ đặt lịch tới đánh giá – mọi bước đều số hóa trên CleanLink.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {flow.map((s) => (
              <div key={s.n} className="rounded-2xl bg-card p-6 border border-border/60 shadow-card relative">
                <div className="absolute -top-3 -left-3 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-soft">
                  {s.n}
                </div>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Dịch vụ dọn phòng</h2>
            <p className="mt-2 text-muted-foreground">Ba gói dịch vụ cốt lõi cho cơ sở lưu trú ngắn hạn.</p>
          </div>
          <Button asChild variant="ghost" className="text-primary">
            <Link to="/dich-vu">Xem tất cả <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {services.slice(0, 3).map((s) => (
            <div key={s.slug} className="group rounded-2xl bg-card p-6 shadow-card border border-border/60 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky/60 text-sky-foreground">
                  <s.icon className="h-6 w-6" />
                </div>
                {s.tag && <span className="text-xs rounded-full bg-mint/60 text-mint-foreground px-2 py-1 font-medium">{s.tag}</span>}
              </div>
              <h3 className="mt-4 font-semibold text-lg">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.duration}</span>
                <span className="font-semibold text-primary">{s.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-20">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-14 shadow-soft text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Turnover phòng không còn là gánh nặng</h2>
          <p className="mt-3 opacity-90 max-w-xl mx-auto">
            Đặt người dọn cho homestay của bạn ngay hôm nay – CleanLink lo phần còn lại.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
              <Link to="/dat-lich">Đặt người dọn</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/nguoi-don">Tôi là người dọn</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
