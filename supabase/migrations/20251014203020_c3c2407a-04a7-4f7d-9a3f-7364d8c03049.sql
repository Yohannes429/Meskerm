-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Create enum for exam status
CREATE TYPE exam_status AS ENUM ('draft', 'published', 'archived');

-- Create enum for question types
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay');

-- Create profiles table for extended user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  grade_level INTEGER,
  section TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Teachers and admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  passing_marks INTEGER NOT NULL,
  status exam_status NOT NULL DEFAULT 'draft',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Exams policies
CREATE POLICY "Teachers can create exams"
  ON public.exams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can view their own exams"
  ON public.exams FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can view published exams"
  ON public.exams FOR SELECT
  USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Teachers can update their own exams"
  ON public.exams FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own exams"
  ON public.exams FOR DELETE
  USING (teacher_id = auth.uid());

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  marks INTEGER NOT NULL,
  options JSONB, -- For multiple choice: ["option1", "option2", "option3", "option4"]
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Questions policies
CREATE POLICY "Teachers can manage questions for their exams"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_id AND exams.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view questions for published exams"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_id AND exams.status = 'published'
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Create student_exams table (tracks exam attempts)
CREATE TABLE public.student_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score INTEGER,
  total_marks INTEGER NOT NULL,
  percentage DECIMAL(5,2),
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, graded
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, exam_id, started_at)
);

-- Enable RLS on student_exams
ALTER TABLE public.student_exams ENABLE ROW LEVEL SECURITY;

-- Student exams policies
CREATE POLICY "Students can create their own exam attempts"
  ON public.student_exams FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own exam attempts"
  ON public.student_exams FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can update their own exam attempts"
  ON public.student_exams FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view exam attempts for their exams"
  ON public.student_exams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_id AND exams.teacher_id = auth.uid()
    )
  );

-- Create student_answers table
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_exam_id UUID NOT NULL REFERENCES public.student_exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN,
  marks_awarded INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_exam_id, question_id)
);

-- Enable RLS on student_answers
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Student answers policies
CREATE POLICY "Students can manage their own answers"
  ON public.student_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.student_exams
      WHERE student_exams.id = student_exam_id AND student_exams.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers for their exams"
  ON public.student_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_exams se
      JOIN public.exams e ON se.exam_id = e.id
      WHERE se.id = student_exam_id AND e.teacher_id = auth.uid()
    )
  );

-- Create news_posts table
CREATE TABLE public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  category TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on news_posts
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

-- News posts policies
CREATE POLICY "Anyone can view published news"
  ON public.news_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Admins and teachers can manage news"
  ON public.news_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_posts_updated_at
  BEFORE UPDATE ON public.news_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();