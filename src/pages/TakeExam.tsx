import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Clock, CheckCircle, Hand, DoorOpen, AlertTriangle, Pause, ShieldAlert } from "lucide-react";
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
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Live control state
  const [sessionStatus, setSessionStatus] = useState("not_started");
  const [tabWarnings, setTabWarnings] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [leaveRequested, setLeaveRequested] = useState(false);
  const [leaveApproved, setLeaveApproved] = useState<boolean | null>(null);
  const [handRaised, setHandRaised] = useState(false);

  const tabWarningsRef = useRef(0);

  useEffect(() => { loadExamData(); }, []);

  // Timer - only runs when session is active
  useEffect(() => {
    if (timeRemaining > 0 && sessionStatus === "active" && !isDisqualified) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) { submitExam(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, sessionStatus, isDisqualified]);

  // Real-time: listen to exam session status changes
  useEffect(() => {
    if (!examId) return;
    const channel = supabase
      .channel(`exam-session-${examId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "exams", filter: `id=eq.${examId}` }, (payload: any) => {
        const newStatus = payload.new?.session_status;
        if (newStatus) {
          setSessionStatus(newStatus);
          if (newStatus === "paused") toast.info("Exam has been paused by the teacher");
          if (newStatus === "active" && sessionStatus === "paused") toast.success("Exam has been resumed");
          if (newStatus === "ended") {
            toast.warning("Exam has been ended by the teacher");
            submitExam();
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [examId, sessionStatus]);

  // Real-time: listen to own student_exam changes (leave approval)
  useEffect(() => {
    if (!studentExamId) return;
    const channel = supabase
      .channel(`student-exam-${studentExamId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "student_exams", filter: `id=eq.${studentExamId}` }, (payload: any) => {
        const d = payload.new;
        if (d?.leave_approved === true) {
          setLeaveApproved(true);
          setLeaveRequested(false);
          toast.success("Your leave request has been approved. You may submit your exam.");
        } else if (d?.leave_approved === false) {
          setLeaveApproved(false);
          setLeaveRequested(false);
          toast.error("Your leave request was denied. Please continue the exam.");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [studentExamId]);

  // Anti-cheat: detect tab/page visibility changes
  useEffect(() => {
    if (isDisqualified || sessionStatus !== "active") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabWarningsRef.current + 1;
        tabWarningsRef.current = newCount;
        setTabWarnings(newCount);

        // Update in DB
        supabase.from("student_exams" as any)
          .update({ tab_warnings: newCount, is_disqualified: newCount >= 3 } as any)
          .eq("id", studentExamId)
          .then();

        if (newCount >= 3) {
          setIsDisqualified(true);
          toast.error("You have been disqualified for leaving the exam page 3 times!");
          submitExam();
        } else {
          toast.warning(`Warning ${newCount}/3: Do not leave the exam page! ${3 - newCount} warnings remaining.`);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isDisqualified, sessionStatus, studentExamId]);

  const loadExamData = async () => {
    try {
      const { data: examData } = await supabase.from("exams" as any).select("*").eq("id", examId).single();
      if (examData) {
        setExam(examData);
        setTimeRemaining((examData as any).duration_minutes * 60);
        setSessionStatus((examData as any).session_status || "not_started");
      }

      const { data: questionsData } = await supabase.from("questions" as any).select("*").eq("exam_id", examId).order("order_number");
      if (questionsData) setQuestions(questionsData as any);

      const { data: seData } = await supabase.from("student_exams" as any).select("*").eq("id", studentExamId).single();
      if (seData) {
        const se = seData as any;
        setTabWarnings(se.tab_warnings || 0);
        tabWarningsRef.current = se.tab_warnings || 0;
        setIsDisqualified(se.is_disqualified || false);
        setHandRaised(se.raise_hand || false);
        setLeaveRequested(se.leave_requested || false);
        setLeaveApproved(se.leave_approved);
      }

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

  const toggleRaiseHand = async () => {
    const newVal = !handRaised;
    setHandRaised(newVal);
    await supabase.from("student_exams" as any).update({ raise_hand: newVal } as any).eq("id", studentExamId);
    toast.info(newVal ? "Hand raised — teacher has been notified" : "Hand lowered");
  };

  const requestLeave = async () => {
    setLeaveRequested(true);
    await supabase.from("student_exams" as any).update({ leave_requested: true, leave_approved: null } as any).eq("id", studentExamId);
    toast.info("Leave request sent to teacher. Please wait for approval.");
  };

  const submitExam = async () => {
    setSubmitting(true);
    try {
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
        .update({ status: "completed", score: totalScore, percentage, submitted_at: new Date().toISOString(), raise_hand: false, leave_requested: false })
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
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const canSubmit = leaveApproved === true || sessionStatus === "ended";

  // Disqualified screen
  if (isDisqualified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-8 text-center">
            <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold text-destructive mb-2">Disqualified</h2>
            <p className="text-muted-foreground mb-6">
              You have been disqualified from this exam for leaving the page 3 times. Your answers have been submitted automatically.
            </p>
            <Button onClick={() => navigate("/student-dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting / Paused screen
  if (sessionStatus === "not_started" || sessionStatus === "paused") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-8 text-center">
              <Pause className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {sessionStatus === "not_started" ? "Waiting for Teacher" : "Exam Paused"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {sessionStatus === "not_started"
                  ? "The teacher hasn't started this exam yet. Please wait..."
                  : "The teacher has paused the exam. Please wait for it to resume."}
              </p>
              <div className="animate-pulse flex justify-center">
                <div className="h-2 w-24 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        {/* Sticky Header */}
        <div className="mb-6 sticky top-0 bg-background z-10 pb-4 border-b">
          {/* Anti-cheat warnings banner */}
          {tabWarnings > 0 && (
            <div className="mb-3 p-2 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">
                Tab switch warnings: {tabWarnings}/3 — Do NOT leave this page!
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">{exam?.title}</h1>
              <p className="text-sm text-muted-foreground">{exam?.subject} • Grade {exam?.grade_level}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-lg font-semibold">
                <Clock className="h-5 w-5" />
                <span className={timeRemaining < 300 ? "text-destructive animate-pulse" : ""}>{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{answeredCount}/{questions.length} answered ({progressPercent.toFixed(0)}%)</span>
            </div>
            <Progress value={progressPercent} />
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={handRaised ? "default" : "outline"}
              onClick={toggleRaiseHand}
              className={handRaised ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
            >
              <Hand className="h-4 w-4 mr-1" /> {handRaised ? "Lower Hand" : "Raise Hand"}
            </Button>

            {!leaveRequested && leaveApproved !== true && (
              <Button size="sm" variant="outline" onClick={requestLeave}>
                <DoorOpen className="h-4 w-4 mr-1" /> Request Leave
              </Button>
            )}
            {leaveRequested && (
              <Badge className="bg-orange-500 text-white">Leave Requested — Waiting...</Badge>
            )}
            {leaveApproved === true && (
              <Badge className="bg-green-600 text-white">Leave Approved</Badge>
            )}

            <div className="ml-auto">
              <Button
                size="sm"
                onClick={submitExam}
                disabled={submitting || (!canSubmit && sessionStatus === "active")}
                title={!canSubmit && sessionStatus === "active" ? "You need teacher approval to submit early" : ""}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {submitting ? "Submitting..." : "Submit Exam"}
              </Button>
            </div>
          </div>
        </div>

        {/* Question Navigation dots */}
        <div className="flex flex-wrap gap-2 mb-6">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(i)}
              className={`h-8 w-8 rounded-full text-xs font-medium border-2 transition-all ${
                currentQuestion === i
                  ? "bg-primary text-primary-foreground border-primary"
                  : answers[q.id]
                  ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-muted border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current Question */}
        {questions.length > 0 && (
          <Card className="border-2 mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Question {currentQuestion + 1} ({questions[currentQuestion].marks} {questions[currentQuestion].marks === 1 ? "mark" : "marks"})
              </CardTitle>
              <CardDescription className="text-base mt-2 whitespace-pre-wrap">
                {questions[currentQuestion].question_text}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questions[currentQuestion].question_type === "multiple_choice" && questions[currentQuestion].options && (
                <RadioGroup
                  value={answers[questions[currentQuestion].id] || ""}
                  onValueChange={(v) => handleAnswerChange(questions[currentQuestion].id, v)}
                >
                  {(questions[currentQuestion].options as string[]).map((opt: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value={opt} id={`${questions[currentQuestion].id}-${i}`} />
                      <Label htmlFor={`${questions[currentQuestion].id}-${i}`} className="cursor-pointer text-base font-normal">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {questions[currentQuestion].question_type === "true_false" && (
                <RadioGroup
                  value={answers[questions[currentQuestion].id] || ""}
                  onValueChange={(v) => handleAnswerChange(questions[currentQuestion].id, v)}
                >
                  {["True", "False"].map((v) => (
                    <div key={v} className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value={v} id={`${questions[currentQuestion].id}-${v}`} />
                      <Label htmlFor={`${questions[currentQuestion].id}-${v}`} className="cursor-pointer text-base font-normal">{v}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {questions[currentQuestion].question_type === "short_answer" && (
                <Textarea
                  value={answers[questions[currentQuestion].id] || ""}
                  onChange={(e) => handleAnswerChange(questions[currentQuestion].id, e.target.value)}
                  placeholder="Type your answer..."
                  rows={4}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion((p) => p + 1)}>Next</Button>
          ) : (
            <Button
              onClick={submitExam}
              disabled={submitting || (!canSubmit && sessionStatus === "active")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {submitting ? "Submitting..." : "Submit Exam"}
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TakeExam;
