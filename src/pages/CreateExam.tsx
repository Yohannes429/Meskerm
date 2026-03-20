import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer" | "essay";
  options: string[];
  correct_answer: string;
  marks: number;
  explanation?: string;
}

const CreateExam = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [loading, setLoading] = useState(false);
  
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    subject: "",
    grade_level: "",
    duration_minutes: "",
    total_marks: "",
    passing_marks: "",
    instructions: "",
  });

  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    checkAuth();
    if (examId) {
      loadExam();
    }
  }, [examId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles" as any)
      .select("role")
      .eq("id", session.user.id)
      .single();

    if ((profile as any)?.role === "student") {
      navigate("/student-dashboard");
    }
  };

  const loadExam = async () => {
    if (!examId) return;

    const { data: exam } = await supabase
      .from("exams" as any)
      .select("*")
      .eq("id", examId)
      .single();

    if (exam) {
      setExamData({
        title: exam.title,
        description: exam.description || "",
        subject: exam.subject,
        grade_level: exam.grade_level.toString(),
        duration_minutes: exam.duration_minutes.toString(),
        total_marks: exam.total_marks.toString(),
        passing_marks: exam.passing_marks.toString(),
        instructions: exam.instructions || "",
      });

      const { data: questionsData } = await supabase
        .from("questions" as any)
        .select("*")
        .eq("exam_id", examId)
        .order("order_number");

      if (questionsData) {
        setQuestions(questionsData.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options as string[] || [],
          correct_answer: q.correct_answer,
          marks: q.marks,
          explanation: q.explanation || "",
        })));
      }
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      question_text: "",
      question_type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      marks: 1,
      explanation: "",
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const saveExam = async (status: "draft" | "published") => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const examPayload = {
        ...examData,
        grade_level: parseInt(examData.grade_level),
        duration_minutes: parseInt(examData.duration_minutes),
        total_marks: parseInt(examData.total_marks),
        passing_marks: parseInt(examData.passing_marks),
        teacher_id: user.id,
        status,
      };

      let savedExamId = examId;

      if (examId) {
        await supabase
          .from("exams" as any)
          .update(examPayload)
          .eq("id", examId);
      } else {
        const { data: newExam, error } = await supabase
          .from("exams")
          .insert(examPayload)
          .select()
          .single();

        if (error) throw error;
        savedExamId = newExam.id;
      }

      // Delete existing questions if editing
      if (examId) {
        await supabase
          .from("questions")
          .delete()
          .eq("exam_id", examId);
      }

      // Insert questions
      const questionsPayload = questions.map((q, index) => ({
        exam_id: savedExamId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks,
        explanation: q.explanation,
        order_number: index + 1,
      }));

      await supabase.from("questions").insert(questionsPayload);

      toast.success(examId ? "Exam updated successfully" : "Exam created successfully");
      navigate("/teacher-dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to save exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/teacher-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{examId ? "Edit Exam" : "Create New Exam"}</CardTitle>
              <CardDescription>Fill in the exam details and add questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title</Label>
                  <Input
                    id="title"
                    value={examData.title}
                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                    placeholder="Mathematics Final Exam"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={examData.subject}
                    onChange={(e) => setExamData({ ...examData, subject: e.target.value })}
                    placeholder="Mathematics"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade_level">Grade Level</Label>
                  <Select
                    value={examData.grade_level}
                    onValueChange={(value) => setExamData({ ...examData, grade_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {[9, 10, 11, 12].map((grade) => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={examData.duration_minutes}
                    onChange={(e) => setExamData({ ...examData, duration_minutes: e.target.value })}
                    placeholder="60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_marks">Total Marks</Label>
                  <Input
                    id="total_marks"
                    type="number"
                    value={examData.total_marks}
                    onChange={(e) => setExamData({ ...examData, total_marks: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passing_marks">Passing Marks</Label>
                  <Input
                    id="passing_marks"
                    type="number"
                    value={examData.passing_marks}
                    onChange={(e) => setExamData({ ...examData, passing_marks: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={examData.description}
                  onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                  placeholder="Brief description of the exam"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={examData.instructions}
                  onChange={(e) => setExamData({ ...examData, instructions: e.target.value })}
                  placeholder="Instructions for students taking the exam"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Questions</h2>
            <Button onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>

          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea
                    value={question.question_text}
                    onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                    placeholder="Enter your question here"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={question.question_type}
                      onValueChange={(value) => updateQuestion(index, "question_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      value={question.marks}
                      onChange={(e) => updateQuestion(index, "marks", parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                </div>

                {question.question_type === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {question.options.map((option, optionIndex) => (
                      <Input
                        key={optionIndex}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...question.options];
                          newOptions[optionIndex] = e.target.value;
                          updateQuestion(index, "options", newOptions);
                        }}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input
                    value={question.correct_answer}
                    onChange={(e) => updateQuestion(index, "correct_answer", e.target.value)}
                    placeholder="Enter the correct answer"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={question.explanation}
                    onChange={(e) => updateQuestion(index, "explanation", e.target.value)}
                    placeholder="Explanation for the correct answer"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => saveExam("draft")}
              disabled={loading}
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => saveExam("published")}
              disabled={loading}
            >
              {loading ? "Saving..." : "Publish Exam"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateExam;
