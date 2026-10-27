import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildTransferContent, type BookingRow } from "@/lib/bookings";
import { formatVND, labelFrom, timeSlots } from "@/lib/cleanlink-data";
import { BANK_ACCOUNT } from "@/lib/contact-info";
import { serviceDetail } from "@/lib/pricing";

type ConfirmPaymentDialogProps = {
  booking: BookingRow | null;
  hostName?: string;
  open: boolean;
  isConfirming: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (booking: BookingRow) => void;
};

export function ConfirmPaymentDialog({
  booking,
  hostName,
  open,
  isConfirming,
  onOpenChange,
  onConfirm,
}: ConfirmPaymentDialogProps) {
  if (!booking) return null;

  const transferContent = buildTransferContent(booking.phone, booking.code);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isConfirming) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-1">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <DialogTitle>Xác nhận đã thanh toán đơn {booking.code}</DialogTitle>
          <DialogDescription>
            Vui lòng kiểm tra đối soát biến động số dư VietQR trên tài khoản{" "}
            <span className="font-medium text-foreground">{BANK_ACCOUNT.bankName}</span> trước khi duyệt.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/70 bg-muted/40 p-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Mã đơn</span>
            <span className="font-mono font-bold text-foreground">{booking.code}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground shrink-0">Khách / Cơ sở</span>
            <span className="font-medium text-right">
              {hostName ? `${hostName} · ${booking.property_name}` : booking.property_name}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Số điện thoại</span>
            <span className="font-medium">{booking.phone}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground shrink-0">Dịch vụ</span>
            <span className="text-right">{serviceDetail(booking.room_type)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Ngày / khung giờ</span>
            <span className="text-right">
              {new Date(booking.service_date).toLocaleDateString("vi-VN")} · {labelFrom(timeSlots, booking.time_slot)}
            </span>
          </div>
          <div className="border-t border-border/60 pt-2.5 flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Nội dung CK VietQR</span>
            <span className="font-mono text-xs font-semibold rounded bg-background px-2 py-0.5 border border-border">
              {transferContent}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 pt-1">
            <span className="font-medium text-foreground">Số tiền cần đối soát</span>
            <span className="text-lg font-bold text-emerald-700">{formatVND(booking.price)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Sau khi xác nhận, trạng thái thanh toán sẽ đổi thành{" "}
          <span className="font-medium text-emerald-700">Đã thanh toán</span> và đơn được chuyển sang{" "}
          <span className="font-medium text-foreground">Đang tìm người dọn</span>.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isConfirming}
            onClick={() => onOpenChange(false)}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            disabled={isConfirming}
            onClick={() => onConfirm(booking)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang xác nhận…
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Xác nhận đã thanh toán
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

