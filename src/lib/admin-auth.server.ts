import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Lỗi có mã HTTP – dùng để trả đúng status cho API */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
  console.error("[api]", err);
  const message =
    err && typeof err === "object" && "message" in err && typeof err.message === "string"
      ? err.message
      : "Lỗi máy chủ";
  return jsonResponse({ error: message }, 500);
}

async function authenticateBearer(request: Request) {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new HttpError(500, "Thiếu cấu hình Supabase trên máy chủ");

  const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token || token.split(".").length !== 3) {
    throw new HttpError(401, "Chưa đăng nhập hoặc phiên đã hết hạn");
  }

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) throw new HttpError(401, "Chưa đăng nhập hoặc phiên đã hết hạn");

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (roleError) throw roleError;

  const roleList = (roles ?? []).map((r) => r.role);
  return { supabase, userId, roleList };
}

/**
 * Middleware xác thực cho API Admin:
 *  1. Có header `Authorization: Bearer <access_token>` hợp lệ (401 nếu không)
 *  2. Người dùng có role `admin` trong bảng user_roles (403 nếu không)
 */
export async function requireAdmin(request: Request) {
  const { supabase, userId, roleList } = await authenticateBearer(request);
  if (!roleList.includes("admin")) {
    throw new HttpError(403, "Chỉ quản trị viên mới được phép thực hiện thao tác này");
  }
  return { supabase, userId };
}

/**
 * Middleware xác thực cho API Người dọn (Cleaner):
 *  1. Có header `Authorization: Bearer <access_token>` hợp lệ
 *  2. Người dùng có role `cleaner` (hoặc `admin`)
 *  3. Trả kèm thông tin hồ sơ (full_name, area) của người dọn
 */
export async function requireCleaner(request: Request) {
  const { supabase, userId, roleList } = await authenticateBearer(request);
  if (!roleList.includes("cleaner") && !roleList.includes("admin")) {
    throw new HttpError(403, "Chỉ tài khoản người dọn mới được phép thực hiện thao tác này");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, area")
    .eq("id", userId)
    .maybeSingle();

  return {
    supabase,
    userId,
    fullName: profile?.full_name || "Người dọn CleanLink",
    area: profile?.area ?? null,
  };
}
