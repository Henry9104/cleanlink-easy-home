import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { updateBooking, type BookingRow } from "@/lib/bookings";
import { toast } from "sonner";
import {
  statusLabel,
  statusColor,
  formatVND,
  areas,
  timeSlots,
  labelFrom,
  type BookingStatus,
} from "@/lib/cleanlink-data";
import { parseServiceKey, serviceDetail } from "@/lib/pricing";
import { ClipboardList, Clock, PlayCircle, CheckCircle2, Users, Star, Wallet, ShieldAlert } from "lucide-react";

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

type Profile = { id: string; phone: string; full_name: string; property_name: string | null; area: string | null; created_at: string };
type Review = { id: string; booking_id: string; rating: number; comment: string | null; created_at: string };
type RoleRow = { user_id: string; role: string };

const roleText: Record<string, string> = { host: "Chủ cơ sở", cleaner: "Người dọn", admin: "Quản trị" };

function AdminPage() {
  const { loading, isAuthenticated, isAdmin, user } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  /** Xác nhận đã nhận chuyển khoản: chuyển đơn từ "chờ xác nhận" sang "đang tìm người dọn" */
  async function confirmPayment(id: string) {
    setConfirmingId(id);
    try {
      await updateBooking(id, { status: "searching" });
      setBookings((list) => list.map((b) => (b.id === id ? { ...b, status: "searching" } : b)));
      toast.success("Đã xác nhận chuyển khoản – đơn chuyển sang tìm người dọn");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không xác nhận được đơn, vui lòng thử lại");
    } finally {
      setConfirmingId(null);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    void (async () => {
      const [b, p, r, ro] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, phone, full_name, property_name, area, created_at").order("created_at", { ascending: false }),
        supabase.from("reviews").select("id, booking_id, rating, comment, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      setBookings((b.data ?? []) as BookingRow[]);
      setProfiles((p.data ?? []) as Profile[]);
      setReviews((r.data ?? []) as Review[]);
      setRoles((ro.data ?? []) as RoleRow[]);
    })();
  }, [isAdmin]);

  if (loading || (user && !isAdmin && roles.length === 0 && loading)) {
    return <SiteLayout><div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Đang tải...</div></SiteLayout>;
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Chỉ dành cho quản trị viên</h1>
          <p className="mt-2 text-sm text-muted-foreground">Vui lòng đăng nhập bằng tài khoản có quyền quản trị.</p>
          <Button asChild className="mt-6"><Link to="/dang-nhap" search={{ next: "/admin" } as never}>Đăng nhập</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const nameOf = (id: string | null) => profiles.find((p) => p.id === id)?.full_name ?? "";
  const rolesOf = (id: string) => roles.filter((r) => r.user_id === id).map((r) => roleText[r.role] ?? r.role);
  const doneStatuses = ["completed", "reviewed"];
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "–";
  const revenue = bookings.filter((b) => doneStatuses.includes(b.status)).reduce((s, b) => s + b.price, 0);

  const stats = [
    { icon: ClipboardList, label: "Đơn hôm nay", value: bookings.filter((b) => b.service_date === today).length, tint: "bg-sky/60 text-sky-foreground" },
    { icon: Clock, label: "Đang chờ người dọn", value: bookings.filter((b) => b.status === "searching").length, tint: "bg-amber-100 text-amber-700" },
    { icon: PlayCircle, label: "Đang thực hiện", value: bookings.filter((b) => ["accepted", "in_progress", "photo_sent"].includes(b.status)).length, tint: "bg-indigo-100 text-indigo-700" },
    { icon: CheckCircle2, label: "Đã hoàn thành", value: bookings.filter((b) => doneStatuses.includes(b.status)).length, tint: "bg-mint/60 text-mint-foreground" },
    { icon: Users, label: "Người dùng", value: profiles.length, tint: "bg-primary/10 text-primary" },
    { icon: Star, label: "Đánh giá trung bình", value: `${avg}/5`, tint: "bg-yellow-100 text-yellow-700" },
    { icon: Wallet, label: "Doanh thu hoàn thành", value: formatVND(revenue), tint: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Bảng điều khiển CleanLink</h1>
            <p className="text-muted-foreground text-sm mt-1">Toàn bộ đơn, người dùng và đánh giá trên hệ thống.</p>
          </div>
          <Button asChild variant="outline"><Link to="/">Về trang chủ</Link></Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-card border border-border/60 p-5 shadow-card">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.tint}`}><s.icon className="h-4 w-4" /></div>
              <p className="mt-3 text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="mt-10">
          <TabsList>
            <TabsTrigger value="bookings">Đơn dọn ({bookings.length})</TabsTrigger>
            <TabsTrigger value="users">Người dùng ({profiles.length})</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Mã</TableHead><TableHead>Cơ sở</TableHead><TableHead>Chủ cơ sở</TableHead><TableHead>Khu vực</TableHead>
                  <TableHead className="text-right">Số phòng</TableHead><TableHead>Ngày / giờ</TableHead><TableHead>Trạng thái</TableHead>
                  <TableHead>Người dọn</TableHead><TableHead className="text-right">Giá</TableHead><TableHead />
                </TableRow></TableHeader>
                <TableBody>
                  {bookings.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Chưa có đơn nào.</TableCell></TableRow>}
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-xs">{b.code}</TableCell>
                      <TableCell><div className="font-medium">{b.property_name}</div><div className="text-xs text-muted-foreground">{b.address} · {b.phone}</div></TableCell>
                      <TableCell className="text-sm">{nameOf(b.host_id)}</TableCell>
                      <TableCell className="text-sm">{labelFrom(areas, b.area)}</TableCell>
                      <TableCell className="text-right font-semibold" title={serviceDetail(b.room_type)}>{parseServiceKey(b.room_type).serviceType === "lodging" ? b.rooms : "—"}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(b.service_date).toLocaleDateString("vi-VN")} · {labelFrom(timeSlots, b.time_slot)}
                        {b.urgency === "urgent" && <span className="ml-1 text-[10px] font-medium text-amber-700">GẤP</span>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className={statusColor[b.status as BookingStatus]}>{statusLabel[b.status as BookingStatus] ?? b.status}</Badge></TableCell>
                      <TableCell className="text-sm">{b.cleaner_name ?? <span className="text-muted-foreground italic">chưa gán</span>}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{formatVND(b.price)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {b.status === "pending" && (
                          <Button size="sm" className="mr-1" disabled={confirmingId === b.id} onClick={() => void confirmPayment(b.id)}>
                            {confirmingId === b.id ? "Đang xác nhận…" : "Xác nhận CK"}
                          </Button>
                        )}
                        <Button asChild size="sm" variant="ghost"><Link to="/don/$id" params={{ id: b.id }}>Xem</Link></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Họ tên</TableHead><TableHead>Số điện thoại</TableHead><TableHead>Vai trò</TableHead><TableHead>Cơ sở</TableHead><TableHead>Khu vực</TableHead><TableHead>Ngày tham gia</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell>{p.phone}</TableCell>
                      <TableCell className="space-x-1">{rolesOf(p.id).map((r) => <Badge key={r} variant="outline">{r}</Badge>)}</TableCell>
                      <TableCell className="text-sm">{p.property_name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{p.area ? labelFrom(areas, p.area) : "—"}</TableCell>
                      <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Mã đơn</TableHead><TableHead>Số sao</TableHead><TableHead>Nhận xét</TableHead><TableHead>Ngày</TableHead></TableRow></TableHeader>
                <TableBody>
                  {reviews.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Chưa có đánh giá.</TableCell></TableRow>}
                  {reviews.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{bookings.find((b) => b.id === r.booking_id)?.code ?? "—"}</TableCell>
                      <TableCell>{"★".repeat(r.rating)}</TableCell>
                      <TableCell className="text-sm">{r.comment ?? "—"}</TableCell>
                      <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
