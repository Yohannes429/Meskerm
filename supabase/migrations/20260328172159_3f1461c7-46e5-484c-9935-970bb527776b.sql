
-- Fix overly permissive INSERT policy on notifications
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;

-- Only allow inserting notifications for teachers/admins (they notify students)
-- or system-generated notifications
CREATE POLICY "Teachers and admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
    OR user_id = auth.uid()
  );
