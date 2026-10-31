import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { ServiceConfigurator } from "@/components/booking/ServiceConfigurator";
import {
  DEFAULT_SELECTION,
  estimateOrder,
  saveSelection,
  type ServiceSelection,
} from "@/lib/pricing";
import {
  formatVND,
  areas,
  labelFrom,
  ROOM_PRICING,
  ROOM_PRICE_ORDER,
  ROOM_EXAMPLE,
  ROOM_COUNT_PRICING,
  ROOM_COUNT_CONTRACT_THRESHOLD,
  HOURLY_PRICING,
  AREA_PRICING,
  SURCHARGES,
  type PriceSplit,
} from "@/lib/cleanlink-data";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/gia-du-kien")({
  head: () => ({
    meta: [
      { title: "Giá dự kiến – CleanLink Quy Nhơn" },
      {
        name: "description",
        content:
          "Bảng giá dọn phòng lưu trú, dọn nhà theo giờ, theo diện tích và phụ thu của CleanLink tại Quy Nhơn, Gia Lai (Người dọn 88% | CleanLink 12%).",
      },
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
              <th className="text-right px-6 py-3 font-medium">Người dọn nhận (88%)</th>
              <th className="text-right px-6 py-3 font-medium">CleanLink thu (12%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-6 py-3 font-medium">{r.label}</td>
                <td className="px-6 py-3 text-right text-primary font-medium">
                  {money(r.customer, customerFallback)}
                </td>
                <td className="px-6 py-3 text-right text-emerald-700 font-medium">
                  {money(r.cleaner, "88% giá cuối")}
                </td>
                <td className="px-6 py-3 text-right">{money(r.platform, "12% giá cuối")}</td>
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
  const [sel, setSel] = useState<ServiceSelection>(DEFAULT_SELECTION);
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("trung_tam");

  const estimate = estimateOrder(sel);

  // Chuyển cấu hình dịch vụ sang form đặt lịch → bước thanh toán QR dùng cùng tổng tiền
  function goBooking() {
    saveSelection(sel, { propertyName, address, area });
    void navigate({ to: "/dat-lich" });
  }

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Giá dự kiến</h1>
          <p className="mt-4 text-muted-foreground">
            Minh bạch từng hạng mục – Người dọn nhận 88%, CleanLink thu 12% phí vận hành nền tảng.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-14 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Bảng 1: Giá dọn phòng lưu trú */}
          <SplitTable
            title="Bảng 1: Giá dọn phòng lưu trú"
            description="Áp dụng cho dọn phòng thông thường, thay ga có sẵn, thu gom rác, lau sàn và vệ sinh nhà tắm (Người dọn 88% | CleanLink 12%)."
            firstColumn="Loại phòng"
            rows={ROOM_PRICE_ORDER.map((k) => ROOM_PRICING[k])}
            customerFallback="Báo giá riêng"
          />

          {/* Ví dụ minh họa */}
          <div className="rounded-3xl bg-gradient-soft border border-border/60 p-6">
            <h2 className="font-semibold">Ví dụ minh họa (5 phòng tiêu chuẩn)</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between border-b border-border/40 pb-2">
                <span>Tổng tiền khách thanh toán</span>
                <span className="font-semibold">{formatVND(ROOM_EXAMPLE.customerTotal)}</span>
              </li>
              <li className="flex justify-between border-b border-border/40 pb-2">
                <span>Tổng tiền người dọn nhận (88%)</span>
                <span className="font-semibold text-emerald-700">
                  {formatVND(ROOM_EXAMPLE.cleanerTotal)}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Doanh thu phí nền tảng CleanLink (12%)</span>
                <span className="font-semibold text-primary">
                  {formatVND(ROOM_EXAMPLE.platformTotal)}
                </span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">{ROOM_EXAMPLE.note}</p>
          </div>

          {/* Bảng 2: Giá theo số lượng phòng tiêu chuẩn */}
          <div className="rounded-3xl bg-card border border-border/60 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60">
              <h2 className="font-semibold">Bảng 2: Giá theo số lượng phòng tiêu chuẩn</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Áp dụng cho phòng tiêu chuẩn dưới 25m² (Người dọn 88% | CleanLink 12%).
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Số phòng</th>
                    <th className="text-right px-6 py-3 font-medium">Khách trả</th>
                    <th className="text-right px-6 py-3 font-medium">Người dọn nhận (88%)</th>
                    <th className="text-right px-6 py-3 font-medium">CleanLink thu (12%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {ROOM_COUNT_PRICING.map((r) => (
                    <tr key={r.rooms}>
                      <td className="px-6 py-3 font-medium">{r.rooms} phòng</td>
                      <td className="px-6 py-3 text-right text-primary font-medium">
                        {formatVND(r.price)}
                      </td>
                      <td className="px-6 py-3 text-right text-emerald-700 font-medium">
                        {formatVND(r.cleaner)}
                      </td>
                      <td className="px-6 py-3 text-right">{formatVND(r.platform)}</td>
                    </tr>
                  ))}
                  <tr className="bg-mint/20">
                    <td className="px-6 py-3 font-medium">
                      Trên {ROOM_COUNT_CONTRACT_THRESHOLD} phòng
                    </td>
                    <td className="px-6 py-3 text-right text-primary font-medium">Báo giá riêng</td>
                    <td className="px-6 py-3 text-right text-emerald-700 font-medium">
                      88% giá cuối
                    </td>
                    <td className="px-6 py-3 text-right">12% giá cuối</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng 3: Dọn nhà theo giờ */}
          <SplitTable
            title="Bảng 3: Dọn nhà theo giờ"
            description="Tính theo số giờ làm việc thực tế từ 2 giờ đến 6 giờ (Người dọn 88% | CleanLink 12%)."
            firstColumn="Thời lượng"
            rows={HOURLY_PRICING}
            customerFallback="Báo giá riêng"
          />

          {/* Bảng 4: Dọn căn hộ theo diện tích */}
          <SplitTable
            title="Bảng 4: Dọn căn hộ theo diện tích"
            description="Tính trọn gói theo loại căn hộ / diện tích nhà ở (Người dọn 88% | CleanLink 12%)."
            firstColumn="Loại nhà / diện tích"
            rows={AREA_PRICING}
            customerFallback="Báo giá riêng"
          />

          {/* Bảng giá phụ thu đề xuất */}
          <div className="rounded-3xl bg-card border border-border/60 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60">
              <h2 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" /> Bảng giá phụ thu đề xuất
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Phụ thu tính theo đơn, hiển thị trước khi xác nhận.
              </p>
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

        <aside className="rounded-3xl bg-card border border-border/60 shadow-card p-6 h-fit space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div>
            <h3 className="font-semibold">Ước tính cho đơn của bạn</h3>
            <p className="text-xs text-muted-foreground">
              Chọn dịch vụ để xem giá và tỷ lệ phân chia 88% / 12% trước khi xác nhận.
            </p>
          </div>

          <ServiceConfigurator value={sel} onChange={setSel} variant="narrow" />

          <div className="space-y-3 text-sm">
            <div>
              <Label htmlFor="pname">Cơ sở</Label>
              <Input
                id="pname"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="Tên cơ sở"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="paddr">Địa chỉ</Label>
              <Input
                id="paddr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Địa chỉ cụ thể"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Khu vực</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Cơ sở</span>
              <span className="truncate max-w-[60%] text-right text-foreground">
                {propertyName || "—"}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Địa chỉ</span>
              <span className="truncate max-w-[60%] text-right text-foreground">
                {address || "—"}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Khu vực</span>
              <span className="text-foreground">{labelFrom(areas, area)}</span>
            </div>
            <PriceBreakdown estimate={estimate} />
          </div>

          <div className="grid gap-2">
            <Button className="w-full rounded-full" disabled={estimate.baseQuote} onClick={goBooking}>
              Xác nhận đặt lịch
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link to="/dat-lich">Đặt lịch từ đầu</Link>
            </Button>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
