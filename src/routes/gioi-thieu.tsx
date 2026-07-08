import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Sparkles, Handshake, Clock, ShieldCheck, HeartHandshake, Eye } from "lucide-react";

export const Route = createFileRoute("/gioi-thieu")({
  head: () => ({
    meta: [
      { title: "Giới thiệu Cleanlink" },
      { name: "description", content: "Cleanlink là nền tảng kết nối khách hàng với cộng tác viên vệ sinh được đào tạo, kiểm tra và giám sát chất lượng." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Sparkles, title: "Sạch sẽ", desc: "Tiêu chuẩn sạch rõ ràng ở mọi lịch hẹn." },
  { icon: Handshake, title: "Trung thực", desc: "Giao tiếp minh bạch với khách hàng và cộng tác viên." },
  { icon: Clock, title: "Đúng giờ", desc: "Tôn trọng thời gian là tôn trọng khách hàng." },
  { icon: ShieldCheck, title: "An toàn", desc: "Xác minh danh tính, bảo hiểm trách nhiệm." },
  { icon: HeartHandshake, title: "Tận tâm", desc: "Chăm sóc cả trước, trong và sau dịch vụ." },
  { icon: Eye, title: "Minh bạch", desc: "Giá cả, quy trình, chất lượng luôn công khai." },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Về Cleanlink</h1>
          <p className="mt-5 text-muted-foreground text-lg">
            Chúng tôi tin rằng ai cũng xứng đáng có một không gian sống sạch sẽ, thoải mái mà không cần đánh đổi thời gian với gia đình.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 md:px-6 py-16">
        <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed space-y-4">
          <p>
            <strong className="text-foreground">Cleanlink</strong> là nền tảng kết nối khách hàng với đội ngũ cộng tác viên vệ sinh được đào tạo,
            kiểm tra và giám sát chất lượng. Chúng tôi xây dựng một quy trình đơn giản để mọi gia đình – dù bận rộn đến đâu –
            đều có thể sở hữu một ngôi nhà thơm sạch chỉ sau vài thao tác.
          </p>
          <p>
            Mỗi cộng tác viên Cleanlink đều được xác minh danh tính, tham gia khóa huấn luyện dịch vụ và được đánh giá liên tục
            dựa trên phản hồi từ khách hàng. Chúng tôi cam kết đồng hành lâu dài với cả người sử dụng dịch vụ lẫn cộng tác viên,
            xây dựng một cộng đồng làm việc tử tế và có trách nhiệm.
          </p>
        </div>

        <h2 className="mt-14 text-2xl md:text-3xl font-bold text-center">Giá trị cốt lõi</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl bg-card p-6 border border-border/60 shadow-card">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky/60 text-sky-foreground">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
