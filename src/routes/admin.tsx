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
import { Badge } from "@/components/ui/badge";
import {
  sampleBookings,
  statusLabel,
  statusColor,
  formatVND,
  areas,
  timeSlots,
  labelFrom,
  services,
} from "@/lib/cleanlink-data";
import {
  ClipboardList,
  Clock,
  PlayCircle,
  CheckCircle2,
  Users,
  Star,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Quản trị – CleanLink" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

const stats = [
  { icon: ClipboardList, label: "Đơn hôm nay", value: "12", tint: "bg-sky/60 text-sky-foreground" },
  { icon: Clock, label: "Đang chờ người dọn", value: "3", tint: "bg-amber-100 text-amber-700" },
  { icon: PlayCircle, label: "Đang thực hiện", value: "2", tint: "bg-indigo-100 text-indigo-700" },
  { icon: CheckCircle2, label: "Đã hoàn thành", value: "8", tint: "bg-mint/60 text-mint-foreground" },
  { icon: Users, label: "Người dọn hoạt động", value: "18", tint: "bg-primary/10 text-primary" },
  { icon: Star, label: "Đánh giá trung bình", value: "4.8/5", tint: "bg-yellow-100 text-yellow-700" },
  { icon: Wallet, label: "Doanh thu hôm nay", value: "4.250.000đ", tint: "bg-emerald-100 text-emerald-700" },
];

function AdminPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Bảng điều khiển CleanLink</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Điều phối đơn dọn phòng homestay/mini hotel tại Quy Nhơn – cập nhật {new Date().toLocaleDateString("vi-VN")}.
            </p>
          </div>
          <Button asChild variant="outline"><Link to="/">Về trang chủ</Link></Button>
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

        <div className="mt-10 rounded-2xl bg-card border border-border/60 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <h2 className="font-semibold">Danh sách đơn hôm nay</h2>
            <span className="text-xs text-muted-foreground">{sampleBookings.length} đơn</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Cơ sở</TableHead>
                  <TableHead>Khu vực</TableHead>
                  <TableHead className="text-right">Số phòng</TableHead>
                  <TableHead>Khung giờ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người dọn</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleBookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{b.propertyName}</div>
                      <div className="text-xs text-muted-foreground">{b.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm">{labelFrom(areas, b.area)}</TableCell>
                    <TableCell className="text-right font-semibold">{b.rooms}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {labelFrom(timeSlots, b.timeSlot)}
                      {b.urgency === "urgent" && (
                        <span className="ml-1 text-[10px] font-medium text-amber-700">GẤP</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor[b.status]} variant="outline">
                        {statusLabel[b.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{b.cleaner ?? <span className="text-muted-foreground italic">chưa gán</span>}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatVND(b.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {services.slice(0, 3).map((s) => (
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
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
