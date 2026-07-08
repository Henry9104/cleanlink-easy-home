import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { services, saveBooking } from "@/lib/cleanlink-data";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dat-lich")({
  head: () => ({
    meta: [
      { title: "Đặt lịch dọn dẹp – Cleanlink" },
      { name: "description", content: "Đặt lịch dịch vụ dọn dẹp trong 60 giây. Chọn dịch vụ, ngày giờ và địa chỉ – Cleanlink lo phần còn lại." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ service: (s.service as string) || "" }),
  component: BookingPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên").max(80),
  phone: z.string().trim().regex(/^[0-9+\s.-]{9,15}$/, "Số điện thoại không hợp lệ"),
  address: z.string().trim().min(5, "Vui lòng nhập địa chỉ").max(200),
  service: z.string().min(1, "Chọn dịch vụ"),
  area: z.string().trim().min(1, "Nhập diện tích / số phòng").max(60),
  date: z.string().min(1, "Chọn ngày"),
  time: z.string().min(1, "Chọn giờ"),
  hours: z.string().min(1, "Nhập số giờ"),
  payment: z.string().min(1),
  note: z.string().max(500).optional(),
});

function BookingPage() {
  const { service: preSelected } = Route.useSearch();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<null | { id: string }>(null);
  const [bringTools, setBringTools] = useState(true);
  const [payment, setPayment] = useState("cash");
  const [serviceSlug, setServiceSlug] = useState(preSelected || services[0].slug);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      address: String(fd.get("address") || ""),
      service: serviceSlug,
      area: String(fd.get("area") || ""),
      date: String(fd.get("date") || ""),
      time: String(fd.get("time") || ""),
      hours: String(fd.get("hours") || ""),
      payment,
      note: String(fd.get("note") || ""),
    };
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const item = saveBooking({ ...parsed.data, bringTools, note: parsed.data.note });
    toast.success("Cleanlink đã nhận yêu cầu của bạn");
    setSubmitted({ id: item.id });
  }

  if (submitted) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-2xl px-4 md:px-6 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint/60 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Đặt lịch thành công!</h1>
          <p className="mt-3 text-muted-foreground">
            Cleanlink đã nhận yêu cầu của bạn. Chúng tôi sẽ xác nhận lịch trong thời gian sớm nhất.
          </p>
          <div className="mt-6 inline-block rounded-lg bg-muted px-4 py-2 text-sm">
            Mã đơn: <span className="font-mono font-semibold">{submitted.id}</span>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => navigate({ to: "/" })} variant="outline" className="rounded-full">Về trang chủ</Button>
            <Button onClick={() => setSubmitted(null)} className="rounded-full">Đặt lịch khác</Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-14 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Đặt lịch dọn dẹp</h1>
          <p className="mt-3 text-muted-foreground">Chỉ mất 60 giây. Cleanlink sẽ liên hệ xác nhận ngay khi nhận được yêu cầu.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 md:px-6 py-12">
        <form onSubmit={onSubmit} className="rounded-3xl bg-card border border-border/60 shadow-card p-6 md:p-10 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Họ và tên *</Label>
              <Input id="name" name="name" required placeholder="Nguyễn Văn A" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input id="phone" name="phone" required placeholder="0912 345 678" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Địa chỉ dọn dẹp *</Label>
            <Input id="address" name="address" required placeholder="Số nhà, đường, quận, TP" className="mt-1.5" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Loại dịch vụ *</Label>
              <Select value={serviceSlug} onValueChange={setServiceSlug}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="area">Diện tích / số phòng *</Label>
              <Input id="area" name="area" required placeholder="VD: 80m² hoặc 2 phòng ngủ" className="mt-1.5" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="date">Ngày mong muốn *</Label>
              <Input id="date" name="date" type="date" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="time">Giờ mong muốn *</Label>
              <Input id="time" name="time" type="time" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="hours">Số giờ cần dọn *</Label>
              <Input id="hours" name="hours" type="number" min={1} max={12} defaultValue={3} required className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="note">Ghi chú đặc biệt</Label>
            <Textarea id="note" name="note" rows={3} placeholder="Chỗ đậu xe, thú cưng, khu vực cần tập trung..." className="mt-1.5" />
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
            <Checkbox id="tools" checked={bringTools} onCheckedChange={(v) => setBringTools(Boolean(v))} />
            <div>
              <Label htmlFor="tools" className="cursor-pointer">Cộng tác viên mang theo dụng cụ và hóa chất</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Bỏ chọn nếu bạn muốn dùng dụng cụ của gia đình.</p>
            </div>
          </div>

          <div>
            <Label>Phương thức thanh toán *</Label>
            <RadioGroup value={payment} onValueChange={setPayment} className="mt-2 grid gap-2 md:grid-cols-3">
              {[
                { v: "cash", l: "Tiền mặt" },
                { v: "transfer", l: "Chuyển khoản" },
                { v: "ewallet", l: "Ví điện tử" },
              ].map((o) => (
                <label key={o.v} className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-mint/30">
                  <RadioGroupItem value={o.v} />
                  <span className="text-sm font-medium">{o.l}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Button type="submit" size="lg" className="w-full rounded-full">Xác nhận đặt lịch</Button>
          <p className="text-xs text-muted-foreground text-center">
            Bằng cách đặt lịch, bạn đồng ý với điều khoản dịch vụ của Cleanlink.
          </p>
        </form>
      </section>
    </SiteLayout>
  );
}
