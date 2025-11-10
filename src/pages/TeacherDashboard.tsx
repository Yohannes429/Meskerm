import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, Users, FileText, TrendingUp, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";

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

interface StudentExamResult {
  id: string;
  student_id: string;
  score: number | null;
  percentage: number | null;
  status: string;
  profiles: {
    full_name: string;
    grade_level: number;
  };
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myExams, setMyExams] = useState<Exam[]>([]);
  const [studentResults, setStudentResults] = useState<StudentExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData?.role === "student") {
      navigate("/student-dashboard");
      return;
    }

    setProfile(profileData);
    fetchMyExams();
    fetchStudentResults();
    setLoading(false);
  };

  const fetchMyExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setMyExams(data);
  };

  const fetchStudentResults = async () => {
    const { data } = await supabase
      .from("student_exams")
      .select(`
        id,
        student_id,
        score,
        percentage,
        status,
        profiles (full_name, grade_level)
      `)
      .eq("status", "completed")
      .order("submitted_at", { ascending: false })
      .limit(10);

    if (data) setStudentResults(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const deleteExam = async (examId: string) => {
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", examId);

    if (error) {
      toast.error("Failed to delete exam");
    } else {
      toast.success("Exam deleted successfully");
      fetchMyExams();
    }
  };

  const publishExam = async (examId: string) => {
    const { error } = await supabase
      .from("exams")
      .update({ status: "published" })
      .eq("id", examId);

    if (error) {
      toast.error("Failed to publish exam");
    } else {
      toast.success("Exam published successfully");
      fetchMyExams();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const publishedExams = myExams.filter(e => e.status === "published");
  const draftExams = myExams.filter(e => e.status === "draft");
  const totalStudents = new Set(studentResults.map(r => r.student_id)).size;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Teacher Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome, {profile?.full_name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/create-exam")} className="flex-1 sm:flex-none">
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="flex-1 sm:flex-none">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myExams.length}</div>
              <p className="text-xs text-muted-foreground">All exams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publishedExams.length}</div>
              <p className="text-xs text-muted-foreground">Live exams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
            {myExams.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">No exams created yet</p>
                  <Button onClick={() => navigate("/create-exam")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Exam
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myExams.map((exam) => (
                  <Card key={exam.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {exam.subject} • Grade {exam.grade_level}
                          </CardDescription>
                        </div>
                        <Badge variant={exam.status === "published" ? "default" : "secondary"}>
                          {exam.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          Duration: {exam.duration_minutes} min • Marks: {exam.total_marks}
                        </div>
                        <div className="flex gap-2">
                          {exam.status === "draft" && (
                            <Button 
                              size="sm"
                              onClick={() => publishExam(exam.id)}
                            >
                              Publish
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/exam/${exam.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteExam(exam.id)}
                          >
                            Delete
                          </Button>
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
                <CardContent className="py-8 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No student submissions yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Latest student exam results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {studentResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <p className="font-medium">{result.profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Grade {result.profiles.grade_level}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {result.percentage?.toFixed(1)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {result.score} marks
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default TeacherDashboard;
