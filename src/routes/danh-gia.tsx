import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Star } from "lucide-react";

export const Route = createFileRoute("/danh-gia")({
  head: () => ({
    meta: [
      { title: "Đánh giá khách hàng – Cleanlink" },
      { name: "description", content: "Hàng ngàn khách hàng đã tin dùng Cleanlink. Xem đánh giá thực tế về dịch vụ dọn dẹp của chúng tôi." },
    ],
  }),
  component: ReviewsPage,
});

const reviews = [
  { name: "Chị Ngọc", role: "Khách hàng tại Q.7", rating: 5, text: "Nhân viên đến đúng giờ, làm sạch kỹ, thái độ rất tốt. Sẽ tiếp tục sử dụng." },
  { name: "Anh Minh", role: "Khách hàng tại Q.1", rating: 5, text: "Đặt lịch nhanh, giá rõ ràng, nhà sạch hơn mong đợi. Rất hài lòng!" },
  { name: "Chị Hà", role: "Khách hàng tại Bình Thạnh", rating: 5, text: "Tôi sẽ tiếp tục sử dụng Cleanlink hằng tuần. Rất tiện lợi cho gia đình bận rộn." },
  { name: "Anh Tuấn", role: "Chủ homestay", rating: 5, text: "Đội ngũ chuyên nghiệp, turnover nhanh giữa các lượt khách. Tin cậy tuyệt đối." },
  { name: "Chị Linh", role: "Khách hàng Thủ Đức", rating: 4, text: "Tổng vệ sinh trước Tết cực kỳ ưng ý. Chỉ hơi chậm 15 phút nhưng có báo trước." },
  { name: "Anh Đức", role: "Văn phòng công ty", rating: 5, text: "Hợp đồng vệ sinh văn phòng hằng tuần rất ổn định. Báo cáo minh bạch." },
];

function ReviewsPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Khách hàng nói gì về Cleanlink</h1>
          <div className="mt-5 flex items-center justify-center gap-1">
            {[0,1,2,3,4].map((i) => <Star key={i} className="h-6 w-6 fill-primary text-primary" />)}
            <span className="ml-2 font-semibold">4.9/5 · 2.500+ đánh giá</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-2xl bg-card p-6 border border-border/60 shadow-card">
              <div className="flex items-center gap-1">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
                {Array.from({ length: 5 - r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-muted-foreground/40" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed">"{r.text}"</p>
              <div className="mt-5 pt-4 border-t border-border/60">
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
