import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/bang-gia")({
  head: () => ({
    meta: [
      { title: "Bảng giá dịch vụ dọn dẹp – Cleanlink" },
      { name: "description", content: "Bảng giá minh bạch cho các dịch vụ dọn dẹp theo giờ, tổng vệ sinh, văn phòng, giặt sofa. Không phát sinh chi phí ẩn." },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Dọn dẹp theo giờ",
    price: "80.000đ",
    unit: "/giờ",
    features: ["Tối thiểu 2 giờ", "Cộng tác viên đã xác minh", "Hỗ trợ đổi lịch miễn phí"],
    highlight: false,
  },
  {
    name: "Tổng vệ sinh",
    price: "Báo giá",
    unit: "theo diện tích",
    features: ["Vệ sinh sâu toàn nhà", "Tặng giặt 1 sofa nhỏ", "Miễn phí khảo sát"],
    highlight: true,
  },
  {
    name: "Vệ sinh văn phòng",
    price: "Báo giá",
    unit: "theo gói",
    features: ["Định kỳ hằng tuần", "Ngoài giờ hành chính", "Báo cáo mỗi lần dọn"],
    highlight: false,
  },
  {
    name: "Giặt sofa, rèm, nệm",
    price: "Báo giá",
    unit: "theo số lượng",
    features: ["Máy giặt hấp chuyên dụng", "Khử khuẩn, khử mùi", "Bảo hành 7 ngày"],
    highlight: false,
  },
];

function PricingPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Bảng giá minh bạch</h1>
          <p className="mt-4 text-muted-foreground">Rõ ràng ngay từ đầu – không phụ phí bất ngờ.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl p-7 border shadow-card flex flex-col ${
                t.highlight
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/60"
              }`}
            >
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{t.price}</span>
                <span className={`text-sm ${t.highlight ? "opacity-80" : "text-muted-foreground"}`}>{t.unit}</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${t.highlight ? "" : "text-primary"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={t.highlight ? "secondary" : "default"}
                className="mt-6 rounded-full"
              >
                <Link to="/dat-lich">Đặt dịch vụ</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground text-center max-w-2xl mx-auto">
          Giá có thể thay đổi tùy khu vực, khối lượng công việc và yêu cầu thực tế. Vui lòng liên hệ để nhận báo giá chi tiết.
        </p>
      </section>
    </SiteLayout>
  );
}
