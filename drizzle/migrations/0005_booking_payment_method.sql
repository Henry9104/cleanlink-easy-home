-- Phương thức thanh toán duy nhất: chuyển khoản VietQR
ALTER TABLE public.bookings ADD COLUMN payment_method text NOT NULL DEFAULT 'bank_transfer';

-- Đơn mới có trạng thái 'pending' (chờ xác nhận chuyển khoản); admin xác nhận để chuyển sang 'searching'
CREATE POLICY "Admin can update bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
