-- Bổ sung cột lưu cấu trúc phân chia doanh thu (Người dọn 88% | CleanLink 12%) trên bảng bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cleaner_amount integer NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_fee integer NOT NULL DEFAULT 0;

-- Cập nhật các đơn hiện có theo tỷ lệ 88% / 12%
UPDATE public.bookings
SET
  cleaner_amount = ROUND(COALESCE(price, 0) * 0.88)::integer,
  platform_fee = COALESCE(price, 0) - ROUND(COALESCE(price, 0) * 0.88)::integer
WHERE cleaner_amount = 0 AND platform_fee = 0 AND COALESCE(price, 0) > 0;

