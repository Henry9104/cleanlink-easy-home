import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  estimatePrice,
  formatVND,
  areas,
  timeSlots,
  labelFrom,
  roomTypeLabel,
  ROOM_PRICING,
  ROOM_PRICE_ORDER,
  ROOM_EXAMPLE,
  ROOM_COUNT_PRICING,
  ROOM_COUNT_CONTRACT_THRESHOLD,
  HOURLY_PRICING,
  AREA_PRICING,
  SURCHARGES,
  URGENT_FEE,
  type PriceSplit,
  type RoomTypeKey,
} from "@/lib/cleanlink-data";
import { Zap, Info } from "lucide-react";

export const Route = createFileRoute("/gia-du-kien")({
  head: () => ({
    meta: [
      { title: "Giá dự kiến – CleanLink Quy Nhơn" },
      { name: "description", content: "Bảng giá dọn phòng lưu trú, dọn nhà ở theo giờ, theo diện tích và phụ thu của CleanLink tại Quy Nhơn, Gia Lai." },
    ],
  }),
  component: PricingPage,
});

function money(v: number | null, fallback: string) {
  return v === null ? fallback : formatVND(v);
}

type SplitRow = PriceSplit & { label: string };

function SplitTable({
  title,
  description,
  firstColumn,
  rows,
  customerFallback,
}: {
  title: string;
  description?: string;
  firstColumn: string;
  rows: SplitRow[];
  customerFallback: string;
}) {
  return (
    <div className="rounded-3xl bg-card border border-border/60 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/60">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-6 py-3 font-medium">{firstColumn}</th>
              <th className="text-right px-6 py-3 font-medium">Khách trả</th>
              <th className="text-right px-6 py-3 font-medium">Người dọn nhận</th>
              <th className="text-right px-6 py-3 font-medium">CleanLink thu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-6 py-3 font-medium">{r.label}</td>
                <td className="px-6 py-3 text-right text-primary font-medium">{money(r.customer, customerFallback)}</td>
                <td className="px-6 py-3 text-right">{money(r.cleaner, "Theo thỏa thuận")}</td>
                <td className="px-6 py-3 text-right">{money(r.platform, "Theo thỏa thuận")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PricingPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(3);
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [roomType, setRoomType] = useState<RoomTypeKey>("standard");
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("trung_tam");
  const [timeSlot, setTimeSlot] = useState("13-14");

  const price = estimatePrice(rooms, urgency, roomType);

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Giá dự kiến</h1>
          <p className="mt-4 text-muted-foreground">
            Giá tính theo loại phòng và số phòng, phụ thu hiển thị rõ – biết trước khi xác nhận.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-14 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* Bảng 1: Giá dọn phòng lưu trú */}
          <SplitTable
            title="Bảng 1: Giá dọn phòng lưu trú"
            description="Áp dụng cho dọn phòng thông thường, thay ga có sẵn, thu gom rác, lau sàn và vệ sinh nhà tắm."
            firstColumn="Loại phòng"
            rows={ROOM_PRICE_ORDER.map((k) => ROOM_PRICING[k])}
            customerFallback="Báo giá riêng"
          />

          {/* Ví dụ minh họa */}
          <div className="rounded-3xl bg-gradient-soft border border-border/60 p-6">
            <h2 className="font-semibold">Ví dụ minh họa</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between border-b border-border/40 pb-2">
                <span>Tổng tiền khách thanh toán</span>
                <span className="font-semibold">{formatVND(ROOM_EXAMPLE.customerTotal)}</span>
              </li>
              <li className="flex justify-between border-b border-border/40 pb-2">
                <span>Tổng tiền người dọn nhận</span>
                <span className="font-semibold">{formatVND(ROOM_EXAMPLE.cleanerTotal)}</span>
              </li>
              <li className="flex justify-between">
                <span>Doanh thu phí nền tảng CleanLink</span>
                <span className="font-semibold text-primary">{formatVND(ROOM_EXAMPLE.platformTotal)}</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">{ROOM_EXAMPLE.note}</p>
          </div>

          {/* Bảng 2: Giá theo số lượng phòng */}
          <div className="rounded-3xl bg-card border border-border/60 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60">
              <h2 className="font-semibold">Bảng 2: Giá theo số lượng phòng</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Áp dụng cho phòng tiêu chuẩn.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Số phòng</th>
                    <th className="text-right px-6 py-3 font-medium">Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {ROOM_COUNT_PRICING.map((r) => (
                    <tr key={r.rooms}>
                      <td className="px-6 py-3 font-medium">{r.rooms} phòng</td>
                      <td className="px-6 py-3 text-right">{formatVND(r.price)}</td>
                    </tr>
                  ))}
                  <tr className="bg-mint/20">
                    <td className="px-6 py-3 font-medium">Trên {ROOM_COUNT_CONTRACT_THRESHOLD} phòng</td>
                    <td className="px-6 py-3 text-right text-primary font-medium">Liên hệ báo giá hợp đồng</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng 3: Hình thức A */}
          <SplitTable
            title="Bảng 3: Hình thức A – Dọn dẹp nhà ở theo giờ"
            firstColumn="Thời lượng"
            rows={HOURLY_PRICING}
            customerFallback="Theo khảo sát"
          />

          {/* Hình thức B */}
          <SplitTable
            title="Hình thức B: Dọn căn hộ theo diện tích"
            firstColumn="Loại nhà / diện tích"
            rows={AREA_PRICING}
            customerFallback="Theo khảo sát"
          />

          {/* Bảng giá phụ thu đề xuất */}
          <div className="rounded-3xl bg-card border border-border/60 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60">
              <h2 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" /> Bảng giá phụ thu đề xuất
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Phụ thu tính theo đơn, hiển thị trước khi xác nhận.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Trường hợp</th>
                    <th className="text-right px-6 py-3 font-medium">Phụ thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {SURCHARGES.map((s) => (
                    <tr key={s.label}>
                      <td className="px-6 py-3 font-medium">{s.label}</td>
                      <td className="px-6 py-3 text-right text-primary font-medium">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl bg-card border border-border/60 shadow-card p-6 h-fit lg:sticky lg:top-24 space-y-5">
          <div>
            <h3 className="font-semibold">Ước tính cho đơn của bạn</h3>
            <p className="text-xs text-muted-foreground">Nhập thông tin để xem giá trước khi xác nhận.</p>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <Label htmlFor="pname">Cơ sở</Label>
              <Input id="pname" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Tên cơ sở" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="paddr">Địa chỉ</Label>
              <Input id="paddr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Địa chỉ cụ thể" className="mt-1.5" />
            </div>
            <div>
              <Label>Khu vực</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại phòng</Label>
              <RadioGroup
                value={roomType}
                onValueChange={(v) => setRoomType(v as RoomTypeKey)}
                className="mt-1.5 grid gap-2"
              >
                {ROOM_PRICE_ORDER.map((k) => (
                  <label key={k} className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-mint/30">
                    <RadioGroupItem value={k} />
                    <span className="text-xs font-medium">
                      {ROOM_PRICING[k].label} ({money(ROOM_PRICING[k].customer, "Báo giá riêng")})
                    </span>
                  </label>
                ))}
              </RadioGroup>
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
              <Label>Khung giờ</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mức độ</Label>
              <RadioGroup
                value={urgency}
                onValueChange={(v) => setUrgency(v as "normal" | "urgent")}
                className="mt-1.5 grid gap-2"
              >
                {[
                  { v: "normal", l: "Bình thường" },
                  { v: "urgent", l: `Gấp – bắt đầu trong 2 giờ (+${formatVND(URGENT_FEE)}/đơn)` },
                ].map((o) => (
                  <label key={o.v} className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-mint/30">
                    <RadioGroupItem value={o.v} />
                    <span className="text-xs font-medium">{o.l}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Cơ sở</span><span className="truncate max-w-[60%] text-right text-foreground">{propertyName || "—"}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Địa chỉ</span><span className="truncate max-w-[60%] text-right text-foreground">{address || "—"}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Khu vực</span><span className="text-foreground">{labelFrom(areas, area)}</span>
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">Loại phòng</span><span className="text-right">{roomTypeLabel(roomType)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Số phòng</span><span>{rooms} phòng</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Khung giờ</span><span>{labelFrom(timeSlots, timeSlot)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mức độ</span><span>{urgency === "urgent" ? "Gấp" : "Bình thường"}</span></div>
            {price.quote ? (
              <div className="flex justify-between border-t border-border/40 pt-2">
                <span className="font-medium">Tổng dự kiến</span>
                <span className="font-bold text-primary">Báo giá riêng</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between border-t border-border/40 pt-2"><span className="text-muted-foreground">Đơn giá/phòng</span><span>{formatVND(price.perRoom)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(price.subtotal)}</span></div>
                {urgency === "urgent" && (
                  <div className="flex justify-between text-amber-700"><span className="flex items-center gap-1"><Zap className="h-3 w-3" />Phụ thu đặt gấp</span><span>{formatVND(price.urgentFee)}</span></div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-border/40">
                  <span className="font-medium">Tổng dự kiến</span>
                  <span className="text-2xl font-bold text-primary">{formatVND(price.total)}</span>
                </div>
              </>
            )}
            {price.quote && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {roomType === "special"
                  ? "Phòng đặc biệt trên 60m² được báo giá riêng, vui lòng liên hệ CleanLink."
                  : `Trên ${ROOM_COUNT_CONTRACT_THRESHOLD} phòng vui lòng liên hệ để nhận báo giá hợp đồng.`}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Button className="w-full rounded-full" onClick={() => navigate({ to: "/dat-lich" })}>
              Xác nhận đặt lịch
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link to="/dat-lich">Quay lại chỉnh sửa</Link>
            </Button>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
