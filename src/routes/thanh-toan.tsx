import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, QrCode, Phone, Info } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  PAYMENT_METHOD,
  buildTransferContent,
  clearBookingDraft,
  loadBookingDraft,
  type BookingDraft,
} from "@/lib/bookings";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { formatVND, labelFrom, timeSlots } from "@/lib/cleanlink-data";
import { estimateOrder, selectionFromBooking, serviceDetail } from "@/lib/pricing";
import { BANK_ACCOUNT, CONTACT, buildVietQrUrl } from "@/lib/contact-info";

export const Route = createFileRoute("/thanh-toan")({
  head: () => ({
    meta: [
      { title: "Thanh toán chuyển khoản – CleanLink" },
      { name: "description", content: "Thanh toán đơn dọn phòng CleanLink bằng chuyển khoản VietQR qua Vietcombank." },
    ],
  }),
  component: PaymentPage,
});

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  } catch {
    toast.error("Không sao chép được, vui lòng chép thủ công");
  }
}

function CopyRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-right break-all">{value}</span>
        <button
          type="button"
          onClick={() => void copyText(copyValue ?? value, label.toLowerCase())}
          className="text-primary hover:text-primary/80 shrink-0"
          aria-label={`Sao chép ${label.toLowerCase()}`}
        >
          <Copy className="h-4 w-4" />
        </button>
      </dd>
    </div>
  );
}

function PaymentPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  // undefined: đang đọc bản nháp · null: không có đơn cần thanh toán
  const [draft, setDraft] = useState<BookingDraft | null | undefined>(undefined);
  const [qrFailed, setQrFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(loadBookingDraft());
  }, []);

  if (draft === undefined) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Đang tải…</div>
      </SiteLayout>
    );
  }

  if (draft === null) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-4 md:px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint/60 text-primary">
            <QrCode className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Chưa có đơn cần thanh toán</h1>
          <p className="mt-3 text-muted-foreground">Vui lòng đặt lịch trước, sau đó quay lại bước chuyển khoản.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/dat-lich">Đặt người dọn</Link>
          </Button>
        </section>
      </SiteLayout>
    );
  }

  const pending: BookingDraft = draft;
  const selection = selectionFromBooking(pending);
  const estimate = estimateOrder(selection);
  const transferContent = buildTransferContent(pending.phone, pending.code);
  const qrSrc = qrFailed
    ? buildVietQrUrl(pending.price, transferContent)
    : BANK_ACCOUNT.qrImage;

  async function onConfirm() {
    if (saving || authLoading) return;
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập bằng tài khoản chủ cơ sở để gửi đơn");
      void navigate({ to: "/dang-nhap", search: { next: "/thanh-toan" } });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          ...pending,
          host_id: user.id,
          status: "pending",
          payment_method: PAYMENT_METHOD,
        })
        .select("id")
        .single();
      if (error) throw error;
      clearBookingDraft();
      toast.success("Đã gửi đơn – CleanLink sẽ xác nhận sau khi nhận được chuyển khoản");
      void navigate({ to: "/don/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không gửi được đơn, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">
          Đơn {pending.code} · {pending.property_name}
        </p>
        <h1 className="mt-1 text-3xl font-bold">Thanh toán chuyển khoản</h1>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="rounded-2xl bg-card border border-border/60 shadow-card p-6">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Quét mã VietQR để chuyển khoản</h2>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <div className="rounded-2xl bg-white p-3 shadow-card border border-border/60">
                <img
                  src={qrSrc}
                  onError={() => setQrFailed(true)}
                  alt={`Mã QR chuyển khoản ${BANK_ACCOUNT.bankName} – ${BANK_ACCOUNT.serviceName} – ${BANK_ACCOUNT.accountName}`}
                  className="mx-auto block h-auto w-full max-w-[280px] rounded-xl object-contain"
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground text-center">
                {BANK_ACCOUNT.network} · Mở app ngân hàng → Quét mã QR → Kiểm tra số tiền và nội dung chuyển khoản.
              </p>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <CopyRow label="Ngân hàng" value={BANK_ACCOUNT.bankDisplay} />
              <CopyRow label="Đơn vị" value={BANK_ACCOUNT.serviceName} />
              <CopyRow label="Chủ tài khoản" value={BANK_ACCOUNT.accountName} />
              <CopyRow label="Số tài khoản" value={BANK_ACCOUNT.accountNumber} />
              <CopyRow label="Số tiền" value={formatVND(pending.price)} copyValue={String(pending.price)} />
              <CopyRow label="Nội dung" value={transferContent} />
              <CopyRow label="Hotline hỗ trợ" value={CONTACT.hotline} copyValue={CONTACT.hotline.replace(/\s/g, "")} />
            </dl>

            <div className="mt-5 flex items-start gap-2 rounded-lg bg-mint/30 p-3 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              Nội dung chuyển khoản theo cú pháp: [SĐT khách] - [Mã đơn]. Vui lòng giữ đúng nội dung để CleanLink đối soát nhanh.
            </div>
          </div>

          <aside className="rounded-2xl bg-card border border-border/60 shadow-card p-6 h-fit space-y-3 text-sm">
            <h3 className="font-semibold">Tóm tắt đơn</h3>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Dịch vụ</span>
              <span className="text-right">{serviceDetail(pending.room_type ?? "standard")}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Ngày / giờ</span>
              <span className="text-right">
                {pending.service_date ? new Date(pending.service_date).toLocaleDateString("vi-VN") : "—"} · {labelFrom(timeSlots, selection.timeSlot)}
              </span>
            </div>
            <div className="border-t border-border/60 pt-3">
              <PriceBreakdown estimate={estimate} />
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-medium">Cần chuyển khoản</span>
              <span className="text-xl font-bold text-primary">{formatVND(pending.price)}</span>
            </div>
            <Button className="w-full rounded-full mt-3" disabled={saving} onClick={() => void onConfirm()}>
              {saving ? "Đang gửi đơn…" : "Tôi đã chuyển khoản"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Đơn sẽ ở trạng thái “Chờ xác nhận” cho đến khi CleanLink nhận được tiền.
            </p>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link to="/dat-lich">Quay lại chỉnh sửa</Link>
            </Button>
            <a
              href={CONTACT.hotlineHref}
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5" /> Cần hỗ trợ? Gọi {CONTACT.hotline}
            </a>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
