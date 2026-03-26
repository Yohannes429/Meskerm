import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Play, Pause, Square, RefreshCw, Hand, DoorOpen, Check, X, Users, Clock, AlertTriangle, Monitor,
} from "lucide-react";
import { toast } from "sonner";

interface StudentExamRow {
  id: string;
  student_id: string;
  status: string;
  score: number | null;
  percentage: number | null;
  tab_warnings: number;
  is_disqualified: boolean;
  raise_hand: boolean;
  leave_requested: boolean;
  leave_approved: boolean | null;
  submitted_at: string | null;
  student_name?: string;
  student_email?: string;
}

const LiveExamMonitor = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<StudentExamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExam = useCallback(async () => {
    const { data } = await supabase.from("exams" as any).select("*").eq("id", examId).single();
    if (data) setExam(data);
  }, [examId]);

  const fetchStudents = useCallback(async () => {
    const { data: seData } = await supabase
      .from("student_exams" as any)
      .select("*")
      .eq("exam_id", examId);
    
    if (!seData || (seData as any[]).length === 0) { setStudents([]); return; }

    const studentIds = [...new Set((seData as any[]).map((s: any) => s.student_id))];
    const { data: profiles } = await supabase
      .from("profiles" as any).select("id, full_name, email").in("id", studentIds);
    
    const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.id, p]));
    
    setStudents((seData as any[]).map((s: any) => ({
      ...s,
      student_name: profileMap.get(s.student_id)?.full_name || "Unknown",
      student_email: profileMap.get(s.student_id)?.email || "",
    })));
  }, [examId]);

  useEffect(() => {
    const init = async () => {
      await fetchExam();
      await fetchStudents();
      setLoading(false);
    };
    init();
  }, [fetchExam, fetchStudents]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`monitor-${examId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_exams", filter: `exam_id=eq.${examId}` }, () => {
        fetchStudents();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "exams", filter: `id=eq.${examId}` }, () => {
        fetchExam();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [examId, fetchStudents, fetchExam]);

  const updateSessionStatus = async (status: string) => {
    const { error } = await supabase.from("exams" as any).update({ session_status: status } as any).eq("id", examId);
    if (error) { toast.error("Failed to update session"); return; }
    toast.success(`Exam session ${status === "active" ? "started" : status === "paused" ? "paused" : status === "ended" ? "ended" : "resumed"}`);
    fetchExam();
  };

  const handleLeaveRequest = async (studentExamId: string, approved: boolean) => {
    await supabase.from("student_exams" as any)
      .update({ leave_approved: approved, leave_requested: false } as any)
      .eq("id", studentExamId);
    toast.success(approved ? "Leave approved" : "Leave denied");
    fetchStudents();
  };

  const clearRaiseHand = async (studentExamId: string) => {
    await supabase.from("student_exams" as any).update({ raise_hand: false } as any).eq("id", studentExamId);
    fetchStudents();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const sessionStatus = (exam as any)?.session_status || "not_started";
  const activeStudents = students.filter(s => s.status === "in_progress" && !s.is_disqualified);
  const completedStudents = students.filter(s => s.status === "completed");
  const disqualifiedStudents = students.filter(s => s.is_disqualified);
  const handRaised = students.filter(s => s.raise_hand);
  const leaveRequests = students.filter(s => s.leave_requested);

  const getStudentStatusBadge = (s: StudentExamRow) => {
    if (s.is_disqualified) return <Badge variant="destructive">Disqualified</Badge>;
    if (s.status === "completed") return <Badge className="bg-green-600">Finished</Badge>;
    if (s.leave_requested) return <Badge className="bg-orange-500 text-white">Requesting Leave</Badge>;
    if (s.raise_hand) return <Badge className="bg-yellow-500 text-white">Hand Raised</Badge>;
    if (s.status === "in_progress") return <Badge className="bg-blue-500 text-white">Taking Exam</Badge>;
    return <Badge variant="secondary">Idle</Badge>;
  };

  const sessionBadge = {
    not_started: <Badge variant="secondary" className="text-base px-3 py-1">Not Started</Badge>,
    active: <Badge className="bg-green-600 text-base px-3 py-1">Active</Badge>,
    paused: <Badge className="bg-yellow-500 text-white text-base px-3 py-1">Paused</Badge>,
    ended: <Badge variant="destructive" className="text-base px-3 py-1">Ended</Badge>,
  }[sessionStatus] || <Badge variant="secondary">Unknown</Badge>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Monitor className="h-6 w-6" /> Live Exam Control
            </h1>
            <p className="text-muted-foreground">{exam?.title} • {exam?.subject}</p>
          </div>
          <div className="flex items-center gap-2">
            {sessionBadge}
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Session Controls</CardTitle>
            <CardDescription>Control the exam session for all students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {sessionStatus === "not_started" && (
                <Button onClick={() => updateSessionStatus("active")} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" /> Start Exam
                </Button>
              )}
              {sessionStatus === "active" && (
                <>
                  <Button onClick={() => updateSessionStatus("paused")} variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50">
                    <Pause className="h-4 w-4 mr-2" /> Pause Exam
                  </Button>
                  <Button onClick={() => updateSessionStatus("ended")} variant="destructive">
                    <Square className="h-4 w-4 mr-2" /> End Exam
                  </Button>
                </>
              )}
              {sessionStatus === "paused" && (
                <>
                  <Button onClick={() => updateSessionStatus("active")} className="bg-green-600 hover:bg-green-700">
                    <RefreshCw className="h-4 w-4 mr-2" /> Resume Exam
                  </Button>
                  <Button onClick={() => updateSessionStatus("ended")} variant="destructive">
                    <Square className="h-4 w-4 mr-2" /> End Exam
                  </Button>
                </>
              )}
              {sessionStatus === "ended" && (
                <Button onClick={() => updateSessionStatus("not_started")} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" /> Reset Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <div className="text-2xl font-bold">{activeStudents.length}</div>
              <p className="text-xs text-muted-foreground">Taking</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Check className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <div className="text-2xl font-bold">{completedStudents.length}</div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Hand className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <div className="text-2xl font-bold">{handRaised.length}</div>
              <p className="text-xs text-muted-foreground">Hands Up</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <div className="text-2xl font-bold">{disqualifiedStudents.length}</div>
              <p className="text-xs text-muted-foreground">Disqualified</p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests */}
        {leaveRequests.length > 0 && (
          <Card className="mb-6 border-orange-300 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-orange-500" /> Leave Requests ({leaveRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaveRequests.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-background p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{s.student_name}</p>
                      <p className="text-sm text-muted-foreground">{s.student_email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleLeaveRequest(s.id, true)}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleLeaveRequest(s.id, false)}>
                        <X className="h-4 w-4 mr-1" /> Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hand Raised Alerts */}
        {handRaised.length > 0 && (
          <Card className="mb-6 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hand className="h-5 w-5 text-yellow-500" /> Raised Hands ({handRaised.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {handRaised.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-background p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{s.student_name}</p>
                      <p className="text-sm text-muted-foreground">{s.student_email}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => clearRaiseHand(s.id)}>
                      <Check className="h-4 w-4 mr-1" /> Acknowledge
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {students.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students have joined this exam yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warnings</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id} className={s.is_disqualified ? "bg-red-50 dark:bg-red-950/10" : s.raise_hand ? "bg-yellow-50 dark:bg-yellow-950/10" : ""}>
                      <TableCell>
                        <p className="font-medium">{s.student_name}</p>
                        <p className="text-xs text-muted-foreground">{s.student_email}</p>
                      </TableCell>
                      <TableCell>{getStudentStatusBadge(s)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={s.tab_warnings >= 3 ? "text-destructive font-bold" : s.tab_warnings > 0 ? "text-yellow-600 font-medium" : ""}>
                            {s.tab_warnings}/3
                          </span>
                          {s.tab_warnings > 0 && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.status === "completed" ? `${s.score ?? 0} (${Number(s.percentage ?? 0).toFixed(0)}%)` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default LiveExamMonitor;
