
-- Add session control to exams
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS session_status text NOT NULL DEFAULT 'not_started';

-- Add live exam control fields to student_exams
ALTER TABLE public.student_exams ADD COLUMN IF NOT EXISTS tab_warnings integer NOT NULL DEFAULT 0;
ALTER TABLE public.student_exams ADD COLUMN IF NOT EXISTS is_disqualified boolean NOT NULL DEFAULT false;
ALTER TABLE public.student_exams ADD COLUMN IF NOT EXISTS raise_hand boolean NOT NULL DEFAULT false;
ALTER TABLE public.student_exams ADD COLUMN IF NOT EXISTS leave_requested boolean NOT NULL DEFAULT false;
ALTER TABLE public.student_exams ADD COLUMN IF NOT EXISTS leave_approved boolean DEFAULT null;

-- Enable realtime for student_exams and exams
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_exams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;
