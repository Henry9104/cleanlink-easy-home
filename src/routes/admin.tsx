import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmPaymentDialog } from "@/components/booking/ConfirmPaymentDialog";
import { BookingDetailModal, BookingFormModal } from "@/components/admin/BookingModals";
import {
  DeleteConfirmDialog,
  ReviewFormModal,
  UserDetailModal,
  UserFormModal,
} from "@/components/admin/UserAndReviewModals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  confirmBookingPayment,
  getErrorMessage,
  getPaymentStatus,
} from "@/lib/bookings";
import {
  ADMIN_ROLE_BADGE_CLASS,
  ADMIN_ROLE_LABELS,
  adminCreateBooking,
  adminCreateReview,
  adminCreateUser,
  adminDeleteBooking,
  adminDeleteReview,
  adminDeleteUser,
  adminToggleUserStatus,
  adminUpdateBooking,
  adminUpdateReview,
  adminUpdateUser,
  loadMergedAdminData,
  type AdminBookingRow,
  type AdminReviewRow,
  type AdminUserRow,
  type BookingFormInput,
  type ReviewFormInput,
  type UserFormInput,
} from "@/lib/admin-crud";
import { toast } from "sonner";
import {
  statusLabel,
  statusColor,
  paymentStatusLabel,
  paymentStatusColor,
  formatVND,
  areas,
  timeSlots,
  labelFrom,
  type BookingStatus,
} from "@/lib/cleanlink-data";
import { parseServiceKey, platformFeeFromBooking, serviceDetail } from "@/lib/pricing";
import {
  ClipboardList,
  Clock,
  PlayCircle,
  CheckCircle2,
  Star,
  Wallet,
  ShieldAlert,
  CreditCard,
  Loader2,
  RefreshCw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  Lock,
  Unlock,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Quản trị – CleanLink" },
      { name: "description", content: "Bảng điều khiển quản trị CleanLink." },
      { property: "og:title", content: "Quản trị – CleanLink" },
      { property: "og:description", content: "Bảng điều khiển quản trị CleanLink." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { loading, isAuthenticated, isAdmin, user } = useAuth();
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Tìm kiếm nhanh
  const [bookingSearch, setBookingSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");

  // Duyệt thanh toán nhanh
  const [confirmTarget, setConfirmTarget] = useState<AdminBookingRow | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Modal Đơn dọn (Xem / Thêm / Sửa / Xóa)
  const [detailBooking, setDetailBooking] = useState<AdminBookingRow | null>(null);
  const [bookingFormMode, setBookingFormMode] = useState<"create" | "edit">("create");
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<AdminBookingRow | null>(null);
  const [savingBooking, setSavingBooking] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState<AdminBookingRow | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  // Modal Người dùng (Xem / Thêm / Sửa / Xóa)
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [userFormMode, setUserFormMode] = useState<"create" | "edit">("create");
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminUserRow | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Modal Đánh giá (Thêm / Sửa / Xóa)
  const [reviewFormMode, setReviewFormMode] = useState<"create" | "edit">("create");
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<AdminReviewRow | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState<AdminReviewRow | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  const loadAdminData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const merged = await loadMergedAdminData();
      setBookings(merged.bookings);
      setUsers(merged.users);
      setReviews(merged.reviews);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadAdminData();

    const channel = supabase
      .channel("admin-bookings-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          void loadAdminData();
        },
      )
      .subscribe();

    const timer = window.setInterval(() => {
      void loadAdminData();
    }, 10000);

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, loadAdminData]);

  const nameOf = useCallback(
    (id: string | null) => users.find((u) => u.id === id)?.full_name ?? "",
    [users],
  );

  // ==========================================================================
  // HANDLERS: TAB 1 – ĐƠN DỌN
  // ==========================================================================

  async function handleConfirmPayment(target: AdminBookingRow) {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      const updated = await confirmBookingPayment(target.id);
      setBookings((list) => list.map((b) => (b.id === target.id ? { ...b, ...updated } : b)));
      setConfirmTarget(null);
      toast.success(
        `Đã xác nhận thanh toán đơn ${target.code} (${formatVND(target.price)}) – đơn đã chuyển sang chờ người dọn nhận việc`,
      );
      void loadAdminData();
    } catch (e) {
      toast.error(getErrorMessage(e, "Không xác nhận được thanh toán, vui lòng thử lại"));
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleSubmitBookingForm(input: BookingFormInput) {
    if (!user || savingBooking) return;
    setSavingBooking(true);
    try {
      if (bookingFormMode === "create") {
        const created = await adminCreateBooking(input, user.id);
        setBookings((prev) => [created, ...prev]);
        toast.success(`Đã tạo đơn dọn mới ${created.code} (${created.property_name})`);
      } else if (editingBooking) {
        const patch = await adminUpdateBooking(editingBooking.id, input, user.id);
        setBookings((prev) =>
          prev.map((b) => (b.id === editingBooking.id ? { ...b, ...patch } : b)),
        );
        toast.success(`Đã cập nhật đơn dọn ${editingBooking.code}`);
      }
      setBookingFormOpen(false);
      setEditingBooking(null);
      void loadAdminData();
    } catch (e) {
      toast.error(getErrorMessage(e, "Không lưu được đơn dọn, vui lòng thử lại"));
    } finally {
      setSavingBooking(false);
    }
  }

  async function handleConfirmDeleteBooking() {
    if (!deletingBooking || isDeletingBooking) return;
    setIsDeletingBooking(true);
    try {
      const target = deletingBooking;
      await adminDeleteBooking(target.id);
      setBookings((prev) => prev.filter((b) => b.id !== target.id));
      setDeletingBooking(null);
      toast.success(`Đã xóa đơn dọn ${target.code} (${target.property_name})`);
      void loadAdminData();
    } catch (e) {
      toast.error(getErrorMessage(e, "Không xóa được đơn dọn, vui lòng thử lại"));
    } finally {
      setIsDeletingBooking(false);
    }
  }

  // ==========================================================================
  // HANDLERS: TAB 2 – NGƯỜI DÙNG
  // ==========================================================================

  async function handleSubmitUserForm(input: UserFormInput) {
    if (savingUser) return;
    setSavingUser(true);
    try {
      if (userFormMode === "create") {
        const created = await adminCreateUser(input);
        setUsers((prev) => [created, ...prev]);
        toast.success(`Đã thêm người dùng ${created.full_name} (${ADMIN_ROLE_LABELS[input.role]})`);
      } else if (editingUser) {
        const patch = await adminUpdateUser(editingUser.id, input);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...patch } : u)),
        );
        toast.success(`Đã cập nhật thông tin người dùng ${input.full_name}`);
      }
      setUserFormOpen(false);
      setEditingUser(null);
      void loadAdminData();
    } catch (e) {
      toast.error(getErrorMessage(e, "Không lưu được người dùng, vui lòng thử lại"));
    } finally {
      setSavingUser(false);
    }
  }

  async function handleToggleUserLock(target: AdminUserRow) {
    try {
      const nextStatus = await adminToggleUserStatus(target);
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, status: nextStatus } : u)),
      );
      toast.success(
        nextStatus === "locked"
          ? `Đã khóa tài khoản của ${target.full_name}`
          : `Đã mở khóa tài khoản của ${target.full_name}`,
      );
    } catch (e) {
      toast.error(getErrorMessage(e, "Không cập nhật được trạng thái tài khoản"));
    }
  }

  async function handleConfirmDeleteUser() {
    if (!deletingUser || isDeletingUser) return;
    setIsDeletingUser(true);
    try {
      const target = deletingUser;
      await adminDeleteUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      setDeletingUser(null);
      toast.success(`Đã xóa người dùng ${target.full_name}`);
      void loadAdminData();
    } catch (e) {
      toast.error(getErrorMessage(e, "Không xóa được người dùng, vui lòng thử lại"));
    } finally {
      setIsDeletingUser(false);
    }
  }

  // ==========================================================================
  // HANDLERS: TAB 3 – ĐÁNH GIÁ
  // ==========================================================================

  async function handleSubmitReviewForm(input: ReviewFormInput) {
    if (!user || savingReview) return;
    setSavingReview(true);
    try {
      if (reviewFormMode === "create") {
        const created = await adminCreateReview(input, user.id);
        setReviews((prev) => [created, ...prev]);
        toast.success(`Đã thêm đánh giá ${created.rating} sao cho đơn ${created.booking_code}`);
      } else if (editingReview) {
        const patch = await adminUpdateReview(editingReview.id, input);
        setReviews((prev) =>
          prev.map((r) => (r.id === editingReview.id ? { ...r, ...patch } : r)),
        );
        toast.success(`Đã cập nhật đánh giá cho đơn ${input.booking_code}`);
      }
      setReviewFormOpen(false);
      setEditingReview(null);
      void loadAdminData();
    } catch (e) {
      toast.error(getErrorMessage(e, "Không lưu được đánh giá, vui lòng thử lại"));
    } finally {
      setSavingReview(false);
    }
  }

  async function handleConfirmDeleteReview() {
    if (!deletingReview || isDeletingReview) return;
    setIsDeletingReview(true);
    try {
      const target = deletingReview;
      await adminDeleteReview(target.id);
      setReviews((prev) => prev.filter((r) => r.id !== target.id));
      setDeletingReview(null);
      toast.success("Đã xóa đánh giá thành công");
      void loadAdminData();
    } catch (e) {
      toast.error(getErrorMessage(e, "Không xóa được đánh giá, vui lòng thử lại"));
    } finally {
      setIsDeletingReview(false);
    }
  }

  if (loading || (user && !isAdmin && users.length === 0 && loading)) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Đang tải...</div>
      </SiteLayout>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Chỉ dành cho quản trị viên</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vui lòng đăng nhập bằng tài khoản có quyền quản trị.
          </p>
          <Button asChild className="mt-6">
            <Link to="/dang-nhap" search={{ next: "/admin" } as never}>
              Đăng nhập
            </Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const doneStatuses = ["completed", "reviewed"];
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "–";
  const pendingPaymentCount = bookings.filter((b) => getPaymentStatus(b) === "pending").length;
  const waitingCleanerCount = bookings.filter(
    (b) => b.status === "searching" && getPaymentStatus(b) === "paid" && !b.cleaner_id,
  ).length;
  const cleanlinkRevenue = bookings
    .filter((b) => getPaymentStatus(b) === "paid" && b.status !== "cancelled")
    .reduce((sum, b) => sum + platformFeeFromBooking(b), 0);

  const stats = [
    {
      icon: ClipboardList,
      label: "Đơn hôm nay",
      value: bookings.filter((b) => b.service_date === today).length,
      tint: "bg-sky/60 text-sky-foreground",
    },
    {
      icon: CreditCard,
      label: "Chờ duyệt tiền",
      value: pendingPaymentCount,
      tint: "bg-amber-100 text-amber-800",
    },
    {
      icon: Clock,
      label: "Đang chờ người dọn",
      value: waitingCleanerCount,
      tint: "bg-orange-100 text-orange-700",
    },
    {
      icon: PlayCircle,
      label: "Đang thực hiện",
      value: bookings.filter((b) => ["accepted", "in_progress", "photo_sent"].includes(b.status))
        .length,
      tint: "bg-indigo-100 text-indigo-700",
    },
    {
      icon: CheckCircle2,
      label: "Đã hoàn thành",
      value: bookings.filter((b) => doneStatuses.includes(b.status)).length,
      tint: "bg-mint/60 text-mint-foreground",
    },
    {
      icon: Star,
      label: "Đánh giá trung bình",
      value: `${avg}/5`,
      tint: "bg-yellow-100 text-yellow-700",
    },
    {
      icon: Wallet,
      label: "Doanh thu CleanLink",
      value: formatVND(cleanlinkRevenue),
      tint: "bg-emerald-100 text-emerald-700",
    },
  ];

  // Lọc theo từ khóa tìm kiếm
  const qBooking = bookingSearch.trim().toLowerCase();
  const filteredBookings = bookings.filter((b) => {
    if (!qBooking) return true;
    const hostName = b.customer_name || nameOf(b.host_id);
    return (
      b.code.toLowerCase().includes(qBooking) ||
      b.property_name.toLowerCase().includes(qBooking) ||
      b.address.toLowerCase().includes(qBooking) ||
      b.phone.toLowerCase().includes(qBooking) ||
      hostName.toLowerCase().includes(qBooking) ||
      (b.cleaner_name ?? "").toLowerCase().includes(qBooking)
    );
  });

  const qUser = userSearch.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!qUser) return true;
    return (
      u.full_name.toLowerCase().includes(qUser) ||
      u.phone.toLowerCase().includes(qUser) ||
      (u.email ?? "").toLowerCase().includes(qUser) ||
      (u.property_name ?? "").toLowerCase().includes(qUser)
    );
  });

  const qReview = reviewSearch.trim().toLowerCase();
  const filteredReviews = reviews.filter((r) => {
    if (!qReview) return true;
    const code = r.booking_code || bookings.find((b) => b.id === r.booking_id)?.code || "";
    return (
      code.toLowerCase().includes(qReview) ||
      (r.customer_name ?? "").toLowerCase().includes(qReview) ||
      (r.cleaner_name ?? "").toLowerCase().includes(qReview) ||
      (r.comment ?? "").toLowerCase().includes(qReview)
    );
  });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Bảng điều khiển CleanLink</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Quản lý toàn diện đơn dọn phòng, người dùng, phân quyền và đánh giá dịch vụ tại Quy Nhơn – Gia Lai.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => void loadAdminData(true)}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/nguoi-don">Màn hình Người dọn</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">Về trang chủ</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-card border border-border/60 p-5 shadow-card">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.tint}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="mt-10 space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Đơn dọn ({bookings.length})</TabsTrigger>
            <TabsTrigger value="users">Người dùng ({users.length})</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá ({reviews.length})</TabsTrigger>
          </TabsList>

          {/* ================================================================
              TAB 1: ĐƠN DỌN
          ================================================================ */}
          <TabsContent value="bookings" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm mã đơn, cơ sở, SĐT, khách hoặc người dọn…"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="pl-9 rounded-full"
                />
              </div>
              <Button
                type="button"
                className="rounded-full shadow-soft"
                onClick={() => {
                  setBookingFormMode("create");
                  setEditingBooking(null);
                  setBookingFormOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Tạo đơn mới
              </Button>
            </div>

            <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Cơ sở</TableHead>
                    <TableHead>Khách / Chủ cơ sở</TableHead>
                    <TableHead>Khu vực</TableHead>
                    <TableHead className="text-right">Số phòng</TableHead>
                    <TableHead>Ngày / giờ</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead>Trạng thái đơn</TableHead>
                    <TableHead>Người dọn</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                        Không có đơn dọn nào phù hợp.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredBookings.map((b) => {
                    const payStatus = getPaymentStatus(b);
                    const isRowConfirming = isConfirming && confirmTarget?.id === b.id;
                    const customerDisplay = b.customer_name || nameOf(b.host_id) || "—";
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs font-semibold">{b.code}</TableCell>
                        <TableCell>
                          <div className="font-medium">{b.property_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {b.address} · {b.phone}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{customerDisplay}</TableCell>
                        <TableCell className="text-sm">{labelFrom(areas, b.area)}</TableCell>
                        <TableCell
                          className="text-right font-semibold"
                          title={serviceDetail(b.room_type)}
                        >
                          {parseServiceKey(b.room_type).serviceType === "lodging" ? b.rooms : "—"}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(b.service_date).toLocaleDateString("vi-VN")} ·{" "}
                          {labelFrom(timeSlots, b.time_slot)}
                          {b.urgency === "urgent" && (
                            <span className="ml-1 text-[10px] font-medium text-amber-700">GẤP</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className={paymentStatusColor[payStatus]}>
                            {paymentStatusLabel[payStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={statusColor[b.status as BookingStatus]}
                          >
                            {statusLabel[b.status as BookingStatus] ?? b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {b.cleaner_name ?? (
                            <span className="text-muted-foreground italic">chưa gán</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary whitespace-nowrap">
                          {formatVND(b.price)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            {payStatus === "pending" && (
                              <Button
                                size="sm"
                                disabled={isRowConfirming}
                                onClick={() => setConfirmTarget(b)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-2.5 text-xs"
                              >
                                {isRowConfirming ? (
                                  <>
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                    Đang duyệt…
                                  </>
                                ) : (
                                  "Duyệt tiền"
                                )}
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              title="Xem chi tiết đơn"
                              onClick={() => setDetailBooking(b)}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              Xem
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-primary hover:text-primary"
                              title="Chỉnh sửa đơn"
                              onClick={() => {
                                setBookingFormMode("edit");
                                setEditingBooking(b);
                                setBookingFormOpen(true);
                              }}
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Sửa
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Xóa đơn"
                              onClick={() => setDeletingBooking(b)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ================================================================
              TAB 2: NGƯỜI DÙNG
          ================================================================ */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm họ tên, SĐT, email hoặc cơ sở…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 rounded-full"
                />
              </div>
              <Button
                type="button"
                className="rounded-full shadow-soft"
                onClick={() => {
                  setUserFormMode("create");
                  setEditingUser(null);
                  setUserFormOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Thêm người dùng
              </Button>
            </div>

            <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Số điện thoại / Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Cơ sở / Khu vực</TableHead>
                    <TableHead>Trạng thái hoạt động</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Không có người dùng nào phù hợp.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell>
                        <div className="text-sm">{u.phone || "—"}</div>
                        {u.email && <div className="text-xs text-muted-foreground">{u.email}</div>}
                      </TableCell>
                      <TableCell className="space-x-1 whitespace-nowrap">
                        {u.roles.map((r) => (
                          <Badge key={r} variant="outline" className={ADMIN_ROLE_BADGE_CLASS[r]}>
                            {ADMIN_ROLE_LABELS[r]}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{u.property_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {u.area ? labelFrom(areas, u.area) : "Quy Nhơn, Gia Lai"}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            u.status === "active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }
                        >
                          {u.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => setDetailUser(u)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Xem
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs text-primary hover:text-primary"
                            onClick={() => {
                              setUserFormMode("edit");
                              setEditingUser(u);
                              setUserFormOpen(true);
                            }}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            title={
                              u.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"
                            }
                            onClick={() => void handleToggleUserLock(u)}
                          >
                            {u.status === "active" ? (
                              <Lock className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Xóa người dùng"
                            onClick={() => setDeletingUser(u)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ================================================================
              TAB 3: ĐÁNH GIÁ
          ================================================================ */}
          <TabsContent value="reviews" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm mã đơn, khách hàng, người dọn hoặc nhận xét…"
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="pl-9 rounded-full"
                />
              </div>
              <Button
                type="button"
                className="rounded-full shadow-soft"
                onClick={() => {
                  setReviewFormMode("create");
                  setEditingReview(null);
                  setReviewFormOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Thêm đánh giá
              </Button>
            </div>

            <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Người dọn được đánh giá</TableHead>
                    <TableHead>Số sao</TableHead>
                    <TableHead>Nội dung nhận xét</TableHead>
                    <TableHead>Ngày đánh giá</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Chưa có đánh giá nào.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredReviews.map((r) => {
                    const linkedBooking = bookings.find((b) => b.id === r.booking_id);
                    const code = r.booking_code || linkedBooking?.code || "—";
                    const customerDisplay =
                      r.customer_name ||
                      linkedBooking?.customer_name ||
                      nameOf(r.host_id) ||
                      linkedBooking?.property_name ||
                      "Khách hàng";
                    const cleanerDisplay =
                      r.cleaner_name ||
                      linkedBooking?.cleaner_name ||
                      (r.cleaner_id ? nameOf(r.cleaner_id) : "") ||
                      "Người dọn CleanLink";

                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {code}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{customerDisplay}</TableCell>
                        <TableCell className="text-sm">{cleanerDisplay}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="text-amber-500 font-semibold">
                            {"★".repeat(r.rating)}
                            <span className="text-muted-foreground/30">
                              {"★".repeat(Math.max(0, 5 - r.rating))}
                            </span>
                          </span>
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            ({r.rating}/5)
                          </span>
                        </TableCell>
                        <TableCell className="text-sm max-w-md">
                          {r.comment || <span className="text-muted-foreground italic">Không có nhận xét</span>}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-primary hover:text-primary"
                              onClick={() => {
                                setReviewFormMode("edit");
                                setEditingReview({
                                  ...r,
                                  booking_code: code,
                                  customer_name: customerDisplay,
                                  cleaner_name: cleanerDisplay,
                                });
                                setReviewFormOpen(true);
                              }}
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Sửa
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Xóa đánh giá"
                              onClick={() => setDeletingReview(r)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Duyệt Thanh Toán VietQR */}
        <ConfirmPaymentDialog
          booking={confirmTarget}
          hostName={
            confirmTarget
              ? confirmTarget.customer_name || nameOf(confirmTarget.host_id)
              : undefined
          }
          open={Boolean(confirmTarget)}
          isConfirming={isConfirming}
          onOpenChange={(open) => {
            if (!open) setConfirmTarget(null);
          }}
          onConfirm={(target) => void handleConfirmPayment(target as AdminBookingRow)}
        />

        {/* Modal Xem Chi Tiết Đơn */}
        <BookingDetailModal
          booking={detailBooking}
          hostName={detailBooking ? nameOf(detailBooking.host_id) : ""}
          open={Boolean(detailBooking)}
          onOpenChange={(open) => {
            if (!open) setDetailBooking(null);
          }}
          onEdit={(target) => {
            setBookingFormMode("edit");
            setEditingBooking(target);
            setBookingFormOpen(true);
          }}
          onConfirmPayment={(target) => setConfirmTarget(target)}
        />

        {/* Modal Tạo Mới / Sửa Đơn Dọn */}
        <BookingFormModal
          open={bookingFormOpen}
          mode={bookingFormMode}
          initial={editingBooking}
          users={users}
          hostNameOf={nameOf}
          saving={savingBooking}
          onOpenChange={(open) => {
            setBookingFormOpen(open);
            if (!open) setEditingBooking(null);
          }}
          onSubmit={(input) => void handleSubmitBookingForm(input)}
        />

        {/* Hộp Thoại Xác Nhận Xóa Đơn Dọn */}
        <DeleteConfirmDialog
          open={Boolean(deletingBooking)}
          title="Bạn có chắc chắn muốn xóa đơn dọn này?"
          description={
            deletingBooking
              ? `Đơn ${deletingBooking.code} (${deletingBooking.property_name} – ${formatVND(deletingBooking.price)}) sẽ bị xóa khỏi danh sách quản lý. Thao tác này không thể hoàn tác.`
              : ""
          }
          deleting={isDeletingBooking}
          onOpenChange={(open) => {
            if (!open) setDeletingBooking(null);
          }}
          onConfirm={() => void handleConfirmDeleteBooking()}
        />

        {/* Modal Xem Chi Tiết Người Dùng */}
        <UserDetailModal
          user={detailUser}
          open={Boolean(detailUser)}
          onOpenChange={(open) => {
            if (!open) setDetailUser(null);
          }}
          onEdit={(target) => {
            setUserFormMode("edit");
            setEditingUser(target);
            setUserFormOpen(true);
          }}
          onToggleLock={(target) => void handleToggleUserLock(target)}
        />

        {/* Modal Thêm / Sửa Người Dùng */}
        <UserFormModal
          open={userFormOpen}
          mode={userFormMode}
          initial={editingUser}
          saving={savingUser}
          onOpenChange={(open) => {
            setUserFormOpen(open);
            if (!open) setEditingUser(null);
          }}
          onSubmit={(input) => void handleSubmitUserForm(input)}
        />

        {/* Hộp Thoại Xác Nhận Xóa Người Dùng */}
        <DeleteConfirmDialog
          open={Boolean(deletingUser)}
          title="Bạn có chắc chắn muốn xóa người dùng này?"
          description={
            deletingUser
              ? `Tài khoản "${deletingUser.full_name}" (${deletingUser.phone}) sẽ bị xóa khỏi danh sách người dùng trên hệ thống.`
              : ""
          }
          deleting={isDeletingUser}
          onOpenChange={(open) => {
            if (!open) setDeletingUser(null);
          }}
          onConfirm={() => void handleConfirmDeleteUser()}
        />

        {/* Modal Thêm / Sửa Đánh Giá */}
        <ReviewFormModal
          open={reviewFormOpen}
          mode={reviewFormMode}
          initial={editingReview}
          bookings={bookings}
          users={users}
          hostNameOf={nameOf}
          saving={savingReview}
          onOpenChange={(open) => {
            setReviewFormOpen(open);
            if (!open) setEditingReview(null);
          }}
          onSubmit={(input) => void handleSubmitReviewForm(input)}
        />

        {/* Hộp Thoại Xác Nhận Xóa Đánh Giá */}
        <DeleteConfirmDialog
          open={Boolean(deletingReview)}
          title="Bạn có chắc chắn muốn xóa đánh giá này?"
          description={
            deletingReview
              ? `Đánh giá ${deletingReview.rating}/5 sao của "${deletingReview.customer_name || "Khách hàng"}" sẽ bị gỡ bỏ và điểm đánh giá trung bình sẽ được tính lại.`
              : ""
          }
          deleting={isDeletingReview}
          onOpenChange={(open) => {
            if (!open) setDeletingReview(null);
          }}
          onConfirm={() => void handleConfirmDeleteReview()}
        />
      </section>
    </SiteLayout>
  );
}
