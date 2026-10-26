import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageCircle, Facebook } from "lucide-react";
import { toast } from "sonner";
import { CONTACT } from "@/lib/contact-info";

export const Route = createFileRoute("/lien-he")({
  head: () => ({
    meta: [
      { title: "Liên hệ CleanLink Quy Nhơn" },
      { name: "description", content: "Hotline, email, Zalo và fanpage của CleanLink tại Quy Nhơn, Gia Lai." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Cảm ơn bạn! CleanLink sẽ phản hồi sớm nhất.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Liên hệ với chúng tôi</h1>
          <p className="mt-4 text-muted-foreground">CleanLink Quy Nhơn – hỗ trợ 7 ngày/tuần cho chủ cơ sở lưu trú.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-16 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: Phone, label: "Hotline", value: CONTACT.hotline, href: CONTACT.hotlineHref },
            { icon: Mail, label: "Email", value: "cleanlink.quynhon@gmail.com", href: "mailto:cleanlink.quynhon@gmail.com" },
            { icon: MapPin, label: "Khu vực hoạt động", value: CONTACT.area, href: undefined },
            { icon: MessageCircle, label: "Zalo", value: CONTACT.zaloDisplay, href: CONTACT.zaloUrl },
            { icon: Facebook, label: "Fanpage", value: CONTACT.fanpageDisplay, href: CONTACT.fanpageUrl },
          ].map((c) => (
            <div key={c.label} className="flex items-start gap-4 rounded-2xl bg-card p-5 border border-border/60 shadow-card">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint/50 text-mint-foreground shrink-0">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                {c.href ? (
                  <a
                    href={c.href}
                    {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="font-semibold hover:text-primary"
                  >
                    {c.value}
                  </a>
                ) : (
                  <p className="font-semibold">{c.value}</p>
                )}
              </div>
            </div>
          ))}

          <div className="rounded-2xl overflow-hidden border border-border/60 shadow-card aspect-video">
            <iframe
              title="CleanLink Quy Nhơn"
              src="https://www.google.com/maps?q=Quy+Nhon,+Binh+Dinh&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl bg-card border border-border/60 shadow-card p-6 md:p-8 space-y-5 h-fit">
          <h2 className="text-2xl font-bold">Gửi tin nhắn nhanh</h2>
          <div>
            <Label htmlFor="c-name">Tên cơ sở / Họ tên *</Label>
            <Input id="c-name" name="name" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="c-phone">SĐT / Zalo *</Label>
            <Input id="c-phone" name="phone" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="c-msg">Nội dung</Label>
            <Textarea id="c-msg" name="message" rows={4} className="mt-1.5" />
          </div>
          <Button type="submit" size="lg" className="w-full rounded-full">Gửi liên hệ</Button>
        </form>
      </section>
    </SiteLayout>
  );
}
