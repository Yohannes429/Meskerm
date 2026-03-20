
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  subject TEXT NOT NULL,
  grade_level INTEGER NOT NULL DEFAULT 9,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks INTEGER NOT NULL DEFAULT 100,
  passing_marks INTEGER NOT NULL DEFAULT 50,
  instructions TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own exams" ON public.exams FOR ALL TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view published exams" ON public.exams FOR SELECT TO authenticated USING (status = 'published');

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB DEFAULT '[]',
  correct_answer TEXT DEFAULT '',
  marks INTEGER NOT NULL DEFAULT 1,
  explanation TEXT DEFAULT '',
  order_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage questions for own exams" ON public.questions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = questions.exam_id AND exams.teacher_id = auth.uid()));
CREATE POLICY "Students can view questions for published exams" ON public.questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = questions.exam_id AND exams.status = 'published'));

-- Create student_exams table
CREATE TABLE public.student_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  score INTEGER,
  percentage NUMERIC,
  total_marks INTEGER,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own exam attempts" ON public.student_exams FOR ALL TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view results for own exams" ON public.student_exams FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.exams WHERE exams.id = student_exams.exam_id AND exams.teacher_id = auth.uid()));

-- Create student_answers table
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_exam_id UUID REFERENCES public.student_exams(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT DEFAULT '',
  is_correct BOOLEAN,
  marks_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own answers" ON public.student_answers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.student_exams WHERE student_exams.id = student_answers.student_exam_id AND student_exams.student_id = auth.uid()));
CREATE POLICY "Teachers can view answers for own exams" ON public.student_answers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.student_exams JOIN public.exams ON exams.id = student_exams.exam_id WHERE student_exams.id = student_answers.student_exam_id AND exams.teacher_id = auth.uid()));
