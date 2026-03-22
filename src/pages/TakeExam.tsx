import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  marks: number;
  order_number: number;
  correct_answer: string | null;
}

const TakeExam = () => {
  const navigate = useNavigate();
  const { examId, studentExamId } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadExamData(); }, []);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) { submitExam(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const loadExamData = async () => {
    try {
      const { data: examData } = await supabase.from("exams" as any).select("*").eq("id", examId).single();
      if (examData) { setExam(examData); setTimeRemaining((examData as any).duration_minutes * 60); }

      const { data: questionsData } = await supabase.from("questions" as any).select("*").eq("exam_id", examId).order("order_number");
      if (questionsData) setQuestions(questionsData as any);

      const { data: existingAnswers } = await supabase.from("student_answers" as any).select("question_id, answer_text").eq("student_exam_id", studentExamId);
      if (existingAnswers) {
        const answersMap: Record<string, string> = {};
        (existingAnswers as any[]).forEach((a) => { answersMap[a.question_id] = a.answer_text; });
        setAnswers(answersMap);
      }
    } catch { toast.error("Failed to load exam"); navigate("/student-dashboard"); }
    finally { setLoading(false); }
  };

  const handleAnswerChange = (qId: string, answer: string) => setAnswers({ ...answers, [qId]: answer });

  const submitExam = async () => {
    setSubmitting(true);
    try {
      // Calculate score
      let totalScore = 0;
      const answersToSubmit = questions.map((q) => {
        const studentAnswer = answers[q.id] || "";
        const isCorrect = q.correct_answer ? studentAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim() : false;
        if (isCorrect) totalScore += q.marks;
        return {
          student_exam_id: studentExamId,
          question_id: q.id,
          answer_text: studentAnswer,
          is_correct: isCorrect,
          marks_awarded: isCorrect ? q.marks : 0,
        };
      });

      await supabase.from("student_answers" as any).delete().eq("student_exam_id", studentExamId);
      await supabase.from("student_answers" as any).insert(answersToSubmit as any);

      const percentage = exam?.total_marks ? (totalScore / exam.total_marks) * 100 : 0;
      await supabase.from("student_exams" as any)
        .update({ status: "completed", score: totalScore, percentage, submitted_at: new Date().toISOString() })
        .eq("id", studentExamId);

      toast.success("Exam submitted successfully!");
      navigate(`/results/${studentExamId}`);
    } catch { toast.error("Failed to submit exam"); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
      </div>
    );
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 sticky top-0 bg-background z-10 pb-4 border-b">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">{exam?.title}</h1>
              <p className="text-muted-foreground">{exam?.subject} • Grade {exam?.grade_level}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5" />
                <span className={timeRemaining < 300 ? "text-destructive" : ""}>{formatTime(timeRemaining)}</span>
              </div>
              <Button onClick={submitExam} disabled={submitting}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{answeredCount} of {questions.length} answered</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id} className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Question {index + 1} ({question.marks} {question.marks === 1 ? "mark" : "marks"})</CardTitle>
                <CardDescription className="text-base mt-2 whitespace-pre-wrap">{question.question_text}</CardDescription>
              </CardHeader>
              <CardContent>
                {question.question_type === "multiple_choice" && question.options && (
                  <RadioGroup value={answers[question.id] || ""} onValueChange={(v) => handleAnswerChange(question.id, v)}>
                    {question.options.map((opt: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2 mb-3">
                        <RadioGroupItem value={opt} id={`${question.id}-${i}`} />
                        <Label htmlFor={`${question.id}-${i}`} className="cursor-pointer text-base font-normal">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {question.question_type === "true_false" && (
                  <RadioGroup value={answers[question.id] || ""} onValueChange={(v) => handleAnswerChange(question.id, v)}>
                    {["True", "False"].map((v) => (
                      <div key={v} className="flex items-center space-x-2 mb-3">
                        <RadioGroupItem value={v} id={`${question.id}-${v}`} />
                        <Label htmlFor={`${question.id}-${v}`} className="cursor-pointer text-base font-normal">{v}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {question.question_type === "short_answer" && (
                  <Textarea value={answers[question.id] || ""} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="Type your answer..." rows={4} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button size="lg" onClick={submitExam} disabled={submitting}>
            <CheckCircle className="mr-2 h-5 w-5" /> {submitting ? "Submitting..." : "Submit Exam"}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TakeExam;
