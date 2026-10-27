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
import { Checkbox } from "@/components/ui/checkbox";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { ServiceConfigurator } from "@/components/booking/ServiceConfigurator";
import { propertyTypes, areas, addonOptions, formatVND } from "@/lib/cleanlink-data";
import { CONTACT } from "@/lib/contact-info";
import {
  DEFAULT_SELECTION,
  bookingPrice,
  estimateOrder,
  serviceKeyOf,
  takeSelection,
  type ServiceSelection,
} from "@/lib/pricing";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { newBookingCode, saveBookingDraft } from "@/lib/bookings";

export const Route = createFileRoute("/dat-lich")({
  head: () => ({
    meta: [
      { title: "Đặt người dọn – CleanLink Quy Nhơn" },
      { name: "description", content: "Đặt người dọn phòng lưu trú, dọn nhà ở theo giờ hoặc theo diện tích tại Quy Nhơn – biết giá trước khi xác nhận." },
    ],
  }),
  component: BookingPage,
});

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function BookingPage() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();

  const [propertyType, setPropertyType] = useState("homestay");
  const [area, setArea] = useState("trung_tam");
  const [sel, setSel] = useState<ServiceSelection>(DEFAULT_SELECTION);
  const [addons, setAddons] = useState<string[]>(["toilet", "rac", "ga"]);

  // Nhận cấu hình dịch vụ đã chọn ở trang "Giá dự kiến" (nếu có)
  useEffect(() => {
    const fromEstimate = takeSelection();
    if (fromEstimate) setSel(fromEstimate);
  }, []);

  const estimate = useMemo(() => estimateOrder(sel), [sel]);

  function toggleAddon(v: string) {
    setAddons((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const propertyName = String(fd.get("propertyName") || "").trim();
    const address = String(fd.get("address") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const date = String(fd.get("date") || todayISO());
    const note = String(fd.get("note") || "").trim();
    if (!propertyName || !address || !phone) {
      toast.error("Vui lòng điền đủ tên cơ sở, địa chỉ và số điện thoại");
      return;
    }
    if (estimate.baseQuote) {
      toast.error(`Dịch vụ này cần báo giá riêng, vui lòng liên hệ hotline ${CONTACT.hotline}`);
      return;
    }
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập bằng tài khoản chủ cơ sở để tạo đơn");
      void navigate({ to: "/dang-nhap", search: { next: "/dat-lich" } });
      return;
    }

    saveBookingDraft({
      code: newBookingCode(),
      property_name: propertyName || profile?.property_name || "",
      property_type: propertyType,
      area,
      address,
      phone,
      rooms: sel.serviceType === "lodging" ? sel.rooms : 1,
      room_type: serviceKeyOf(sel),
      service_date: date,
      time_slot: sel.timeSlot,
      urgency: sel.urgency,
      // Yêu cầu thêm (miễn phí) + dịch vụ bổ sung có phụ thu
      addons: [...addons, ...sel.extras],
      note: note || null,
      price: bookingPrice(estimate),
    });
    void navigate({ to: "/thanh-toan" });
  }

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-14 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Đặt người dọn</h1>
          <p className="mt-3 text-muted-foreground">
            Dọn phòng lưu trú, dọn nhà ở theo giờ hoặc theo diện tích tại Quy Nhơn, Gia Lai.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-12 grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={onSubmit} className="rounded-3xl bg-card border border-border/60 shadow-card p-6 md:p-10 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="propertyName">Tên cơ sở / nhà ở *</Label>
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

          <div className="max-w-xs">
            <Label htmlFor="date">Ngày cần dọn *</Label>
            <Input id="date" name="date" type="date" required defaultValue={todayISO()} className="mt-1.5" />
          </div>

          <div className="border-t border-border/60 pt-6">
            <ServiceConfigurator value={sel} onChange={setSel} variant="wide" />
          </div>

          <div>
            <Label>Yêu cầu thêm (miễn phí)</Label>
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
            <Textarea id="note" name="note" rows={3} placeholder="Mã cửa, chỗ để chìa khoá, khu vực cần chú ý…" className="mt-1.5" />
          </div>

          <Button type="submit" size="lg" className="w-full rounded-full" disabled={estimate.baseQuote}>
            {estimate.baseQuote
              ? "Liên hệ để nhận báo giá"
              : `Tiếp tục thanh toán · ${formatVND(estimate.total)}`}{" "}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </form>

        <aside className="rounded-3xl bg-card border border-border/60 shadow-card p-6 h-fit space-y-4 lg:sticky lg:top-24">
          <h3 className="font-semibold">Giá dự kiến</h3>
          <PriceBreakdown estimate={estimate} />
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-mint/30 rounded-lg p-3">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            <span>
              Giá được hiển thị trước khi bạn xác nhận đơn.{" "}
              <Link to="/gia-du-kien" className="underline">Xem bảng giá chi tiết</Link>.
            </span>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
