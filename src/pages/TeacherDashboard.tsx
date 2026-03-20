import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  TrendingUp,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Exam {
  id: string;
  title: string;
  subject: string;
  grade_level: number;
  total_marks: number;
  duration_minutes: number;
  status: string;
  created_at: string;
}

interface StudentResult {
  id: string;
  student_id: string;
  score: number;
  percentage: number;
  status: string;
  profiles: {
    full_name: string;
  };
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", user.id)
      .single();

    const role = (profileData as any)?.role || user.user_metadata?.role || "student";

    if (role !== "teacher" && role !== "admin") {
      navigate("/student-dashboard");
      return;
    }

    setProfile(profileData || { full_name: user.user_metadata?.full_name, role });
    await fetchData(user.id);
    setLoading(false);
  };

  const fetchData = async (userId: string) => {
    // Fetch teacher's exams
    const { data: examsData } = await supabase
      .from("exams" as any)
      .select("*")
      .eq("teacher_id", userId)
      .order("created_at", { ascending: false });

    setExams((examsData as any) || []);

    // Fetch recent student results
    const { data: resultsData } = await supabase
      .from("student_exams" as any)
      .select(`
        id,
        student_id,
        score,
        percentage,
        status
      `)
      .eq("status", "completed")
      .order("submitted_at", { ascending: false })
      .limit(10);

    setStudentResults((resultsData as any) || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Signed out successfully");
  };

  const publishExam = async (examId: string) => {
    const { error } = await supabase
      .from("exams")
      .update({ status: "published" })
      .eq("id", examId);

    if (error) {
      toast.error("Failed to publish exam");
      return;
    }

    toast.success("Exam published successfully");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchData(user.id);
  };

  const deleteExam = async (examId: string) => {
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", examId);

    if (error) {
      toast.error("Failed to delete exam");
      return;
    }

    toast.success("Exam deleted successfully");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchData(user.id);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const publishedExams = exams.filter((e) => e.status === "published");
  const draftExams = exams.filter((e) => e.status === "draft");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Teacher Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/create-exam")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exams.length}</div>
              <p className="text-xs text-muted-foreground">All exams created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Eye className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publishedExams.length}</div>
              <p className="text-xs text-muted-foreground">Active exams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Edit className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftExams.length}</div>
              <p className="text-xs text-muted-foreground">Unpublished exams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentResults.length}</div>
              <p className="text-xs text-muted-foreground">Recent submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exams">My Exams</TabsTrigger>
            <TabsTrigger value="results">Student Results</TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="space-y-4">
            {exams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No exams created yet</p>
                  <Button onClick={() => navigate("/create-exam")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Exam
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription>
                            {exam.subject} • Grade {exam.grade_level} • {exam.duration_minutes} mins
                          </CardDescription>
                        </div>
                        <Badge
                          variant={exam.status === "published" ? "default" : "secondary"}
                        >
                          {exam.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Marks: {exam.total_marks}
                        </span>
                        <div className="flex gap-2">
                          {exam.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => publishExam(exam.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/exam/${exam.id}/edit`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this exam? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteExam(exam.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {studentResults.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No student submissions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {studentResults.map((result) => (
                  <Card key={result.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{result.profiles.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Score: {result.score} • {result.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={result.percentage >= 50 ? "default" : "destructive"}
                        >
                          {result.percentage >= 50 ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;
