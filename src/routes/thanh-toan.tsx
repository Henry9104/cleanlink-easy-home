import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatVND } from "@/lib/cleanlink-data";
import { useState } from "react";
import { CheckCircle2, CreditCard, Wallet, Landmark, QrCode, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/thanh-toan")({
  head: () => ({
    meta: [
      { title: "Thanh toán – CleanLink" },
      { name: "description", content: "Thanh toán mock cho đơn dọn phòng homestay/mini hotel qua CleanLink." },
    ],
  }),
  component: PaymentPage,
});

const summary = { rooms: 5, subtotal: 400000, urgent: 80000, total: 480000 };
const ORDER_ID = "CL240712";

type MethodKey = "momo" | "vnpay" | "transfer" | "cash";

const qrConfig: Record<Exclude<MethodKey, "cash">, {
  title: string;
  brandColor: string;
  brandLabel: string;
  account: string;
  accountLabel: string;
  holder: string;
  note: string;
}> = {
  momo: {
    title: "Quét mã MoMo để thanh toán",
    brandColor: "#a50064",
    brandLabel: "MoMo",
    account: "0905 123 456",
    accountLabel: "Số điện thoại MoMo",
    holder: "CÔNG TY CLEANLINK",
    note: "Mở app MoMo → Quét mã → Xác nhận số tiền.",
  },
  vnpay: {
    title: "Quét mã VNPay QR",
    brandColor: "#005baa",
    brandLabel: "VNPay",
    account: "9704 0000 1234 5678",
    accountLabel: "Số tài khoản VNPay",
    holder: "CONG TY CLEANLINK",
    note: "Mở app ngân hàng có hỗ trợ VNPay QR → Quét mã.",
  },
  transfer: {
    title: "Chuyển khoản qua QR ngân hàng",
    brandColor: "#0a7d3b",
    brandLabel: "VietQR",
    account: "0123 4567 8910 - Vietcombank",
    accountLabel: "Số tài khoản",
    holder: "CONG TY CLEANLINK",
    note: "Mở app ngân hàng → Quét mã QR → Kiểm tra nội dung chuyển khoản.",
  },
};

function VirtualQR({ method }: { method: Exclude<MethodKey, "cash"> }) {
  const cfg = qrConfig[method];
  const payload = encodeURIComponent(
    `CLEANLINK|${method.toUpperCase()}|${ORDER_ID}|${summary.total}|${cfg.holder}`,
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=1&data=${payload}`;
  const noteText = `CLEANLINK ${ORDER_ID}`;

  return (
    <div className="mt-4 rounded-xl border border-border/70 bg-mint/20 p-5">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">{cfg.title}</p>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="rounded-2xl bg-white p-3 shadow-card border border-border/60">
          <div
            className="flex items-center justify-center rounded-md px-3 py-1 mb-2 text-xs font-bold text-white"
            style={{ backgroundColor: cfg.brandColor }}
          >
            {cfg.brandLabel}
          </div>
          <img
            src={qrUrl}
            alt={`Mã QR ${cfg.brandLabel} cho đơn ${ORDER_ID}`}
            width={200}
            height={200}
            className="h-[200px] w-[200px]"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Mã QR demo · hết hạn sau 15 phút</p>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{cfg.accountLabel}</dt>
          <dd className="font-medium text-right">{cfg.account}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Người nhận</dt>
          <dd className="font-medium text-right">{cfg.holder}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Số tiền</dt>
          <dd className="font-semibold text-primary">{formatVND(summary.total)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Nội dung</dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono text-xs bg-white border border-border rounded px-2 py-1">{noteText}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(noteText);
                toast.success("Đã sao chép nội dung chuyển khoản");
              }}
              className="text-primary hover:text-primary/80"
              aria-label="Sao chép nội dung"
            >
              <Copy className="h-4 w-4" />
            </button>
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted-foreground">{cfg.note}</p>
    </div>
  );
}

function PaymentPage() {
  const [method, setMethod] = useState<MethodKey>("momo");
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-4 md:px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint/60 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Thanh toán thành công</h1>
          <p className="mt-3 text-muted-foreground">Đơn {ORDER_ID} đã được thanh toán {formatVND(summary.total)} qua {method.toUpperCase()}.</p>
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild variant="outline" className="rounded-full"><Link to="/theo-doi-don">Xem đơn</Link></Button>
            <Button asChild className="rounded-full"><Link to="/danh-gia">Đánh giá người dọn</Link></Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  const methods: { v: MethodKey; l: string; icon: typeof Wallet }[] = [
    { v: "momo", l: "Ví MoMo", icon: Wallet },
    { v: "vnpay", l: "VNPay QR", icon: CreditCard },
    { v: "transfer", l: "Chuyển khoản ngân hàng", icon: Landmark },
    { v: "cash", l: "Tiền mặt khi hoàn tất", icon: Wallet },
  ];

  const showQR = method === "momo" || method === "vnpay" || method === "transfer";

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">Đơn {ORDER_ID} · Mai House Homestay</p>
        <h1 className="mt-1 text-3xl font-bold">Thanh toán</h1>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="rounded-2xl bg-card border border-border/60 shadow-card p-6">
            <h2 className="font-semibold">Chọn phương thức</h2>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as MethodKey)} className="mt-4 grid gap-2">
              {methods.map((m) => (
                <label
                  key={m.v}
                  className="flex items-center gap-3 rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-mint/30"
                >
                  <RadioGroupItem value={m.v} />
                  <m.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium flex-1">{m.l}</span>
                </label>
              ))}
            </RadioGroup>

            {showQR && <VirtualQR method={method} />}

            {method === "cash" && (
              <div className="mt-4 rounded-xl border border-border/70 bg-mint/20 p-5 text-sm text-muted-foreground">
                Thanh toán bằng tiền mặt cho người dọn sau khi hoàn tất dịch vụ. Vui lòng chuẩn bị đúng số tiền {formatVND(summary.total)}.
              </div>
            )}
          </div>

          <aside className="rounded-2xl bg-card border border-border/60 shadow-card p-6 h-fit space-y-3 text-sm">
            <h3 className="font-semibold">Tóm tắt đơn</h3>
            <div className="flex justify-between"><span className="text-muted-foreground">Số phòng</span><span>{summary.rooms}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(summary.subtotal)}</span></div>
            <div className="flex justify-between text-amber-700"><span>Phụ phí gấp</span><span>{formatVND(summary.urgent)}</span></div>
            <div className="border-t border-border/60 pt-3 flex justify-between items-baseline">
              <span>Tổng</span>
              <span className="text-2xl font-bold text-primary">{formatVND(summary.total)}</span>
            </div>
            <Button
              className="w-full rounded-full mt-3"
              onClick={() => {
                setPaid(true);
                toast.success(
                  showQR ? "Đã ghi nhận thanh toán qua mã QR (demo)" : "Thanh toán mock thành công",
                );
              }}
            >
              {showQR ? "Tôi đã quét mã & thanh toán" : `Thanh toán ${formatVND(summary.total)}`}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Đây là thanh toán demo, chưa kết nối cổng thanh toán thật.</p>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
