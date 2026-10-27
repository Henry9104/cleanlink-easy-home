import { Checkbox } from "@/components/ui/checkbox";
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
  type RoomTypeKey,
  type ServiceType,
} from "@/lib/cleanlink-data";
import { MAX_ROOMS, isAfter20, type ServiceSelection } from "@/lib/pricing";

const OPTION_CLASS =
  "flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-mint/30";

function money(v: number | null, fallback: string) {
  return v === null ? fallback : formatVND(v);
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
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </div>
      {price && <span className="shrink-0 text-xs font-semibold text-primary">{price}</span>}
    </label>
  );
}

/**
 * Bộ chọn dịch vụ dùng chung cho trang "Giá dự kiến" và form đặt lịch:
 * loại hình dịch vụ → tuỳ chọn theo gói → mức độ đặt lịch → khung giờ → dịch vụ bổ sung.
 */
export function ServiceConfigurator({
  value,
  onChange,
  variant = "wide",
}: {
  value: ServiceSelection;
  onChange: (next: ServiceSelection) => void;
  /** wide: form đặt lịch (nhiều cột) · narrow: cột bên (1 cột) */
  variant?: "wide" | "narrow";
}) {
  const wide = variant === "wide";
  const set = (patch: Partial<ServiceSelection>) => onChange({ ...value, ...patch });

  const gridTwo = wide ? "grid gap-2 md:grid-cols-2" : "grid gap-2";
  const gridThree = wide ? "grid grid-cols-2 gap-2 md:grid-cols-3" : "grid grid-cols-2 gap-2";

  const standardRoomsPrice =
    value.roomType === "standard"
      ? ROOM_COUNT_PRICING.find((r) => r.rooms === value.rooms)?.price
      : undefined;

  function toggleExtra(key: string) {
    set({
      extras: value.extras.includes(key)
        ? value.extras.filter((e) => e !== key)
        : [...value.extras, key],
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Loại hình dịch vụ */}
      <div>
        <Label>Loại hình dịch vụ *</Label>
        <RadioGroup
          value={value.serviceType}
          onValueChange={(v) => set({ serviceType: v as ServiceType })}
          className={`mt-2 grid gap-2 ${wide ? "sm:grid-cols-3" : ""}`}
        >
          {serviceTypes.map((t) => (
            <Choice key={t.value} value={t.value} title={t.label} hint={t.hint} />
          ))}
        </RadioGroup>
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
              {ROOM_PRICE_ORDER.map((k) => (
                <Choice
                  key={k}
                  value={k}
                  title={ROOM_PRICING[k].label}
                  price={
                    ROOM_PRICING[k].customer === null
                      ? "Liên hệ"
                      : `${formatVND(ROOM_PRICING[k].customer ?? 0)}/phòng`
                  }
                />
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="svc-rooms">Số phòng cần dọn: {value.rooms}</Label>
            <input
              id="svc-rooms"
              type="range"
              min={1}
              max={MAX_ROOMS}
              value={value.rooms}
              onChange={(e) => set({ rooms: Number(e.target.value) })}
              className="mt-2 w-full accent-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {value.rooms > ROOM_COUNT_CONTRACT_THRESHOLD
                ? `Trên ${ROOM_COUNT_CONTRACT_THRESHOLD} phòng: liên hệ báo giá hợp đồng.`
                : standardRoomsPrice !== undefined
                  ? `Bảng giá theo số lượng phòng: ${value.rooms} phòng = ${formatVND(standardRoomsPrice)}.`
                  : value.roomType === "special"
                    ? "Phòng đặc biệt trên 60m² được báo giá riêng."
                    : "Giá = đơn giá loại phòng × số phòng."}
            </p>
          </div>
        </>
      )}

      {/* 2b. Gói 2 – Dọn nhà ở theo giờ (Hình thức A) */}
      {value.serviceType === "hourly" && (
        <div>
          <Label>Số giờ dọn *</Label>
          <RadioGroup
            value={value.hourlyKey}
            onValueChange={(v) => set({ hourlyKey: v })}
            className={`mt-2 ${gridThree}`}
          >
            {HOURLY_PRICING.map((o) => (
              <Choice key={o.value} value={o.value} title={o.label} price={formatVND(o.customer ?? 0)} />
            ))}
          </RadioGroup>
        </div>
      )}

      {/* 2c. Gói 3 – Dọn căn hộ theo diện tích (Hình thức B) */}
      {value.serviceType === "area" && (
        <div>
          <Label>Loại nhà / căn hộ *</Label>
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
                price={money(o.customer, "Theo khảo sát")}
              />
            ))}
          </RadioGroup>
        </div>
      )}

      {/* 3a. Mức độ đặt lịch */}
      <div>
        <Label>Mức độ đặt lịch *</Label>
        <RadioGroup
          value={value.urgency}
          onValueChange={(v) => set({ urgency: v as "normal" | "urgent" })}
          className={`mt-2 ${gridTwo}`}
        >
          <Choice value="normal" title="Bình thường" price="Miễn phí" hint="Đặt lịch thông thường" />
          <Choice
            value="urgent"
            title="Gấp – bắt đầu trong 2 giờ"
            price={`+${formatVND(URGENT_FEE)}/đơn`}
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

