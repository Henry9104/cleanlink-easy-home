import { Info } from "lucide-react";
import { formatVND } from "@/lib/cleanlink-data";
import { CONTACT } from "@/lib/contact-info";
import type { Estimate } from "@/lib/pricing";

/** Chi tiết từng khoản + tổng tiền ước tính (cập nhật theo thời gian thực) */
export function PriceBreakdown({ estimate }: { estimate: Estimate }) {
  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-2">
        {estimate.lines.map((l, i) => (
          <li key={`${l.label}-${i}`} className="flex justify-between gap-3">
            <span className="text-muted-foreground">{l.label}</span>
            {l.amount === null ? (
              <span className="shrink-0 text-right font-medium text-amber-700">{l.note ?? "Báo giá riêng"}</span>
            ) : (
              <span className="shrink-0 font-medium">{formatVND(l.amount)}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-3">
        <span className="font-medium">Tổng ước tính</span>
        <span className="text-2xl font-bold text-primary">
          {estimate.baseQuote ? "Liên hệ" : formatVND(estimate.total)}
        </span>
      </div>

      {estimate.baseQuote ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Dịch vụ này cần báo giá riêng. Vui lòng gọi{" "}
            <a href={CONTACT.hotlineHref} className="font-semibold underline">
              {CONTACT.hotline}
            </a>{" "}
            hoặc nhắn Zalo để được hỗ trợ.
          </span>
        </div>
      ) : (
        estimate.hasQuote && (
          <p className="text-xs text-amber-700">*Chưa bao gồm các mục cần khảo sát/báo giá riêng</p>
        )
      )}
    </div>
  );
}

