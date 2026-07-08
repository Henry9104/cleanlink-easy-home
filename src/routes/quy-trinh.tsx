import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { MousePointerClick, ClipboardList, UserCheck, Star } from "lucide-react";

export const Route = createFileRoute("/quy-trinh")({
  head: () => ({
    meta: [
      { title: "Quy trình đặt lịch – Cleanlink" },
      { name: "description", content: "4 bước đơn giản để có một ngôi nhà sạch sẽ cùng Cleanlink." },
    ],
  }),
  component: ProcessPage,
});

const steps = [
  { icon: MousePointerClick, title: "Chọn dịch vụ", desc: "Xem danh sách gói dịch vụ và chọn gói phù hợp." },
  { icon: ClipboardList, title: "Điền thông tin & đặt lịch", desc: "Cung cấp địa chỉ, ngày giờ mong muốn trong 60 giây." },
  { icon: UserCheck, title: "Cleanlink xác nhận cộng tác viên", desc: "Chúng tôi ghép nối và xác nhận nhân sự phù hợp." },
  { icon: Star, title: "Hoàn thành & đánh giá", desc: "Nghiệm thu công việc, đánh giá chất lượng và thanh toán." },
];

function ProcessPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Chỉ 4 bước đơn giản</h1>
          <p className="mt-4 text-muted-foreground">Cleanlink được thiết kế để bạn dùng dễ như đặt xe công nghệ.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative">
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
