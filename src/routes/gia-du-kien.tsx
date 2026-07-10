import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { estimatePrice, formatVND } from "@/lib/cleanlink-data";
import { Check, Zap } from "lucide-react";

export const Route = createFileRoute("/gia-du-kien")({
  head: () => ({
    meta: [
      { title: "Giá dự kiến – CleanLink Quy Nhơn" },
      { name: "description", content: "Ước tính giá dọn phòng theo số phòng và mức độ gấp cho homestay, mini hotel tại Quy Nhơn." },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  { rooms: 1, label: "1 phòng", features: ["Turnover 1 studio / căn hộ", "45–60 phút", "Kèm checklist & ảnh xác nhận"] },
  { rooms: 3, label: "3 phòng", features: ["Homestay nhỏ", "1 người dọn", "Giảm 5.000đ/phòng"], highlight: true },
  { rooms: 5, label: "5 phòng", features: ["Homestay vừa", "1–2 người dọn", "Giảm 10.000đ/phòng"] },
  { rooms: 8, label: "8+ phòng", features: ["Mini hotel", "Đội 2–4 người", "Điều phối viên riêng"] },
];

function PricingPage() {
  const [rooms, setRooms] = useState(3);
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const price = estimatePrice(rooms, urgency);

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Giá dự kiến</h1>
          <p className="mt-4 text-muted-foreground">
            Tính giá theo số phòng cần dọn – minh bạch, không phụ phí ẩn.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-14 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5 sm:grid-cols-2">
          {tiers.map((t) => {
            const p = estimatePrice(t.rooms, "normal").total;
            return (
              <button
                type="button"
                key={t.rooms}
                onClick={() => setRooms(t.rooms)}
                className={`text-left rounded-2xl p-6 border shadow-card transition-all ${
                  rooms === t.rooms
                    ? "bg-primary text-primary-foreground border-primary"
                    : t.highlight
                    ? "bg-mint/40 border-mint"
                    : "bg-card border-border/60 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium opacity-80">{t.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{formatVND(p)}</p>
                <p className="text-xs opacity-80">/ lần turnover</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${rooms === t.rooms ? "" : "text-primary"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <aside className="rounded-3xl bg-card border border-border/60 shadow-card p-6 h-fit sticky top-24 space-y-5">
          <div>
            <h3 className="font-semibold">Tùy chỉnh</h3>
            <p className="text-xs text-muted-foreground">Điều chỉnh để xem giá cuối cùng.</p>
          </div>
          <div>
            <Label htmlFor="r-slider">Số phòng: {rooms}</Label>
            <input
              id="r-slider"
              type="range"
              min={1}
              max={15}
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value))}
              className="w-full mt-2 accent-primary"
            />
          </div>
          <div>
            <Label>Mức độ gấp</Label>
            <RadioGroup
              value={urgency}
              onValueChange={(v) => setUrgency(v as "normal" | "urgent")}
              className="mt-2 grid gap-2"
            >
              {[
                { v: "normal", l: "Bình thường" },
                { v: "urgent", l: "Gấp (+20%)" },
              ].map((o) => (
                <label key={o.v} className="flex items-center gap-3 rounded-xl border border-border p-2.5 cursor-pointer hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-mint/30">
                  <RadioGroupItem value={o.v} />
                  <span className="text-sm font-medium">{o.l}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="border-t border-border/60 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Đơn giá/phòng</span><span>{formatVND(price.perRoom)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(price.subtotal)}</span></div>
            {urgency === "urgent" && (
              <div className="flex justify-between text-amber-700"><span className="flex items-center gap-1"><Zap className="h-3 w-3" />Phụ phí gấp</span><span>{formatVND(price.total - price.subtotal)}</span></div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-border/40"><span className="font-medium">Tổng</span><span className="text-2xl font-bold text-primary">{formatVND(price.total)}</span></div>
          </div>
          <Button asChild className="w-full rounded-full">
            <Link to="/dat-lich">Đặt đơn ngay</Link>
          </Button>
        </aside>
      </section>
    </SiteLayout>
  );
}
