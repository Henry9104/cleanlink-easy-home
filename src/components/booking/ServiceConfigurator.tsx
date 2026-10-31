import { Checkbox } from "@/components/ui/checkbox";
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
import {
  AFTER_HOURS_FEE,
  AREA_PRICING,
  EXTRA_OPTIONS,
  HOURLY_PRICING,
  ROOM_COUNT_CONTRACT_THRESHOLD,
  ROOM_COUNT_PRICING,
  ROOM_PRICE_ORDER,
  ROOM_PRICING,
  URGENT_FEE,
  formatVND,
  serviceTypes,
  timeSlots,
  type PriceSplit,
  type RoomTypeKey,
  type ServiceType,
} from "@/lib/cleanlink-data";
import { MAX_ROOMS, isAfter20, type ServiceSelection } from "@/lib/pricing";

const OPTION_CLASS =
  "flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer transition-colors hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-mint/30";

function money(v: number | null, fallback: string) {
  return v === null ? fallback : formatVND(v);
}

function splitHint(split: PriceSplit) {
  if (split.cleaner === null || split.platform === null) {
    return "Người dọn: 88% giá cuối | CleanLink: 12% giá cuối";
  }
  return `Người dọn: ${formatVND(split.cleaner)} | CleanLink: ${formatVND(split.platform)}`;
}

function Choice({
  value,
  title,
  price,
  hint,
}: {
  value: string;
  title: string;
  price?: string;
  hint?: string;
}) {
  return (
    <label className={OPTION_CLASS}>
      <RadioGroupItem value={value} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {hint && <span className="block text-xs text-muted-foreground mt-0.5">{hint}</span>}
      </div>
      {price && <span className="shrink-0 text-xs font-semibold text-primary">{price}</span>}
    </label>
  );
}

/**
 * Bộ chọn dịch vụ dùng chung cho trang "Giá dự kiến" (Ước tính cho đơn của bạn) và form đặt lịch:
 * loại hình dịch vụ (Tabs) → tuỳ chọn theo gói → mức độ đặt lịch → khung giờ → dịch vụ bổ sung.
 */
export function ServiceConfigurator({
  value,
  onChange,
  variant = "wide",
}: {
  value: ServiceSelection;
  onChange: (next: ServiceSelection) => void;
  /** wide: form đặt lịch (nhiều cột) · narrow: cột bên "Ước tính cho đơn của bạn" (1 cột) */
  variant?: "wide" | "narrow";
}) {
  const wide = variant === "wide";
  const set = (patch: Partial<ServiceSelection>) => onChange({ ...value, ...patch });

  const gridTwo = wide ? "grid gap-2 md:grid-cols-2" : "grid gap-2";
  const gridThree = wide ? "grid grid-cols-2 gap-2 md:grid-cols-3" : "grid grid-cols-2 gap-2";

  const standardRoomTier =
    value.roomType === "standard"
      ? ROOM_COUNT_PRICING.find((r) => r.rooms === value.rooms)
      : undefined;

  function toggleExtra(key: string) {
    set({
      extras: value.extras.includes(key)
        ? value.extras.filter((e) => e !== key)
        : [...value.extras, key],
    });
  }

  function handleRoomsInput(raw: string) {
    const num = Number(raw);
    if (!Number.isFinite(num)) return;
    const clamped = Math.min(Math.max(1, Math.round(num)), MAX_ROOMS);
    set({ rooms: clamped });
  }

  return (
    <div className="space-y-6">
      {/* 1. Bộ chọn phân loại dịch vụ (Tabs) */}
      <div>
        <Label>Phân loại dịch vụ *</Label>
        <div
          role="tablist"
          aria-label="Phân loại dịch vụ"
          className={`mt-2 grid gap-2 rounded-2xl bg-muted/60 p-1.5 ${
            wide ? "sm:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {serviceTypes.map((t) => {
            const active = value.serviceType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => set({ serviceType: t.value as ServiceType })}
                className={`rounded-xl px-3 py-2.5 text-left transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-transparent text-foreground hover:bg-background/70"
                }`}
              >
                <span className="block text-sm font-semibold">{t.label}</span>
                <span
                  className={`block text-[11px] ${
                    active ? "text-primary-foreground/85" : "text-muted-foreground"
                  }`}
                >
                  {t.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2a. Gói 1 – Dọn phòng lưu trú */}
      {value.serviceType === "lodging" && (
        <>
          <div>
            <Label>Loại phòng *</Label>
            <RadioGroup
              value={value.roomType}
              onValueChange={(v) => set({ roomType: v as RoomTypeKey })}
              className={`mt-2 ${gridTwo}`}
            >
              {ROOM_PRICE_ORDER.map((k) => {
                const info = ROOM_PRICING[k];
                return (
                  <Choice
                    key={k}
                    value={k}
                    title={info.label}
                    hint={splitHint(info)}
                    price={
                      info.customer === null
                        ? "Báo giá riêng"
                        : `${formatVND(info.customer)}/phòng`
                    }
                  />
                );
              })}
            </RadioGroup>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="svc-rooms">
                Số phòng cần dọn:{" "}
                <span className="font-bold text-primary">
                  {value.rooms > ROOM_COUNT_CONTRACT_THRESHOLD
                    ? `${value.rooms} phòng (Liên hệ báo giá)`
                    : `${value.rooms} phòng`}
                </span>
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  id="svc-rooms-input"
                  type="number"
                  min={1}
                  max={MAX_ROOMS}
                  value={value.rooms}
                  onChange={(e) => handleRoomsInput(e.target.value)}
                  className="h-8 w-16 text-center text-sm font-semibold"
                  aria-label="Nhập số phòng cần dọn"
                />
                <span className="text-xs text-muted-foreground">phòng</span>
              </div>
            </div>
            <input
              id="svc-rooms"
              type="range"
              min={1}
              max={MAX_ROOMS}
              value={value.rooms}
              onChange={(e) => set({ rooms: Number(e.target.value) })}
              className="mt-2 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>1 phòng</span>
              <span>5 phòng</span>
              <span>10 phòng</span>
              <span>&gt; 10 phòng (Báo giá)</span>
            </div>
            <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {value.rooms > ROOM_COUNT_CONTRACT_THRESHOLD ? (
                <span className="font-medium text-amber-800">
                  Trên {ROOM_COUNT_CONTRACT_THRESHOLD} phòng: Liên hệ báo giá (Người dọn nhận 88% giá
                  cuối | CleanLink thu 12% giá cuối).
                </span>
              ) : standardRoomTier !== undefined ? (
                <span>
                  <strong>{value.rooms} phòng tiêu chuẩn:</strong>{" "}
                  <span className="font-semibold text-primary">
                    {formatVND(standardRoomTier.price)}
                  </span>{" "}
                  (Người dọn: {formatVND(standardRoomTier.cleaner)} | CleanLink:{" "}
                  {formatVND(standardRoomTier.platform)})
                </span>
              ) : value.roomType === "special" ? (
                <span className="font-medium text-amber-800">
                  Phòng đặc biệt trên 60m²: Báo giá riêng (Người dọn: 88% giá cuối | CleanLink: 12%
                  giá cuối).
                </span>
              ) : (
                <span>
                  <strong>
                    {value.rooms} × {ROOM_PRICING[value.roomType].label}:
                  </strong>{" "}
                  <span className="font-semibold text-primary">
                    {formatVND((ROOM_PRICING[value.roomType].customer ?? 0) * value.rooms)}
                  </span>{" "}
                  (Người dọn:{" "}
                  {formatVND((ROOM_PRICING[value.roomType].cleaner ?? 0) * value.rooms)} |
                  CleanLink: {formatVND((ROOM_PRICING[value.roomType].platform ?? 0) * value.rooms)})
                </span>
              )}
            </p>
          </div>
        </>
      )}

      {/* 2b. Gói 2 – Dọn nhà theo giờ */}
      {value.serviceType === "hourly" && (
        <div>
          <Label>Chọn số giờ dọn (2h – 6h) *</Label>
          <RadioGroup
            value={value.hourlyKey}
            onValueChange={(v) => set({ hourlyKey: v })}
            className={`mt-2 ${gridThree}`}
          >
            {HOURLY_PRICING.map((o) => (
              <Choice
                key={o.value}
                value={o.value}
                title={o.label}
                hint={splitHint(o)}
                price={formatVND(o.customer ?? 0)}
              />
            ))}
          </RadioGroup>
        </div>
      )}

      {/* 2c. Gói 3 – Dọn căn hộ theo diện tích */}
      {value.serviceType === "area" && (
        <div>
          <Label>Chọn loại nhà / căn hộ *</Label>
          <RadioGroup
            value={value.areaKey}
            onValueChange={(v) => set({ areaKey: v })}
            className={`mt-2 ${gridTwo}`}
          >
            {AREA_PRICING.map((o) => (
              <Choice
                key={o.value}
                value={o.value}
                title={o.label}
                hint={splitHint(o)}
                price={money(o.customer, "Báo giá riêng")}
              />
            ))}
          </RadioGroup>
        </div>
      )}

      {/* 3a. Mức độ đặt lịch */}
      <div>
        <Label>Mức độ *</Label>
        <RadioGroup
          value={value.urgency}
          onValueChange={(v) => set({ urgency: v as "normal" | "urgent" })}
          className={`mt-2 ${gridTwo}`}
        >
          <Choice value="normal" title="Bình thường" price="0đ" hint="Đặt lịch thông thường" />
          <Choice
            value="urgent"
            title="Gấp – bắt đầu trong 2 giờ"
            price={`(+${formatVND(URGENT_FEE)}/đơn)`}
            hint="Ưu tiên điều phối người dọn ngay"
          />
        </RadioGroup>
      </div>

      {/* 3b. Khung giờ làm việc */}
      <div>
        <Label>Khung giờ làm việc *</Label>
        <Select value={value.timeSlot} onValueChange={(v) => set({ timeSlot: v })}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
                {isAfter20(t.value) ? ` (sau 20 giờ +${formatVND(AFTER_HOURS_FEE)})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAfter20(value.timeSlot) && (
          <p className="mt-1 text-xs text-amber-700">
            Dọn sau 20 giờ: tự động cộng phụ thu +{formatVND(AFTER_HOURS_FEE)}/đơn.
          </p>
        )}
      </div>

      {/* 3c. Dịch vụ bổ sung */}
      <div>
        <Label>Dịch vụ bổ sung</Label>
        <div className={`mt-2 ${gridTwo}`}>
          {EXTRA_OPTIONS.map((o) => (
            <label key={o.value} className={OPTION_CLASS}>
              <Checkbox
                className="mt-0.5"
                checked={value.extras.includes(o.value)}
                onCheckedChange={() => toggleExtra(o.value)}
              />
              <span className="min-w-0 flex-1 text-sm font-medium">{o.label}</span>
              <span className="shrink-0 text-xs font-semibold text-primary text-right max-w-[45%]">
                {o.note}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
