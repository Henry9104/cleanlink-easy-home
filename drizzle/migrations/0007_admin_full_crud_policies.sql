-- Cho phép Admin toàn quyền Thêm / Sửa / Xóa trên bookings, profiles, user_roles, reviews
GRANT INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

-- Bookings: Admin INSERT & DELETE (UPDATE đã có ở 0006)
DROP POLICY IF EXISTS "Admin can insert bookings" ON public.bookings;
CREATE POLICY "Admin can insert bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can delete bookings" ON public.bookings;
CREATE POLICY "Admin can delete bookings" ON public.bookings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Admin INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
CREATE POLICY "Admin can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;
CREATE POLICY "Admin can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles: Admin INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Admin can manage user roles" ON public.user_roles;
CREATE POLICY "Admin can manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Reviews: Admin INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Admin can manage reviews" ON public.reviews;
CREATE POLICY "Admin can manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

