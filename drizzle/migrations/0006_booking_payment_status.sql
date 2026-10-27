-- Đảm bảo cột payment_method và quyền UPDATE của admin luôn tồn tại
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'bank_transfer';

DROP POLICY IF EXISTS "Admin can update bookings" ON public.bookings;
CREATE POLICY "Admin can update bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trạng thái thanh toán tách riêng khỏi trạng thái đơn:
--   payment_status: 'pending' (chờ xác nhận tiền) | 'paid' (đã thanh toán)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_confirmed_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('pending', 'paid'));
  END IF;
END $$;

-- Đơn cũ đã qua bước chờ xác nhận được đánh dấu là đã thanh toán
UPDATE public.bookings
  SET payment_status = 'paid', paid_at = COALESCE(paid_at, created_at)
  WHERE status NOT IN ('pending', 'cancelled') AND payment_status <> 'paid';

CREATE INDEX IF NOT EXISTS bookings_payment_idx ON public.bookings (payment_status, created_at DESC);
