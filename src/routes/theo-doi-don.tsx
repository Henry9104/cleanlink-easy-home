import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Navigation, MapPin, Clock, CheckCircle2 } from "lucide-react";
import staffImg from "@/assets/staff.jpg";

export const Route = createFileRoute("/theo-doi-don")({
  head: () => ({
    meta: [
      { title: "Theo dõi đơn – CleanLink" },
      { name: "description", content: "Theo dõi trạng thái đơn dọn phòng, xem người dọn đang ở đâu, dự kiến đến sau bao lâu và liên hệ trực tiếp." },
    ],
  }),
  component: TrackingPage,
});

const steps = [
  { key: "created", label: "Đã tạo đơn", done: true },
  { key: "searching", label: "Đang tìm người dọn", done: true },
  { key: "accepted", label: "Người dọn đã nhận việc", done: true },
  { key: "on_the_way", label: "Người dọn đang đến cơ sở", done: true, active: true },
  { key: "in_progress", label: "Đang thực hiện", done: false },
  { key: "work_done", label: "Đã hoàn thành các công việc", done: false },
  { key: "photo_sent", label: "Đã gửi ảnh xác nhận", done: false },
  { key: "completed", label: "Hoàn tất dịch vụ", done: false },
];

function TrackingPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Mã đơn</p>
            <h1 className="text-2xl font-bold font-mono">CL240712</h1>
          </div>
          <span className="rounded-full bg-indigo-100 text-indigo-800 px-3 py-1 text-xs font-semibold border border-indigo-200">
            Người dọn đang đến cơ sở
          </span>
        </div>

        {/* Bản đồ minh hoạ */}
        <div className="mt-6 relative rounded-3xl overflow-hidden border border-border/60 shadow-card h-[360px] bg-gradient-to-br from-sky/50 via-mint/40 to-sky/60">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 360" preserveAspectRatio="none">
            <g stroke="oklch(0.85 0.02 210)" strokeWidth="1">
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={40 + i * 34} x2="800" y2={40 + i * 34} />
              ))}
              {Array.from({ length: 14 }).map((_, i) => (
                <line key={`v${i}`} x1={60 + i * 55} y1="0" x2={60 + i * 55} y2="360" />
              ))}
            </g>
            <path
              d="M 140 280 C 260 280, 300 200, 420 180 S 620 150, 660 90"
              stroke="oklch(0.72 0.14 165)"
              strokeWidth="5"
              strokeDasharray="10 6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute right-16 top-14 flex flex-col items-center">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="mt-1 text-xs bg-white px-2 py-0.5 rounded-full shadow font-semibold">Cơ sở</span>
          </div>
          <div className="absolute left-24 bottom-16 flex flex-col items-center">
            <div className="h-11 w-11 rounded-full bg-white p-0.5 shadow-soft ring-2 ring-primary">
              <img src={staffImg} alt="Người dọn" className="h-full w-full rounded-full object-cover" />
            </div>
            <span className="mt-1 text-xs bg-white px-2 py-0.5 rounded-full shadow font-semibold">Chị Lan</span>
          </div>
          <div className="absolute top-4 left-4 bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-mint/60 text-primary flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dự kiến đến sau</p>
              <p className="font-bold">8 phút · 2,1 km</p>
            </div>
          </div>
        </div>

        {/* Hành động */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Button variant="outline" className="rounded-full h-12"><Navigation className="mr-1 h-4 w-4" /> Xem chỉ đường</Button>
          <Button variant="outline" className="rounded-full h-12"><Phone className="mr-1 h-4 w-4" /> Gọi người dọn</Button>
          <Button asChild variant="outline" className="rounded-full h-12">
            <Link to="/tin-nhan"><MessageCircle className="mr-1 h-4 w-4" /> Nhắn tin</Link>
          </Button>
        </div>

        {/* Thẻ người dọn */}
        <div className="mt-6 rounded-2xl bg-card border border-border/60 shadow-card p-5 flex items-center gap-4">
          <img src={staffImg} alt="Người dọn" className="h-14 w-14 rounded-full object-cover" />
          <div className="flex-1">
            <p className="font-semibold">Nguyễn Thị Lan · Đã xác minh</p>
            <p className="text-xs text-muted-foreground">Dọn 5 phòng tại Mai House Homestay · 12 Xuân Diệu, Quy Nhơn</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Tổng đơn</p>
            <p className="font-bold text-primary">650.000đ</p>
          </div>
        </div>

        {/* Trạng thái đơn */}
        <div className="mt-6 rounded-2xl bg-card border border-border/60 shadow-card p-6">
          <h2 className="font-semibold">Trạng thái đơn</h2>
          <ol className="mt-4 space-y-3">
            {steps.map((s) => (
              <li key={s.key} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    s.done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  } ${s.active ? "ring-4 ring-primary/20" : ""}`}
                >
                  {s.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : ""}
                </div>
                <div>
                  <p className={`text-sm font-medium ${s.active ? "text-primary" : ""}`}>{s.label}</p>
                  {s.active && <p className="text-xs text-muted-foreground">Cách cơ sở khoảng 2,1 km · dự kiến đến sau 8 phút</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/checklist">Xem danh sách công việc</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/anh-xac-nhan">Xem hình ảnh sau khi dọn</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
