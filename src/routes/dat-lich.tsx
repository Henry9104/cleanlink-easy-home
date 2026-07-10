import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import {
  propertyTypes,
  areas,
  timeSlots,
  addonOptions,
  estimatePrice,
  formatVND,
} from "@/lib/cleanlink-data";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, Info } from "lucide-react";

export const Route = createFileRoute("/dat-lich")({
  head: () => ({
    meta: [
      { title: "Đặt người dọn – CleanLink Quy Nhơn" },
      { name: "description", content: "Đặt người dọn cho homestay, mini hotel và căn hộ thuê ngắn hạn tại Quy Nhơn trong 60 giây." },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<{ id: string; total: number } | null>(null);

  const [propertyType, setPropertyType] = useState("homestay");
  const [area, setArea] = useState("trung_tam");
  const [timeSlot, setTimeSlot] = useState("13-14");
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [rooms, setRooms] = useState(3);
  const [addons, setAddons] = useState<string[]>(["toilet", "rac", "ga"]);

  const price = useMemo(() => estimatePrice(rooms, urgency), [rooms, urgency]);

  function toggleAddon(v: string) {
    setAddons((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const propertyName = String(fd.get("propertyName") || "").trim();
    const address = String(fd.get("address") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    if (!propertyName || !address || !phone) {
      toast.error("Vui lòng điền đủ tên cơ sở, địa chỉ và số điện thoại");
      return;
    }
    const id = `CL${Date.now().toString().slice(-6)}`;
    toast.success("Đã tạo đơn – đang tìm người dọn phù hợp");
    setSubmitted({ id, total: price.total });
  }

  if (submitted) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-2xl px-4 md:px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint/60 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Đơn đã được tạo</h1>
          <p className="mt-3 text-muted-foreground">
            CleanLink đang tìm người dọn gần nhất. Bạn có thể theo dõi tiến trình ngay bên dưới.
          </p>
          <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5 shadow-card text-left">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Mã đơn</span><span className="font-mono font-semibold">{submitted.id}</span></div>
            <div className="flex justify-between text-sm mt-2"><span className="text-muted-foreground">Tổng dự kiến</span><span className="font-semibold text-primary">{formatVND(submitted.total)}</span></div>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => navigate({ to: "/theo-doi-don" })} className="rounded-full">Theo dõi đơn</Button>
            <Button variant="outline" onClick={() => setSubmitted(null)} className="rounded-full">Đặt đơn khác</Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-14 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Đặt người dọn cho cơ sở lưu trú</h1>
          <p className="mt-3 text-muted-foreground">
            Dành riêng cho chủ homestay, mini hotel và căn hộ thuê ngắn hạn tại Quy Nhơn.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 md:px-6 py-12 grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={onSubmit} className="rounded-3xl bg-card border border-border/60 shadow-card p-6 md:p-10 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="propertyName">Tên cơ sở lưu trú *</Label>
              <Input id="propertyName" name="propertyName" required placeholder="VD: Mai House Homestay" className="mt-1.5" />
            </div>
            <div>
              <Label>Loại cơ sở *</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Khu vực *</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại / Zalo *</Label>
              <Input id="phone" name="phone" required placeholder="09xx xxx xxx" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Địa chỉ cụ thể *</Label>
            <Input id="address" name="address" required placeholder="Số nhà, đường, phường, Quy Nhơn" className="mt-1.5" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="rooms">Số phòng cần dọn *</Label>
              <Input
                id="rooms"
                type="number"
                min={1}
                max={30}
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value) || 1)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Khung giờ cần dọn *</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Mức độ gấp *</Label>
            <RadioGroup
              value={urgency}
              onValueChange={(v) => setUrgency(v as "normal" | "urgent")}
              className="mt-2 grid gap-2 md:grid-cols-2"
            >
              {[
                { v: "normal", l: "Bình thường", d: "Đặt trước ít nhất 3 giờ" },
                { v: "urgent", l: "Gấp (+20%)", d: "Ưu tiên điều phối trong 30–60 phút" },
              ].map((o) => (
                <label
                  key={o.v}
                  className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-mint/30"
                >
                  <RadioGroupItem value={o.v} className="mt-1" />
                  <div>
                    <span className="text-sm font-medium block">{o.l}</span>
                    <span className="text-xs text-muted-foreground">{o.d}</span>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Yêu cầu thêm</Label>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {addonOptions.map((a) => (
                <label
                  key={a.value}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50"
                >
                  <Checkbox
                    checked={addons.includes(a.value)}
                    onCheckedChange={() => toggleAddon(a.value)}
                  />
                  <span className="text-sm font-medium">{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="note">Ghi chú cho người dọn</Label>
            <Textarea id="note" name="note" rows={3} placeholder="Mã cửa, chỗ để chìa khóa, khu vực cần chú ý…" className="mt-1.5" />
          </div>

          <Button type="submit" size="lg" className="w-full rounded-full">
            Xác nhận đơn · {formatVND(price.total)} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </form>

        <aside className="rounded-3xl bg-card border border-border/60 shadow-card p-6 h-fit space-y-4 sticky top-24">
          <h3 className="font-semibold">Giá dự kiến</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Số phòng</span>
              <span className="font-medium">{rooms} phòng</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Đơn giá / phòng</span>
              <span className="font-medium">{formatVND(price.perRoom)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-medium">{formatVND(price.subtotal)}</span>
            </div>
            {urgency === "urgent" && (
              <div className="flex justify-between text-amber-700">
                <span>Phụ phí gấp (+20%)</span>
                <span className="font-medium">{formatVND(price.total - price.subtotal)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-border/60 pt-3 flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Tổng</span>
            <span className="text-2xl font-bold text-primary">{formatVND(price.total)}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-mint/30 rounded-lg p-3">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            Giá chính thức có thể chênh lệch ±10% tùy khối lượng thực tế. Xem chi tiết tại{" "}
            <Link to="/gia-du-kien" className="underline">Giá dự kiến</Link>.
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
