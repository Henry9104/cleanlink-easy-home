import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatVND } from "@/lib/cleanlink-data";
import { useState } from "react";
import { CheckCircle2, CreditCard, Wallet, Landmark } from "lucide-react";
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

function PaymentPage() {
  const [method, setMethod] = useState("momo");
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-md px-4 md:px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint/60 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Thanh toán thành công</h1>
          <p className="mt-3 text-muted-foreground">Đơn CL240712 đã được thanh toán {formatVND(summary.total)} qua {method.toUpperCase()}.</p>
          <div className="mt-8 flex gap-3 justify-center">
            <Button asChild variant="outline" className="rounded-full"><Link to="/theo-doi-don">Xem đơn</Link></Button>
            <Button asChild className="rounded-full"><Link to="/danh-gia">Đánh giá người dọn</Link></Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  const methods = [
    { v: "momo", l: "Ví MoMo", icon: Wallet },
    { v: "vnpay", l: "VNPay QR", icon: CreditCard },
    { v: "transfer", l: "Chuyển khoản ngân hàng", icon: Landmark },
    { v: "cash", l: "Tiền mặt khi hoàn tất", icon: Wallet },
  ];

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 md:px-6 py-10">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">Đơn CL240712 · Mai House Homestay</p>
        <h1 className="mt-1 text-3xl font-bold">Thanh toán</h1>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="rounded-2xl bg-card border border-border/60 shadow-card p-6">
            <h2 className="font-semibold">Chọn phương thức</h2>
            <RadioGroup value={method} onValueChange={setMethod} className="mt-4 grid gap-2">
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
                toast.success("Thanh toán mock thành công");
              }}
            >
              Thanh toán {formatVND(summary.total)}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Đây là thanh toán demo, chưa kết nối cổng thanh toán thật.</p>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
