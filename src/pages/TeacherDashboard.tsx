import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BookOpen, Users, TrendingUp, LogOut, Plus, Edit, Trash2, Eye, GraduationCap, Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Exam {
  id: string;
  title: string;
  subject: string;
  grade_level: number;
  total_marks: number;
  passing_marks: number;
  duration_minutes: number;
  status: string;
  created_at: string;
}

interface StudentResult {
  id: string;
  student_id: string;
  score: number | null;
  percentage: number | null;
  status: string;
  submitted_at: string | null;
  exam_id: string;
  exam_title?: string;
  exam_subject?: string;
  student_name?: string;
  student_email?: string;
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterExam, setFilterExam] = useState("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data: profileData } = await supabase
      .from("profiles" as any).select("*").eq("id", user.id).single();

    const role = (profileData as any)?.role || user.user_metadata?.role || "student";
    if (role !== "teacher" && role !== "admin") { navigate("/student-dashboard"); return; }

    setProfile(profileData || { full_name: user.user_metadata?.full_name, role });
    await fetchData(user.id);
    setLoading(false);
  };

  const fetchData = async (userId: string) => {
    const { data: examsData } = await supabase
      .from("exams" as any).select("*").eq("teacher_id", userId).order("created_at", { ascending: false });
    const examsList = (examsData as any) || [];
    setExams(examsList);

    // Fetch student results for teacher's exams
    const examIds = examsList.map((e: Exam) => e.id);
    if (examIds.length > 0) {
      const { data: resultsData } = await supabase
        .from("student_exams" as any)
        .select("*")
        .in("exam_id", examIds)
        .eq("status", "completed")
        .order("submitted_at", { ascending: false });

      const results = (resultsData as any[]) || [];

      // Fetch student profiles for results
      const studentIds = [...new Set(results.map((r) => r.student_id))];
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles" as any).select("id, full_name, email").in("id", studentIds);
        const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.id, p]));

        const enriched = results.map((r) => {
          const exam = examsList.find((e: Exam) => e.id === r.exam_id);
          const prof = profileMap.get(r.student_id);
          return {
            ...r,
            exam_title: exam?.title || "Unknown",
            exam_subject: exam?.subject || "",
            student_name: prof?.full_name || "Unknown Student",
            student_email: prof?.email || "",
          };
        });
        setStudentResults(enriched);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Signed out successfully");
  };

  const publishExam = async (examId: string) => {
    const { error } = await supabase.from("exams" as any).update({ status: "published" }).eq("id", examId);
    if (error) { toast.error("Failed to publish exam"); return; }
    toast.success("Exam published successfully");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchData(user.id);
  };

  const deleteExam = async (examId: string) => {
    const { error } = await supabase.from("exams" as any).delete().eq("id", examId);
    if (error) { toast.error("Failed to delete exam"); return; }
    toast.success("Exam deleted successfully");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchData(user.id);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const publishedExams = exams.filter((e) => e.status === "published");
  const draftExams = exams.filter((e) => e.status === "draft");

  // Filter results
  const filteredResults = studentResults.filter((r) => {
    const matchesSearch = searchQuery === "" ||
      r.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = filterExam === "all" || r.exam_id === filterExam;
    return matchesSearch && matchesExam;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
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
              <Button onClick={() => navigate("/create-exam")} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Create Exam
              </Button>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{exams.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Eye className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{publishedExams.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Edit className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{draftExams.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{studentResults.length}</div></CardContent>
          </Card>
        </div>

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
                  <Button onClick={() => navigate("/create-exam")}><Plus className="h-4 w-4 mr-2" /> Create Your First Exam</Button>
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
                          <CardDescription>{exam.subject} • Grade {exam.grade_level} • {exam.duration_minutes} mins</CardDescription>
                        </div>
                        <Badge variant={exam.status === "published" ? "default" : "secondary"}>{exam.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">Total: {exam.total_marks} marks | Pass: {exam.passing_marks}</span>
                        <div className="flex gap-2">
                          {exam.status === "draft" && (
                            <Button size="sm" onClick={() => publishExam(exam.id)}><Eye className="h-4 w-4 mr-1" /> Publish</Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => navigate(`/exam/${exam.id}/edit`)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteExam(exam.id)}>Delete</AlertDialogAction>
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
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={filterExam}
                    onChange={(e) => setFilterExam(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Exams</option>
                    {exams.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            {filteredResults.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No student submissions found</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="hidden md:table-cell">Exam</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((result) => {
                        const passingMark = exams.find((e) => e.id === result.exam_id)?.passing_marks || 50;
                        const passed = (result.score || 0) >= passingMark;
                        return (
                          <TableRow key={result.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{result.student_name}</p>
                                <p className="text-xs text-muted-foreground hidden md:block">{result.student_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{result.exam_title}</TableCell>
                            <TableCell className="font-medium">{result.score || 0}</TableCell>
                            <TableCell>{Number(result.percentage || 0).toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge variant={passed ? "default" : "destructive"}>
                                {passed ? "Pass" : "Fail"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {result.submitted_at ? new Date(result.submitted_at).toLocaleDateString() : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;
