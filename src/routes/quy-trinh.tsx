import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Calculator,
  UserCheck,
  Route as RouteIcon,
  ListChecks,
  Camera,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/quy-trinh")({
  head: () => ({
    meta: [
      { title: "Quy trình vận hành – CleanLink" },
      { name: "description", content: "7 bước vận hành CleanLink từ đặt lịch đến đánh giá, dành cho chủ homestay/mini hotel Quy Nhơn." },
    ],
  }),
  component: ProcessPage,
});

const steps = [
  { icon: ClipboardList, title: "Chủ cơ sở đặt lịch", desc: "Chọn số phòng, khung giờ, khu vực và yêu cầu thêm." },
  { icon: Calculator, title: "Xem giá dự kiến", desc: "Giá minh bạch theo số phòng, phụ phí gấp rõ ràng." },
  { icon: UserCheck, title: "Xác nhận đơn", desc: "CleanLink ghép người dọn phù hợp trong 30–60 phút." },
  { icon: RouteIcon, title: "Theo dõi trạng thái", desc: "Xem ETA, chỉ đường và trạng thái người dọn realtime." },
  { icon: ListChecks, title: "Checklist chất lượng", desc: "Người dọn tick 7 hạng mục bắt buộc cho từng phòng." },
  { icon: Camera, title: "Ảnh xác nhận sau dọn", desc: "Ảnh trước/sau gửi thẳng về app cho chủ cơ sở." },
  { icon: Star, title: "Thanh toán & đánh giá", desc: "Thanh toán trên app và đánh giá sao cho người dọn." },
];

function ProcessPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Quy trình 7 bước</h1>
          <p className="mt-4 text-muted-foreground">Từ đặt lịch đến đánh giá – flow chuẩn cho cơ sở lưu trú ngắn hạn.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl bg-card border border-border/60 p-6 shadow-card relative">
              <div className="absolute -top-3 -left-3 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-soft">
                {i + 1}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint/50 text-mint-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/dat-lich">Bắt đầu đặt lịch</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
