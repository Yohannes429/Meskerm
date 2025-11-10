import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, Clock, CheckCircle, TrendingUp, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Exam {
  id: string;
  title: string;
  subject: string;
  grade_level: number;
  total_marks: number;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  status: string;
}

interface StudentExam {
  id: string;
  exam_id: string;
  score: number | null;
  percentage: number | null;
  status: string;
  started_at: string;
  submitted_at: string | null;
  exams: {
    title: string;
    subject: string;
    total_marks: number;
  };
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [myExams, setMyExams] = useState<StudentExam[]>([]);
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

    if (profileData?.role !== "student") {
      navigate("/teacher-dashboard");
      return;
    }

    setProfile(profileData);
    fetchExams();
    fetchMyExams();
    setLoading(false);
  };

  const fetchExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (data) setAvailableExams(data);
  };

  const fetchMyExams = async () => {
    const { data } = await supabase
      .from("student_exams")
      .select(`
        *,
        exams (title, subject, total_marks)
      `)
      .order("started_at", { ascending: false });

    if (data) setMyExams(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const startExam = async (examId: string) => {
    const { data, error } = await supabase
      .from("student_exams")
      .insert({
        exam_id: examId,
        student_id: user.id,
        total_marks: 0,
        status: "in_progress"
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to start exam");
    } else {
      toast.success("Exam started!");
      navigate(`/exam/${examId}/${data.id}`);
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

  const completedExams = myExams.filter(e => e.status === "completed");
  const inProgressExams = myExams.filter(e => e.status === "in_progress");
  const averageScore = completedExams.length > 0
    ? (completedExams.reduce((sum, e) => sum + (e.percentage || 0), 0) / completedExams.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {profile?.full_name}!
            </h1>
            <p className="text-muted-foreground">
              {profile?.grade_level && `Grade ${profile.grade_level}`} Student Dashboard
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Exams</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableExams.length}</div>
              <p className="text-xs text-muted-foreground">Ready to take</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedExams.length}</div>
              <p className="text-xs text-muted-foreground">Exams finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}%</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Available Exams</TabsTrigger>
            <TabsTrigger value="results">My Results</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableExams.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No exams available at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availableExams.map((exam) => (
                  <Card key={exam.id} className="border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {exam.subject} • Grade {exam.grade_level}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{exam.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          {exam.duration_minutes} minutes
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Total Marks: {exam.total_marks}
                        </div>
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                          onClick={() => startExam(exam.id)}
                        >
                          Start Exam
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {myExams.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No exam results yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{exam.exams.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {exam.exams.subject}
                          </CardDescription>
                        </div>
                        <Badge variant={exam.status === "completed" ? "default" : "secondary"}>
                          {exam.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {exam.status === "completed" ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">
                              {exam.score}/{exam.exams.total_marks}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {exam.percentage?.toFixed(1)}%
                            </p>
                          </div>
                          <Button variant="outline">View Details</Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => navigate(`/exam/${exam.exam_id}/${exam.id}`)}
                        >
                          Continue Exam
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
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
