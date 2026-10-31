import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Clock,
  Wallet,
  UserCheck,
  Camera,
  Loader2,
  Calculator,
  Pencil,
  ExternalLink,
  CheckCircle2,
  Building2,
} from "lucide-react";
import {
  areas,
  timeSlots,
  propertyTypes,
  statusLabel,
  statusColor,
  paymentStatusLabel,
  paymentStatusColor,
  formatVND,
  labelFrom,
  ROOM_PRICING,
  HOURLY_PRICING,
  AREA_PRICING,
  type BookingStatus,
  type PaymentStatus,
} from "@/lib/cleanlink-data";
import {
  addonLabels,
  bookingPrice,
  cleanerPayoutFromBooking,
  estimateOrder,
  parseServiceKey,
  selectionFromBooking,
  serviceSummary,
} from "@/lib/pricing";
import { getPaymentStatus, signedPhotoUrl } from "@/lib/bookings";
import type { AdminBookingRow, AdminUserRow, BookingFormInput } from "@/lib/admin-crud";

const SERVICE_OPTIONS: { value: string; label: string }[] = [
  { value: "standard", label: `Dọn phòng lưu trú – ${ROOM_PRICING.standard.label} (60.000đ/phòng)` },
  { value: "large", label: `Dọn phòng lưu trú – ${ROOM_PRICING.large.label} (80.000đ/phòng)` },
  { value: "family", label: `Dọn phòng lưu trú – ${ROOM_PRICING.family.label} (110.000đ/phòng)` },
  { value: "kitchen", label: `Dọn phòng lưu trú – ${ROOM_PRICING.kitchen.label} (120.000đ/phòng)` },
  ...HOURLY_PRICING.map((h) => ({
    value: `hourly_${h.value}`,
    label: `Dọn nhà theo giờ – ${h.label} (${h.customer ? formatVND(h.customer) : "Báo giá"})`,
  })),
  ...AREA_PRICING.filter((a) => a.customer !== null).map((a) => ({
    value: `area_${a.value}`,
    label: `Dọn căn hộ – ${a.label} (${a.customer ? formatVND(a.customer) : "Báo giá"})`,
  })),
];

const ADMIN_ORDER_STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "Chờ duyệt tiền" },
  { value: "searching", label: "Đang chờ người dọn" },
  { value: "accepted", label: "Thợ đã nhận đơn" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "photo_sent", label: "Đã gửi ảnh xác nhận" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "reviewed", label: "Đã đánh giá" },
  { value: "cancelled", label: "Đã huỷ" },
];

type BookingFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: AdminBookingRow | null;
  users: AdminUserRow[];
  hostNameOf: (hostId: string | null) => string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BookingFormInput) => void;
};

export function BookingFormModal({
  open,
  mode,
  initial,
  users,
  hostNameOf,
  saving,
  onOpenChange,
  onSubmit,
}: BookingFormModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const cleaners = users.filter((u) => u.roles.includes("cleaner"));
  const hosts = users.filter((u) => u.roles.includes("host"));

  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("homestay");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [hostId, setHostId] = useState<string>("");
  const [area, setArea] = useState("trung_tam");
  const [roomType, setRoomType] = useState("standard");
  const [rooms, setRooms] = useState(2);
  const [serviceDate, setServiceDate] = useState(today);
  const [timeSlot, setTimeSlot] = useState("13-14");
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [status, setStatus] = useState<BookingStatus>("searching");
  const [cleanerId, setCleanerId] = useState<string>("");
  const [cleanerName, setCleanerName] = useState<string>("");
  const [price, setPrice] = useState<number>(120000);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setPropertyName(initial.property_name || "");
      setPropertyType(initial.property_type || "homestay");
      setAddress(initial.address || "");
      setPhone(initial.phone || "");
      setCustomerName(initial.customer_name || hostNameOf(initial.host_id) || "");
      setHostId(initial.host_id || "");
      setArea(initial.area || "trung_tam");
      setRoomType(initial.room_type || "standard");
      setRooms(initial.rooms || 1);
      setServiceDate(initial.service_date || today);
      setTimeSlot(initial.time_slot || "13-14");
      setUrgency(initial.urgency === "urgent" ? "urgent" : "normal");
      setPaymentStatus(getPaymentStatus(initial));
      setStatus((initial.status as BookingStatus) || "searching");
      setCleanerId(initial.cleaner_id || "");
      setCleanerName(initial.cleaner_name || "");
      setPrice(initial.price ?? 0);
      setNote(initial.note || "");
    } else {
      setPropertyName("");
      setPropertyType("homestay");
      setAddress("");
      setPhone("");
      setCustomerName("");
      setHostId("");
      setArea("trung_tam");
      setRoomType("standard");
      setRooms(2);
      setServiceDate(today);
      setTimeSlot("13-14");
      setUrgency("normal");
      setPaymentStatus("paid");
      setStatus("searching");
      setCleanerId("");
      setCleanerName("");
      setPrice(120000);
      setNote("");
    }
  }, [open, mode, initial, today, hostNameOf]);

  function recalculateSuggestedPrice(
    nextRoomType = roomType,
    nextRooms = rooms,
    nextUrgency = urgency,
    nextTimeSlot = timeSlot,
  ) {
    const sel = selectionFromBooking({
      room_type: nextRoomType,
      rooms: nextRooms,
      urgency: nextUrgency,
      time_slot: nextTimeSlot,
      addons: initial?.addons ?? [],
    });
    const est = estimateOrder(sel);
    const computed = bookingPrice(est);
    if (computed > 0) setPrice(computed);
  }

  const previewPayout = cleanerPayoutFromBooking({
    room_type: roomType,
    rooms,
    urgency,
    time_slot: timeSlot,
    addons: initial?.addons ?? [],
    price,
  });

  const isLodging = parseServiceKey(roomType).serviceType === "lodging";

  function handleSelectHost(selectedHostId: string) {
    setHostId(selectedHostId);
    const found = hosts.find((h) => h.id === selectedHostId);
    if (found) {
      setCustomerName(found.full_name);
      if (!phone && found.phone) setPhone(found.phone);
      if (!propertyName && found.property_name) setPropertyName(found.property_name);
      if (found.area) setArea(found.area);
    }
  }

  function handleSelectCleaner(selectedCleanerId: string) {
    setCleanerId(selectedCleanerId);
    if (!selectedCleanerId) {
      setCleanerName("");
      return;
    }
    const found = cleaners.find((c) => c.id === selectedCleanerId);
    if (found) {
      setCleanerName(found.full_name);
      if (status === "searching" || status === "pending") {
        setStatus("in_progress");
        setPaymentStatus("paid");
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyName.trim() || !address.trim() || !phone.trim()) return;
    onSubmit({
      property_name: propertyName,
      property_type: propertyType,
      address,
      phone,
      customer_name: customerName,
      host_id: hostId || undefined,
      area,
      rooms: isLodging ? Math.max(1, Number(rooms) || 1) : 1,
      room_type: roomType,
      service_date: serviceDate,
      time_slot: timeSlot,
      urgency,
      payment_status: paymentStatus,
      status,
      cleaner_id: cleanerId || null,
      cleaner_name: cleanerName.trim() || null,
      price: Math.max(0, Number(price) || 0),
      addons: initial?.addons ?? [],
      note,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Tạo đơn dọn phòng mới"
              : `Chỉnh sửa đơn ${initial?.code ?? ""}`}
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin cơ sở, khu vực tại Quy Nhơn – Gia Lai, điều phối người dọn và trạng thái đơn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bf-property">Tên cơ sở lưu trú / Nhà ở *</Label>
              <Input
                id="bf-property"
                required
                placeholder="VD: Mai House Homestay"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-prop-type">Loại hình cơ sở</Label>
              <select
                id="bf-prop-type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                {propertyTypes.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bf-customer">Tên khách hàng / Chủ cơ sở</Label>
              <div className="flex gap-2">
                <Input
                  id="bf-customer"
                  placeholder="VD: Nguyễn Văn Minh"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                {hosts.length > 0 && (
                  <select
                    aria-label="Chọn nhanh chủ cơ sở"
                    value={hostId}
                    onChange={(e) => handleSelectHost(e.target.value)}
                    className="h-9 max-w-[140px] rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">Chọn có sẵn…</option>
                    {hosts.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.full_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-phone">SĐT khách / Chủ cơ sở *</Label>
              <Input
                id="bf-phone"
                required
                placeholder="VD: 0905 111 222"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
            <div className="space-y-1.5">
              <Label htmlFor="bf-address">Địa chỉ cụ thể *</Label>
              <Input
                id="bf-address"
                required
                placeholder="VD: 12 Xuân Diệu, Quy Nhơn, Gia Lai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-area">Khu vực (Quy Nhơn / Gia Lai)</Label>
              <select
                id="bf-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                {areas.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label} (Quy Nhơn, Gia Lai)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
            <div className="space-y-1.5">
              <Label htmlFor="bf-service">Gói dịch vụ / Loại phòng</Label>
              <select
                id="bf-service"
                value={roomType}
                onChange={(e) => {
                  const next = e.target.value;
                  setRoomType(next);
                  recalculateSuggestedPrice(next, rooms, urgency, timeSlot);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-rooms">Số phòng</Label>
              <Input
                id="bf-rooms"
                type="number"
                min={1}
                max={20}
                disabled={!isLodging}
                value={isLodging ? rooms : 1}
                onChange={(e) => {
                  const next = Math.max(1, Number(e.target.value) || 1);
                  setRooms(next);
                  recalculateSuggestedPrice(roomType, next, urgency, timeSlot);
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-date">Ngày làm việc</Label>
              <Input
                id="bf-date"
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-slot">Khung giờ làm việc</Label>
              <select
                id="bf-slot"
                value={timeSlot}
                onChange={(e) => {
                  const next = e.target.value;
                  setTimeSlot(next);
                  recalculateSuggestedPrice(roomType, rooms, urgency, next);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                {timeSlots.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-urgency">Mức độ</Label>
              <select
                id="bf-urgency"
                value={urgency}
                onChange={(e) => {
                  const next = e.target.value === "urgent" ? "urgent" : "normal";
                  setUrgency(next);
                  recalculateSuggestedPrice(roomType, rooms, next, timeSlot);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                <option value="normal">Đặt lịch thông thường</option>
                <option value="urgent">Đặt gấp (+50.000đ)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bf-pay-status">Trạng thái thanh toán</Label>
              <select
                id="bf-pay-status"
                value={paymentStatus}
                onChange={(e) => {
                  const next = e.target.value as PaymentStatus;
                  setPaymentStatus(next);
                  if (next === "pending" && status === "searching") {
                    setStatus("pending");
                  } else if (next === "paid" && status === "pending") {
                    setStatus("searching");
                  }
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                <option value="pending">Chờ duyệt tiền</option>
                <option value="paid">Đã thanh toán</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-order-status">Trạng thái đơn hàng</Label>
              <select
                id="bf-order-status"
                value={status}
                onChange={(e) => {
                  const next = e.target.value as BookingStatus;
                  setStatus(next);
                  if (next !== "pending" && next !== "cancelled") {
                    setPaymentStatus("paid");
                  }
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                {ADMIN_ORDER_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bf-cleaner-select">Chọn người dọn đảm nhận</Label>
              <select
                id="bf-cleaner-select"
                value={cleanerId}
                onChange={(e) => handleSelectCleaner(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                <option value="">-- Chưa gán người dọn --</option>
                {cleaners.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-cleaner-name">Tên người dọn hiển thị</Label>
              <Input
                id="bf-cleaner-name"
                placeholder="Để trống nếu chưa gán hoặc nhập tên thợ…"
                value={cleanerName}
                onChange={(e) => setCleanerName(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-mint/20 p-4 space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <Label htmlFor="bf-price">Tổng giá đơn hàng (VNĐ)</Label>
                <Input
                  id="bf-price"
                  type="number"
                  min={0}
                  step={5000}
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-background font-bold text-primary"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => recalculateSuggestedPrice()}
              >
                <Calculator className="mr-1.5 h-3.5 w-3.5" />
                Tính tự động theo bảng giá
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-border/60">
              <div>
                <span className="text-muted-foreground">Khách thanh toán:</span>
                <p className="font-bold text-foreground">{formatVND(previewPayout.customerTotal)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phí CleanLink thu (12%):</span>
                <p className="font-bold text-primary">{formatVND(previewPayout.platformFee)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Người dọn nhận (88%):</span>
                <p className="font-bold text-emerald-700">{formatVND(previewPayout.cleanerTotal)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bf-note">Ghi chú đơn hàng</Label>
            <Textarea
              id="bf-note"
              rows={2}
              placeholder="Ghi chú về chìa khóa, mã cửa, yêu cầu đặc biệt…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Đang lưu…
                </>
              ) : mode === "create" ? (
                "Tạo đơn mới"
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type BookingDetailModalProps = {
  booking: AdminBookingRow | null;
  hostName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (booking: AdminBookingRow) => void;
  onConfirmPayment: (booking: AdminBookingRow) => void;
};

export function BookingDetailModal({
  booking,
  hostName,
  open,
  onOpenChange,
  onEdit,
  onConfirmPayment,
}: BookingDetailModalProps) {
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !booking) {
      setBeforeUrl(null);
      setAfterUrl(null);
      return;
    }
    let active = true;
    void Promise.all([
      signedPhotoUrl(booking.photo_before),
      signedPhotoUrl(booking.photo_after),
    ]).then(([bUrl, aUrl]) => {
      if (!active) return;
      setBeforeUrl(bUrl);
      setAfterUrl(aUrl);
    });
    return () => {
      active = false;
    };
  }, [open, booking]);

  if (!booking) return null;

  const payStatus = getPaymentStatus(booking);
  const status = booking.status as BookingStatus;
  const payout = cleanerPayoutFromBooking(booking);
  const displayCustomerName = booking.customer_name || hostName || "Chủ cơ sở";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold rounded-lg bg-primary/10 text-primary px-2.5 py-1">
                {booking.code}
              </span>
              <Badge variant="outline" className={paymentStatusColor[payStatus]}>
                {paymentStatusLabel[payStatus]}
              </Badge>
              <Badge variant="outline" className={statusColor[status]}>
                {statusLabel[status] ?? status}
              </Badge>
            </div>
          </div>
          <DialogTitle className="mt-2 text-xl">{booking.property_name}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            {booking.address} · {labelFrom(areas, booking.area)} (Quy Nhơn, Gia Lai)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Thông tin khách hàng & Dịch vụ */}
          <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-border/70 bg-muted/40 p-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Thông tin khách / Chủ cơ sở
              </p>
              <p className="font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {displayCustomerName}
              </p>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" />
                {booking.phone}
              </p>
              <p className="text-xs text-muted-foreground">
                Loại hình: {labelFrom(propertyTypes, booking.property_type)}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Chi tiết lịch dọn
              </p>
              <p className="font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {new Date(booking.service_date).toLocaleDateString("vi-VN")} ·{" "}
                {labelFrom(timeSlots, booking.time_slot)}
                {booking.urgency === "urgent" && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    GẤP
                  </span>
                )}
              </p>
              <p className="text-foreground font-medium">
                {serviceSummary(booking.room_type, booking.rooms)}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                Người dọn:{" "}
                <strong className="text-foreground">
                  {booking.cleaner_name || "Chưa gán người dọn"}
                </strong>
              </p>
            </div>
          </div>

          {/* Phụ thu & ghi chú */}
          {((booking.addons ?? []).length > 0 || booking.note) && (
            <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
              {(booking.addons ?? []).length > 0 && (
                <p>
                  <span className="font-medium">Hạng mục / Phụ thu kèm theo: </span>
                  <span className="text-muted-foreground">
                    {addonLabels(booking.addons ?? []).join(", ")}
                  </span>
                </p>
              )}
              {booking.note && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Ghi chú: </span>
                  {booking.note}
                </p>
              )}
            </div>
          )}

          {/* Chi tiết phân chia tiền */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> Chi tiết phân chia doanh thu đơn hàng
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white p-3 border border-border/60">
                <p className="text-xs text-muted-foreground">Khách thanh toán</p>
                <p className="mt-0.5 text-base font-bold text-foreground">
                  {formatVND(payout.customerTotal)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-border/60">
                <p className="text-xs text-muted-foreground">Phí CleanLink thu (12%)</p>
                <p className="mt-0.5 text-base font-bold text-primary">
                  {formatVND(payout.platformFee)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-emerald-200">
                <p className="text-xs text-emerald-800">Người dọn nhận (88%)</p>
                <p className="mt-0.5 text-base font-bold text-emerald-700">
                  {formatVND(payout.cleanerTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Ảnh xác nhận của thợ */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" /> Ảnh xác nhận của người dọn
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/40">
                <div className="aspect-[16/10] flex items-center justify-center">
                  {beforeUrl ? (
                    <img
                      src={beforeUrl}
                      alt="Ảnh trước khi dọn"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Chưa có ảnh trước khi dọn</span>
                  )}
                </div>
                <p className="px-3 py-1.5 text-xs font-medium bg-card border-t border-border/60">
                  Ảnh trước khi dọn
                </p>
              </div>
              <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/40">
                <div className="aspect-[16/10] flex items-center justify-center">
                  {afterUrl ? (
                    <img
                      src={afterUrl}
                      alt="Ảnh sau khi dọn"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Chưa có ảnh sau khi dọn</span>
                  )}
                </div>
                <p className="px-3 py-1.5 text-xs font-medium bg-card border-t border-border/60">
                  Ảnh sau khi dọn
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 pt-2">
          <Button asChild variant="ghost" size="sm" className="mr-auto">
            <Link to="/don/$id" params={{ id: booking.id }}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Mở trang chi tiết đơn
            </Link>
          </Button>
          {payStatus === "pending" && (
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                onOpenChange(false);
                onConfirmPayment(booking);
              }}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Xác nhận đã thanh toán
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onEdit(booking);
            }}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Chỉnh sửa đơn
          </Button>
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

