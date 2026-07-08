import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/cleanlink-data";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dich-vu")({
  head: () => ({
    meta: [
      { title: "Dịch vụ dọn dẹp vệ sinh – Cleanlink" },
      { name: "description", content: "Từ dọn dẹp theo giờ, tổng vệ sinh đến giặt sofa, vệ sinh văn phòng – Cleanlink có đủ gói dịch vụ cho mọi nhu cầu." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Dịch vụ Cleanlink</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Đa dạng gói dịch vụ chuyên nghiệp – phù hợp với mọi không gian và ngân sách.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.slug} className="rounded-2xl bg-card p-7 shadow-card border border-border/60 flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint/50 text-mint-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-semibold">{s.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground flex-1">{s.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/60 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Thời gian</p>
                  <p className="font-medium">{s.duration}</p>
                </div>
                <div className="rounded-lg bg-muted/60 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Giá tham khảo</p>
                  <p className="font-semibold text-primary">{s.price}</p>
                </div>
              </div>
              <Button asChild className="mt-5 rounded-full">
                <Link to="/dat-lich" search={{ service: s.slug } as never}>
                  Đặt dịch vụ này <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
