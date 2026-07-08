import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import {
  getBookings,
  getPartners,
  updateBookingStatus,
  statusLabel,
  services,
  type Booking,
  type Partner,
} from "@/lib/cleanlink-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Quản trị – Cleanlink" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const statusColor: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  function refresh() {
    setBookings(getBookings());
    setPartners(getPartners());
  }

  useEffect(() => {
    refresh();
  }, []);

  function changeStatus(id: string, status: Booking["status"]) {
    updateBookingStatus(id, status);
    refresh();
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    inProgress: bookings.filter((b) => b.status === "in_progress" || b.status === "confirmed").length,
    done: bookings.filter((b) => b.status === "done").length,
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Bảng điều khiển</h1>
            <p className="text-muted-foreground text-sm mt-1">Quản lý lịch đặt, cộng tác viên và dịch vụ Cleanlink.</p>
          </div>
          <Button asChild variant="outline"><Link to="/">Về trang chủ</Link></Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Tổng lịch đặt", value: stats.total },
            { label: "Chờ xác nhận", value: stats.pending },
            { label: "Đang thực hiện", value: stats.inProgress },
            { label: "Hoàn thành", value: stats.done },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card border border-border/60 p-5 shadow-card">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="mt-10">
          <TabsList>
            <TabsTrigger value="bookings">Lịch đặt</TabsTrigger>
            <TabsTrigger value="partners">Cộng tác viên</TabsTrigger>
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Dịch vụ</TableHead>
                    <TableHead>Lịch hẹn</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        Chưa có lịch đặt nào. <Link to="/dat-lich" className="text-primary underline">Tạo lịch mẫu</Link>
                      </TableCell>
                    </TableRow>
                  )}
                  {bookings.map((b) => {
                    const svc = services.find((s) => s.slug === b.service)?.name || b.service;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{b.name}</div>
                          <div className="text-xs text-muted-foreground">{b.phone}</div>
                        </TableCell>
                        <TableCell className="text-sm">{svc}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {b.date} · {b.time} <div className="text-xs text-muted-foreground">{b.hours} giờ</div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[220px] truncate">{b.address}</TableCell>
                        <TableCell>
                          <Badge className={statusColor[b.status]} variant="outline">
                            {statusLabel[b.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select value={b.status} onValueChange={(v) => changeStatus(b.id, v as Booking["status"])}>
                            <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabel).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="partners" className="mt-6">
            <div className="rounded-2xl bg-card border border-border/60 shadow-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Khu vực</TableHead>
                    <TableHead>Thời gian rảnh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        Chưa có đăng ký cộng tác viên.
                      </TableCell>
                    </TableRow>
                  )}
                  {partners.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.id}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.phone}</TableCell>
                      <TableCell>{p.area}</TableCell>
                      <TableCell className="text-sm">{p.availability || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <div key={s.slug} className="rounded-2xl bg-card border border-border/60 p-5 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-mint/50 text-mint-foreground flex items-center justify-center">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.price}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground line-clamp-3">{s.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
