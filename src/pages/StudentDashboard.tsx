import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Trophy, GraduationCap, Eye, Calendar, Megaphone } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementsList from "@/components/shared/AnnouncementsList";

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  status: string;
}

interface StudentExam {
  id: string;
  score: number | null;
  percentage: number | null;
  status: string;
  submitted_at: string | null;
  exam: Exam;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [myExams, setMyExams] = useState<StudentExam[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data: profileData } = await supabase
      .from("profiles" as any).select("*").eq("id", user.id).single();

    const role = (profileData as any)?.role || user.user_metadata?.role || "student";
    if (role !== "student") { navigate("/teacher-dashboard"); return; }

    setProfile(profileData || { full_name: user.user_metadata?.full_name, role });
    await fetchExams(user.id);
    setLoading(false);
  };

  const fetchExams = async (userId: string) => {
    const { data: examsData } = await supabase
      .from("exams" as any).select("*").eq("status", "published").order("created_at", { ascending: false });
    setAvailableExams((examsData as any) || []);

    const { data: studentExamsData } = await supabase
      .from("student_exams" as any).select("*, exam:exams(*)").eq("student_id", userId).order("created_at", { ascending: false });
    setMyExams((studentExamsData as any) || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Signed out successfully");
  };

  const startExam = async (examId: string, totalMarks: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if already started
    const existing = myExams.find((e) => e.exam?.id === examId && e.status === "in_progress");
    if (existing) {
      navigate(`/exam/${examId}/${existing.id}`);
      return;
    }

    const { data, error } = await supabase
      .from("student_exams" as any)
      .insert({ student_id: user.id, exam_id: examId, status: "in_progress", total_marks: totalMarks } as any)
      .select().single();

    if (error) { toast.error("Failed to start exam"); return; }
    navigate(`/exam/${examId}/${(data as any).id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  const completedExams = myExams.filter((e) => e.status === "completed");
  const averageScore = completedExams.length > 0
    ? completedExams.reduce((acc, e) => acc + (e.percentage || 0), 0) / completedExams.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navbar />
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name}</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{availableExams.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Trophy className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{completedExams.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Available Exams</TabsTrigger>
            <TabsTrigger value="results">My Results</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No exams available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availableExams.map((exam) => {
                  const taken = myExams.find((e) => e.exam?.id === exam.id);
                  return (
                    <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.subject}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{exam.duration_minutes} mins</div>
                          <div className="flex items-center gap-1"><Trophy className="h-4 w-4" />{exam.total_marks} marks</div>
                        </div>
                        {(exam as any).scheduled_start && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date((exam as any).scheduled_start).toLocaleString()} — {(exam as any).scheduled_end ? new Date((exam as any).scheduled_end).toLocaleString() : "Open"}
                          </div>
                        )}
                        <div className="flex gap-2">
                          {taken?.status === "completed" ? (
                            <>
                              <Button variant="outline" onClick={() => navigate(`/results/${taken.id}`)} className="flex-1">
                                <Eye className="h-4 w-4 mr-2" /> Results
                              </Button>
                              <Button variant="outline" onClick={() => navigate(`/leaderboard/${exam.id}`)} className="flex-1">
                                <Trophy className="h-4 w-4 mr-2" /> Leaderboard
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => startExam(exam.id, exam.total_marks)} className="w-full"
                              disabled={!!(exam as any).scheduled_start && new Date((exam as any).scheduled_start) > new Date()}
                            >
                              {(exam as any).scheduled_start && new Date((exam as any).scheduled_start) > new Date()
                                ? "Not Yet Available"
                                : taken?.status === "in_progress" ? "Continue Exam" : "Start Exam"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {completedExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed exams yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedExams.map((se) => {
                  const passed = (se.percentage || 0) >= 50;
                  return (
                    <Card key={se.id} className={`border-2 ${passed ? "border-secondary/30" : "border-destructive/30"}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{se.exam?.title}</CardTitle>
                            <CardDescription>{se.exam?.subject}</CardDescription>
                          </div>
                          <Badge variant={passed ? "default" : "destructive"}>{passed ? "Passed" : "Failed"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Score:</span>
                          <span className="font-semibold">{se.score}/{se.exam?.total_marks}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Percentage:</span>
                          <span className="font-semibold">{Number(se.percentage || 0).toFixed(1)}%</span>
                        </div>
                        <Button variant="outline" onClick={() => navigate(`/results/${se.id}`)} className="w-full">
                          <Eye className="h-4 w-4 mr-2" /> View Detailed Results
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
