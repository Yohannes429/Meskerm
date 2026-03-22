
-- Create news_posts table
CREATE TABLE public.news_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read published posts
CREATE POLICY "Anyone can view published posts" ON public.news_posts
  FOR SELECT TO authenticated
  USING (status = 'published');

-- Allow anonymous users to view published posts too
CREATE POLICY "Anon can view published posts" ON public.news_posts
  FOR SELECT TO anon
  USING (status = 'published');

-- Admins can do everything - check profile role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'admin'
  )
$$;

-- Admins can manage all posts
CREATE POLICY "Admins can manage posts" ON public.news_posts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to news-images bucket
CREATE POLICY "Authenticated users can upload news images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'news-images');

-- Allow public to view news images
CREATE POLICY "Public can view news images" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'news-images');

CREATE POLICY "Authenticated can view news images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'news-images');

-- Allow admins to delete news images
CREATE POLICY "Admins can delete news images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'news-images' AND public.is_admin(auth.uid()));
