import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ArrowLeft, Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface AnswerDetail {
  id: string;
  question_id: string;
  answer_text: string | null;
  is_correct: boolean | null;
  marks_awarded: number | null;
  question: {
    question_text: string;
    correct_answer: string | null;
    explanation: string | null;
    marks: number;
    options: any;
    question_type: string;
    order_number: number;
  };
}

const ExamResults = () => {
  const { studentExamId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    // Get student exam info
    const { data: seData } = await supabase
      .from("student_exams" as any)
      .select("*, exam:exams(*)")
      .eq("id", studentExamId)
      .single();

    if (!seData) { navigate("/student-dashboard"); return; }
    setExamInfo(seData);

    // Get answers with questions
    const { data: answersData } = await supabase
      .from("student_answers" as any)
      .select("*, question:questions(*)")
      .eq("student_exam_id", studentExamId)
      .order("created_at");

    setAnswers((answersData as any) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const exam = (examInfo as any)?.exam;
  const score = (examInfo as any)?.score || 0;
  const percentage = (examInfo as any)?.percentage || 0;
  const passed = percentage >= 50;

  // Sort answers by question order
  const sortedAnswers = [...answers].sort((a, b) => (a.question?.order_number || 0) - (b.question?.order_number || 0));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/student-dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        {/* Score Summary */}
        <Card className="mb-8 border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Trophy className={`h-16 w-16 ${passed ? "text-secondary" : "text-destructive"}`} />
            </div>
            <CardTitle className="text-2xl">{exam?.title}</CardTitle>
            <p className="text-muted-foreground">{exam?.subject} • Grade {exam?.grade_level}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-3xl font-bold">{score}/{exam?.total_marks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="text-3xl font-bold">{Number(percentage).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={passed ? "default" : "destructive"} className="text-lg px-4 py-1 mt-1">
                  {passed ? "PASSED" : "FAILED"}
                </Badge>
              </div>
            </div>
            <Progress value={Number(percentage)} className="mt-6 h-3" />
          </CardContent>
        </Card>

        {/* Questions Review */}
        <h2 className="text-xl font-bold mb-4">Question Review</h2>
        <div className="space-y-4">
          {sortedAnswers.map((answer, index) => {
            const q = answer.question;
            const isCorrect = answer.is_correct || (answer.answer_text?.toLowerCase().trim() === q?.correct_answer?.toLowerCase().trim());
            return (
              <Card key={answer.id} className={`border-2 ${isCorrect ? "border-secondary/50 bg-secondary/5" : "border-destructive/50 bg-destructive/5"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-secondary shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">Q{index + 1}. {q?.question_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{q?.marks} {q?.marks === 1 ? "mark" : "marks"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Show options for MC */}
                  {q?.question_type === "multiple_choice" && q.options && (
                    <div className="space-y-2">
                      {(q.options as string[]).map((opt: string, i: number) => {
                        const isStudentAnswer = answer.answer_text === opt;
                        const isCorrectAnswer = q.correct_answer === opt;
                        let optClass = "border rounded-lg px-3 py-2 text-sm";
                        if (isCorrectAnswer) optClass += " border-secondary bg-secondary/10 text-secondary-foreground font-medium";
                        else if (isStudentAnswer && !isCorrect) optClass += " border-destructive bg-destructive/10 line-through";
                        else optClass += " border-border";

                        return (
                          <div key={i} className={optClass}>
                            {isCorrectAnswer && <CheckCircle className="inline h-4 w-4 mr-1 text-secondary" />}
                            {isStudentAnswer && !isCorrectAnswer && <XCircle className="inline h-4 w-4 mr-1 text-destructive" />}
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* For non-MC questions */}
                  {q?.question_type !== "multiple_choice" && (
                    <div className="space-y-2">
                      <div className={`rounded-lg px-3 py-2 text-sm ${isCorrect ? "bg-secondary/10 border border-secondary" : "bg-destructive/10 border border-destructive"}`}>
                        <span className="font-medium">Your answer:</span> {answer.answer_text || "No answer"}
                      </div>
                      {!isCorrect && q?.correct_answer && (
                        <div className="rounded-lg px-3 py-2 text-sm bg-secondary/10 border border-secondary">
                          <span className="font-medium">Correct answer:</span> {q.correct_answer}
                        </div>
                      )}
                    </div>
                  )}

                  {q?.explanation && (
                    <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                      <span className="font-medium">Explanation:</span> {q.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExamResults;
