import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { sampleJobs, formatVND, labelFrom, areas, timeSlots } from "@/lib/cleanlink-data";
import { MapPin, Clock, Wallet, Zap, Navigation, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/nguoi-don")({
  head: () => ({
    meta: [
      { title: "Nhận việc – CleanLink cho người dọn" },
      { name: "description", content: "Trang dành cho người dọn CleanLink: xem job mới gần bạn, nhận việc, xem thu nhập dự kiến." },
    ],
  }),
  component: CleanerPage,
});

function CleanerPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-12">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider">Người dọn CleanLink</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-bold">Job mới gần bạn</h1>
              <p className="mt-2 text-muted-foreground">Hôm nay có 3 đơn phù hợp với khu vực Quy Nhơn.</p>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur px-4 py-3 shadow-card">
              <p className="text-xs text-muted-foreground">Thu nhập tuần này</p>
              <p className="text-xl font-bold text-primary">2.480.000đ</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 md:px-6 py-10 space-y-4">
        {sampleJobs.map((j) => (
          <article key={j.id} className="rounded-2xl bg-card border border-border/60 shadow-card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Dọn {j.rooms} phòng tại {j.property}</h2>
                  {j.urgency === "urgent" && (
                    <span className="inline-flex items-center gap-1 text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 font-medium">
                      <Zap className="h-3 w-3" /> Gấp
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {j.address} · {labelFrom(areas, j.area)}
                </p>
              </div>
              <span className="rounded-full bg-mint/40 text-mint-foreground text-xs px-3 py-1 font-medium">{j.id}</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Khung giờ</p>
                <p className="mt-0.5 font-semibold">{labelFrom(timeSlots, j.timeSlot)}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Thu nhập dự kiến</p>
                <p className="mt-0.5 font-semibold text-primary">{formatVND(j.earnMin)} – {formatVND(j.earnMax)}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Navigation className="h-3 w-3" /> Khoảng cách</p>
                <p className="mt-0.5 font-semibold">Cách bạn ~ {j.distanceKm} km</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => toast.success(`Đã nhận việc ${j.id}`)}
                className="rounded-full"
              >
                <Check className="mr-1 h-4 w-4" /> Nhận việc
              </Button>
              <Button
                variant="outline"
                onClick={() => toast("Đã từ chối", { description: j.id })}
                className="rounded-full"
              >
                <X className="mr-1 h-4 w-4" /> Từ chối
              </Button>
              <Button variant="ghost" className="rounded-full">
                <Navigation className="mr-1 h-4 w-4" /> Xem chỉ đường
              </Button>
            </div>
          </article>
        ))}

        <div className="mt-8 rounded-2xl bg-mint/40 border border-mint p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold">Sau khi bắt đầu dọn</p>
            <p className="text-sm text-muted-foreground">Hoàn thành checklist 7 hạng mục và gửi ảnh xác nhận.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-full"><Link to="/checklist">Checklist</Link></Button>
            <Button asChild className="rounded-full"><Link to="/anh-xac-nhan">Gửi ảnh</Link></Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
