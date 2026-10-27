import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  Wallet,
  Zap,
  Check,
  Home,
  ArrowRight,
  RefreshCw,
  Loader2,
  DoorOpen,
  Phone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  acceptJob,
  fetchAvailableOrders,
  fetchCleanerBookings,
  getErrorMessage,
  getPaymentStatus,
  type BookingRow,
} from "@/lib/bookings";
import {
  areas,
  timeSlots,
  labelFrom,
  formatVND,
  statusLabel,
  statusColor,
  ORDER_STATUS,
  PAYMENT_STATUS,
  type BookingStatus,
} from "@/lib/cleanlink-data";
import {
  addonLabels,
  cleanerPayoutFromBooking,
  parseServiceKey,
  serviceDetail,
  serviceHeadline,
} from "@/lib/pricing";

const TITLE = "Công việc mới gần bạn – CleanLink cho người dọn";
const DESC =
  "Trang dành cho người dọn CleanLink: xem đơn mới đã được Admin duyệt tiền tại Quy Nhơn, nhận đơn, làm danh sách công việc và gửi hình ảnh sau khi dọn.";

export const Route = createFileRoute("/nguoi-don")({
  ssr: false,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CleanerPage,
});

function CleanerPage() {
  const { user, profile, role, isAdmin, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState<BookingRow[]>([]);
  const [allRows, setAllRows] = useState<BookingRow[]>([]);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      void navigate({ to: "/dang-nhap", search: { next: "/nguoi-don" }, replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const reload = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        const [avail, rows] = await Promise.all([
          fetchAvailableOrders(areaFilter),
          fetchCleanerBookings(),
        ]);
        setAvailableOrders(avail);
        setAllRows(rows);
      } finally {
        setLoading(false);
        if (showSpinner) setRefreshing(false);
      }
    },
    [areaFilter],
  );

  useEffect(() => {
    if (!user) return;
    void reload();

    // Lắng nghe Realtime khi Admin duyệt thanh toán hoặc có thợ nhận đơn
    const channel = supabase
      .channel("cleaner-bookings-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          void reload();
        },
      )
      .subscribe();

    const timer = window.setInterval(() => {
      void reload();
    }, 8000);

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [user, reload]);

  const openJobs = availableOrders.filter(
    (b) =>
      !b.cleaner_id &&
      b.status === ORDER_STATUS.READY_FOR_PICKUP &&
      getPaymentStatus(b) === PAYMENT_STATUS.PAID &&
      (areaFilter === "all" || b.area === areaFilter),
  );
  const myJobs = allRows.filter((b) => b.cleaner_id === user?.id);

  async function onClaim(b: BookingRow) {
    if (!user || claimingId) return;
    setClaimingId(b.id);
    try {
      const cleanerName = profile?.full_name || "Người dọn CleanLink";
      await acceptJob(b.id, user.id, cleanerName);
      // Ẩn ngay đơn khỏi danh sách chờ nhận việc
      setAvailableOrders((prev) => prev.filter((item) => item.id !== b.id));
      const payout = cleanerPayoutFromBooking(b);
      toast.success(
        `Đã nhận đơn ${b.code} thành công! Tiền công nhận được: ${formatVND(payout.cleanerTotal)}`,
      );
      await reload();
      void navigate({ to: "/don/$id", params: { id: b.id } });
    } catch (e) {
      toast.error(getErrorMessage(e, "Không nhận được đơn này, vui lòng thử lại"));
      void reload();
    } finally {
      setClaimingId(null);
    }
  }

  if (!authLoading && isAuthenticated && role && role !== "cleaner" && !isAdmin) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Màn hình dành cho Người dọn</h1>
          <p className="mt-2 text-muted-foreground">
            Tài khoản hiện tại của bạn đang đăng ký với vai trò Chủ cơ sở lưu trú. Vui lòng đăng nhập bằng tài khoản Người dọn để nhận đơn.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link to="/dat-lich">Đặt người dọn</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/theo-doi-don">Đơn của tôi</Link>
            </Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-12">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider">
                Người dọn CleanLink
              </p>
              <h1 className="mt-1 text-3xl md:text-4xl font-bold">Đơn mới chờ nhận việc</h1>
              <p className="mt-2 text-muted-foreground">
                {loading
                  ? "Đang tải danh sách đơn…"
                  : `Hiện có ${openJobs.length} đơn đã được Admin duyệt thanh toán và sẵn sàng nhận việc tại Quy Nhơn.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full bg-white/80"
                disabled={refreshing}
                onClick={() => void reload(true)}
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
              <div className="rounded-2xl bg-white/80 backdrop-blur px-4 py-3 shadow-card">
                <p className="text-xs text-muted-foreground">Đơn tôi đã nhận</p>
                <p className="text-xl font-bold text-primary">{myJobs.length}</p>
              </div>
            </div>
          </div>

          {/* Bộ lọc khu vực hoạt động */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Khu vực:</span>
            <button
              type="button"
              onClick={() => setAreaFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                areaFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white/80 text-foreground border-border hover:border-primary/50"
              }`}
            >
              Tất cả khu vực
            </button>
            {profile?.area && (
              <button
                type="button"
                onClick={() => setAreaFilter(profile.area!)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  areaFilter === profile.area
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-mint/40 text-mint-foreground border-mint hover:border-primary/50"
                }`}
              >
                Khu vực của tôi ({labelFrom(areas, profile.area)})
              </button>
            )}
            {areas.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAreaFilter(a.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  areaFilter === a.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white/80 text-foreground border-border hover:border-primary/50"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 md:px-6 py-10">
        <Tabs defaultValue="available" className="space-y-6">
          <TabsList>
            <TabsTrigger value="available">
              Đơn mới / Đơn chờ nhận việc ({openJobs.length})
            </TabsTrigger>
            <TabsTrigger value="claimed">Đơn tôi đã nhận ({myJobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Đang tải danh sách đơn chờ nhận việc…</p>
            ) : openJobs.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
                <p className="font-semibold">Hiện chưa có đơn mới chờ nhận việc</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ngay khi Admin xác nhận thanh toán cho đơn mới, đơn sẽ tự động xuất hiện tại đây.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 rounded-full"
                  disabled={refreshing}
                  onClick={() => void reload(true)}
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Kiểm tra đơn mới
                </Button>
              </div>
            ) : (
              openJobs.map((b) => {
                const payout = cleanerPayoutFromBooking(b);
                const parsed = parseServiceKey(b.room_type);
                const isClaiming = claimingId === b.id;
                return (
                  <article
                    key={b.id}
                    className="rounded-2xl bg-card border border-border/60 shadow-card p-5 md:p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 text-primary text-xs px-3 py-0.5 font-semibold font-mono">
                            {b.code}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-emerald-100 text-emerald-800 border-emerald-300"
                          >
                            Đã thanh toán
                          </Badge>
                          {b.urgency === "urgent" && (
                            <span className="inline-flex items-center gap-1 text-xs rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 font-semibold">
                              <Zap className="h-3 w-3" /> Đặt gấp
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-lg font-semibold">
                          {serviceHeadline(b.room_type, b.rooms)} tại {b.property_name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>
                            {b.address} · <strong>{labelFrom(areas, b.area)}</strong>
                          </span>
                        </p>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-right">
                        <p className="text-[11px] font-medium text-emerald-800 uppercase tracking-wide">
                          Tiền công thợ nhận
                        </p>
                        <p className="text-xl font-bold text-emerald-700">
                          {formatVND(payout.cleanerTotal)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Tổng đơn: {formatVND(b.price)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Thời gian dọn
                        </p>
                        <p className="mt-0.5 font-semibold text-sm">
                          {new Date(b.service_date).toLocaleDateString("vi-VN")} ·{" "}
                          {labelFrom(timeSlots, b.time_slot)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DoorOpen className="h-3 w-3" /> Số phòng / Gói dịch vụ
                        </p>
                        <p className="mt-0.5 font-semibold text-sm">
                          {parsed.serviceType === "lodging"
                            ? `${b.rooms} phòng · ${serviceDetail(b.room_type)}`
                            : serviceDetail(b.room_type)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Liên hệ cơ sở
                        </p>
                        <p className="mt-0.5 font-semibold text-sm">{b.phone}</p>
                      </div>
                    </div>

                    {(b.addons ?? []).length > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                        <Home className="h-3 w-3 shrink-0 text-primary" />
                        <span>
                          <strong className="text-foreground">Hạng mục yêu cầu:</strong>{" "}
                          {addonLabels(b.addons ?? []).join(", ")}
                        </span>
                      </p>
                    )}

                    {b.note && (
                      <p className="mt-3 rounded-xl border border-border/60 bg-mint/20 p-3 text-sm">
                        <span className="font-medium">Ghi chú từ chủ cơ sở: </span>
                        {b.note}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Wallet className="h-3.5 w-3.5 text-emerald-700" />
                        <span>
                          Thu nhập thực nhận:{" "}
                          <strong className="text-emerald-700">
                            {formatVND(payout.cleanerTotal)}
                          </strong>{" "}
                          (Phí nền tảng: {formatVND(payout.platformFee)})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-full">
                          <Link to="/don/$id" params={{ id: b.id }}>
                            Xem chi tiết
                          </Link>
                        </Button>
                        <Button
                          className="rounded-full bg-primary hover:bg-primary/90"
                          disabled={isClaiming || Boolean(claimingId)}
                          onClick={() => void onClaim(b)}
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                              Đang nhận đơn…
                            </>
                          ) : (
                            <>
                              <Check className="mr-1.5 h-4 w-4" />
                              Nhận đơn
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="claimed" className="space-y-4">
            {myJobs.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground shadow-card">
                Bạn chưa nhận đơn nào. Hãy chọn một đơn ở tab “Đơn mới / Đơn chờ nhận việc”.
              </div>
            ) : (
              myJobs.map((b) => {
                const status = b.status as BookingStatus;
                const payout = cleanerPayoutFromBooking(b);
                return (
                  <article
                    key={b.id}
                    className="rounded-2xl bg-card border border-border/60 shadow-card p-5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {b.code}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusColor[status]}`}
                        >
                          {statusLabel[status] ?? status}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold">
                        {serviceHeadline(b.room_type, b.rooms)} · {b.property_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {b.address} · {new Date(b.service_date).toLocaleDateString("vi-VN")} ·{" "}
                        {labelFrom(timeSlots, b.time_slot)}
                      </p>
                      <p className="mt-1 text-xs font-medium text-emerald-700">
                        Tiền công nhận: {formatVND(payout.cleanerTotal)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button asChild className="rounded-full">
                        <Link to="/don/$id" params={{ id: b.id }}>
                          Thực hiện công việc <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
