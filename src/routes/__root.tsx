import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Không tìm thấy trang</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang bạn đang tìm không tồn tại hoặc đã được chuyển đi.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Trang không tải được</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Có lỗi xảy ra. Vui lòng thử làm mới hoặc quay lại trang chủ.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cleanlink – Đặt lịch dọn dẹp dễ dàng, nhà sạch chỉ sau vài giờ" },
      {
        name: "description",
        content:
          "Cleanlink kết nối bạn với cộng tác viên vệ sinh đã được xác minh. Đặt lịch dọn dẹp nhà theo giờ, tổng vệ sinh, vệ sinh văn phòng chỉ trong 60 giây.",
      },
      { name: "keywords", content: "dịch vụ dọn dẹp nhà, đặt lịch dọn dẹp, dọn dẹp theo giờ, tổng vệ sinh nhà, vệ sinh văn phòng, Cleanlink" },
      { property: "og:title", content: "Cleanlink – Đặt lịch dọn dẹp dễ dàng, nhà sạch chỉ sau vài giờ" },
      { property: "og:description", content: "Cleanlink kết nối bạn với cộng tác viên vệ sinh đã được xác minh. Đặt lịch dọn dẹp nhà theo giờ, tổng vệ sinh, vệ sinh văn phòng chỉ trong 60 giây." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cleanlink – Đặt lịch dọn dẹp dễ dàng, nhà sạch chỉ sau vài giờ" },
      { name: "twitter:description", content: "Cleanlink kết nối bạn với cộng tác viên vệ sinh đã được xác minh. Đặt lịch dọn dẹp nhà theo giờ, tổng vệ sinh, vệ sinh văn phòng chỉ trong 60 giây." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/743b0ed4-b803-477b-b163-24fc85ce8bd9/id-preview-3bf08b27--8755f2b4-3e91-4add-b278-6cea9f0105c6.lovable.app-1783506208058.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/743b0ed4-b803-477b-b163-24fc85ce8bd9/id-preview-3bf08b27--8755f2b4-3e91-4add-b278-6cea9f0105c6.lovable.app-1783506208058.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
