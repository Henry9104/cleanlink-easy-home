import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Star,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Pencil,
  Lock,
  Unlock,
} from "lucide-react";
import { areas, labelFrom } from "@/lib/cleanlink-data";
import {
  ADMIN_ROLE_BADGE_CLASS,
  ADMIN_ROLE_LABELS,
  type AdminBookingRow,
  type AdminReviewRow,
  type AdminUserRow,
  type AppRoleKey,
  type ReviewFormInput,
  type UserFormInput,
} from "@/lib/admin-crud";

// ============================================================================
// MODAL THÊM / SỬA NGƯỜI DÙNG
// ============================================================================

type UserFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: AdminUserRow | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormInput) => void;
};

export function UserFormModal({
  open,
  mode,
  initial,
  saving,
  onOpenChange,
  onSubmit,
}: UserFormModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [area, setArea] = useState("trung_tam");
  const [role, setRole] = useState<AppRoleKey>("host");
  const [status, setStatus] = useState<"active" | "locked">("active");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setFullName(initial.full_name || "");
      setPhone(initial.phone || "");
      setEmail(initial.email || "");
      setPropertyName(initial.property_name || "");
      setArea(initial.area || "trung_tam");
      setRole(initial.roles[0] || "host");
      setStatus(initial.status || "active");
    } else {
      setFullName("");
      setPhone("");
      setEmail("");
      setPropertyName("");
      setArea("trung_tam");
      setRole("host");
      setStatus("active");
    }
  }, [open, mode, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    onSubmit({
      full_name: fullName,
      phone,
      email,
      property_name: propertyName,
      area,
      role,
      status,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Thêm người dùng mới" : `Chỉnh sửa người dùng: ${initial?.full_name ?? ""}`}
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cá nhân, phân quyền vai trò và trạng thái hoạt động của tài khoản.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="uf-name">Họ và tên *</Label>
              <Input
                id="uf-name"
                required
                placeholder="VD: Nguyễn Thị Lan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf-phone">Số điện thoại *</Label>
              <Input
                id="uf-phone"
                required
                placeholder="VD: 0905 222 333"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="uf-email">Email (nếu có)</Label>
              <Input
                id="uf-email"
                type="email"
                placeholder="VD: lan.nguyen@cleanlink.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf-area">Khu vực hoạt động</Label>
              <select
                id="uf-area"
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

          <div className="space-y-1.5">
            <Label htmlFor="uf-prop">Tên cơ sở lưu trú (nếu là Khách hàng / Chủ cơ sở)</Label>
            <Input
              id="uf-prop"
              placeholder="VD:的海 Homestay Quy Nhơn (để trống nếu là Người dọn)"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="uf-role">Vai trò (Phân quyền)</Label>
              <select
                id="uf-role"
                value={role}
                onChange={(e) => setRole(e.target.value as AppRoleKey)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                <option value="host">Khách hàng (Chủ cơ sở)</option>
                <option value="cleaner">Người dọn</option>
                <option value="admin">Admin (Quản trị viên)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf-status">Trạng thái tài khoản</Label>
              <select
                id="uf-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value === "locked" ? "locked" : "active")
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                <option value="active">Đang hoạt động</option>
                <option value="locked">Đã khóa tài khoản</option>
              </select>
            </div>
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
                "Thêm người dùng"
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

// ============================================================================
// MODAL XEM CHI TIẾT NGƯỜI DÙNG
// ============================================================================

type UserDetailModalProps = {
  user: AdminUserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (user: AdminUserRow) => void;
  onToggleLock: (user: AdminUserRow) => void;
};

export function UserDetailModal({
  user,
  open,
  onOpenChange,
  onEdit,
  onToggleLock,
}: UserDetailModalProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg">{user.full_name}</DialogTitle>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {user.roles.map((r) => (
                  <Badge key={r} variant="outline" className={ADMIN_ROLE_BADGE_CLASS[r]}>
                    {ADMIN_ROLE_LABELS[r]}
                  </Badge>
                ))}
                <Badge
                  variant="outline"
                  className={
                    user.status === "active"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  }
                >
                  {user.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                </Badge>
              </div>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Thông tin chi tiết người dùng {user.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/70 bg-muted/40 p-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" /> Số điện thoại
            </span>
            <span className="font-medium">{user.phone || "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" /> Email
            </span>
            <span className="font-medium">{user.email || "Chưa cập nhật"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Cơ sở lưu trú
            </span>
            <span className="font-medium text-right">{user.property_name || "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Khu vực
            </span>
            <span className="font-medium">
              {user.area ? `${labelFrom(areas, user.area)} (Quy Nhơn, Gia Lai)` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Ngày tham gia
            </span>
            <span className="font-medium">
              {new Date(user.created_at).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onToggleLock(user);
            }}
          >
            {user.status === "active" ? (
              <>
                <Lock className="mr-1.5 h-3.5 w-3.5 text-rose-600" />
                Khóa tài khoản
              </>
            ) : (
              <>
                <Unlock className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                Mở khóa tài khoản
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onEdit(user);
            }}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Sửa thông tin
          </Button>
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MODAL THÊM / SỬA ĐÁNH GIÁ
// ============================================================================

type ReviewFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: AdminReviewRow | null;
  bookings: AdminBookingRow[];
  users: AdminUserRow[];
  hostNameOf: (hostId: string | null) => string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReviewFormInput) => void;
};

export function ReviewFormModal({
  open,
  mode,
  initial,
  bookings,
  users,
  hostNameOf,
  saving,
  onOpenChange,
  onSubmit,
}: ReviewFormModalProps) {
  const cleaners = users.filter((u) => u.roles.includes("cleaner"));

  const [bookingId, setBookingId] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [hostId, setHostId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [cleanerId, setCleanerId] = useState("");
  const [cleanerName, setCleanerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setBookingId(initial.booking_id || "");
      setBookingCode(initial.booking_code || "");
      setHostId(initial.host_id || "");
      setCustomerName(initial.customer_name || "");
      setCleanerId(initial.cleaner_id || "");
      setCleanerName(initial.cleaner_name || "");
      setRating(initial.rating || 5);
      setComment(initial.comment || "");
    } else {
      const firstDone =
        bookings.find((b) => b.status === "completed" || b.status === "reviewed") ?? bookings[0];
      if (firstDone) {
        setBookingId(firstDone.id);
        setBookingCode(firstDone.code);
        setHostId(firstDone.host_id);
        setCustomerName(
          firstDone.customer_name || hostNameOf(firstDone.host_id) || firstDone.property_name,
        );
        setCleanerId(firstDone.cleaner_id || "");
        setCleanerName(firstDone.cleaner_name || "Nguyễn Thị Lan");
      } else {
        setBookingId("");
        setBookingCode("CL240712");
        setHostId("");
        setCustomerName("");
        setCleanerId("");
        setCleanerName("");
      }
      setRating(5);
      setComment("");
    }
  }, [open, mode, initial, bookings, hostNameOf]);

  function handleSelectBooking(nextBookingId: string) {
    setBookingId(nextBookingId);
    const found = bookings.find((b) => b.id === nextBookingId);
    if (found) {
      setBookingCode(found.code);
      setHostId(found.host_id);
      setCustomerName(
        found.customer_name || hostNameOf(found.host_id) || found.property_name,
      );
      if (found.cleaner_id) setCleanerId(found.cleaner_id);
      if (found.cleaner_name) setCleanerName(found.cleaner_name);
    }
  }

  function handleSelectCleaner(nextCleanerId: string) {
    setCleanerId(nextCleanerId);
    const found = cleaners.find((c) => c.id === nextCleanerId);
    if (found) {
      setCleanerName(found.full_name);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      booking_id: bookingId,
      booking_code: bookingCode || "CL-MẪU",
      host_id: hostId,
      customer_name: customerName || "Khách hàng",
      cleaner_id: cleanerId || null,
      cleaner_name: cleanerName || "Người dọn CleanLink",
      rating,
      comment,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Thêm đánh giá dịch vụ"
              : `Chỉnh sửa đánh giá đơn ${bookingCode || ""}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tạo hoặc nhập đánh giá bổ sung cho đơn dọn phòng đã hoàn tất."
              : "Điều chỉnh số sao hoặc nội dung nhận xét khi có yêu cầu đối soát / khiếu nại."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rf-booking">Chọn đơn dọn liên quan</Label>
              <select
                id="rf-booking"
                value={bookingId}
                onChange={(e) => handleSelectBooking(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
              >
                <option value="">-- Nhập mã đơn thủ công --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} – {b.property_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-code">Mã đơn hiển thị *</Label>
              <Input
                id="rf-code"
                required
                placeholder="VD: CL240712"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rf-customer">Tên khách hàng đánh giá *</Label>
              <Input
                id="rf-customer"
                required
                placeholder="VD: Mai House Homestay"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-cleaner">Người dọn được đánh giá *</Label>
              <div className="flex gap-2">
                <Input
                  id="rf-cleaner"
                  required
                  placeholder="VD: Nguyễn Thị Lan"
                  value={cleanerName}
                  onChange={(e) => setCleanerName(e.target.value)}
                />
                {cleaners.length > 0 && (
                  <select
                    aria-label="Chọn người dọn"
                    value={cleanerId}
                    onChange={(e) => handleSelectCleaner(e.target.value)}
                    className="h-9 max-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">Chọn thợ…</option>
                    {cleaners.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mức độ hài lòng (1 – 5 sao)</Label>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} sao`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      n <= rating
                        ? "fill-amber-400 text-amber-500"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-semibold text-foreground">
                {rating}/5 sao
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rf-comment">Nội dung nhận xét *</Label>
            <Textarea
              id="rf-comment"
              rows={3}
              required
              placeholder="VD: Phòng được dọn sạch sẽ, thay ga thẳng đẹp, gửi ảnh xác nhận đầy đủ và đúng giờ…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
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
                "Thêm đánh giá"
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

// ============================================================================
// HỘP THOẠI XÁC NHẬN XÓA (DÙNG CHUNG CHO ĐƠN DỌN, NGƯỜI DÙNG, ĐÁNH GIÁ)
// ============================================================================

type DeleteConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({
  open,
  title,
  description,
  deleting,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !deleting && onOpenChange(next)}>
      <AlertDialogContent className="sm:max-w-md rounded-2xl">
        <AlertDialogHeader>
          <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-1">
            <Trash2 className="h-5 w-5" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang xóa…
              </>
            ) : (
              <>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Xác nhận xóa
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

