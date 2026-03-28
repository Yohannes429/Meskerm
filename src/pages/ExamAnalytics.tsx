import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ExamAnalytics = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examTitle, setExamTitle] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    highest: 0,
    lowest: 0,
    average: 0,
    passCount: 0,
    failCount: 0,
    passingMarks: 50,
  });
  const [scoreDistribution, setScoreDistribution] = useState<{ range: string; count: number }[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [examId]);

  const loadAnalytics = async () => {
    const { data: exam } = await supabase
      .from("exams" as any).select("title, passing_marks, total_marks").eq("id", examId).single();
    if (exam) {
      setExamTitle((exam as any).title);
    }
    const passingMarks = (exam as any)?.passing_marks || 50;

    const { data: results } = await supabase
      .from("student_exams" as any)
      .select("score, percentage")
      .eq("exam_id", examId)
      .eq("status", "completed");

    const r = (results as any[]) || [];
    if (r.length === 0) { setLoading(false); return; }

    const scores = r.map((x) => x.score || 0);
    const percentages = r.map((x) => Number(x.percentage || 0));
    const passCount = r.filter((x) => (x.score || 0) >= passingMarks).length;

    setStats({
      totalStudents: r.length,
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      average: percentages.reduce((a, b) => a + b, 0) / percentages.length,
      passCount,
      failCount: r.length - passCount,
      passingMarks,
    });

    // Score distribution in ranges
    const ranges = ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"];
    const buckets = [0, 0, 0, 0, 0];
    percentages.forEach((p) => {
      if (p <= 20) buckets[0]++;
      else if (p <= 40) buckets[1]++;
      else if (p <= 60) buckets[2]++;
      else if (p <= 80) buckets[3]++;
      else buckets[4]++;
    });
    setScoreDistribution(ranges.map((range, i) => ({ range, count: buckets[i] })));
    setLoading(false);
  };

  const passRate = stats.totalStudents > 0 ? (stats.passCount / stats.totalStudents) * 100 : 0;
  const pieData = [
    { name: "Pass", value: stats.passCount },
    { name: "Fail", value: stats.failCount },
  ];
  const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))"];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold mb-2">Exam Analytics</h1>
        <p className="text-muted-foreground mb-6">{examTitle}</p>

        {stats.totalStudents === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No submissions yet.</CardContent></Card>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle></CardHeader>
                <CardContent><div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><span className="text-2xl font-bold">{stats.totalStudents}</span></div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Highest Score</CardTitle></CardHeader>
                <CardContent><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" /><span className="text-2xl font-bold">{stats.highest}</span></div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Lowest Score</CardTitle></CardHeader>
                <CardContent><div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" /><span className="text-2xl font-bold">{stats.lowest}</span></div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Average</CardTitle></CardHeader>
                <CardContent><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-secondary" /><span className="text-2xl font-bold">{stats.average.toFixed(1)}%</span></div></CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {/* Pass/Fail Rate */}
              <Card>
                <CardHeader><CardTitle>Pass / Fail Rate</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center mb-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Pass Rate</span><span className="font-medium">{passRate.toFixed(1)}%</span></div>
                    <Progress value={passRate} />
                  </div>
                </CardContent>
              </Card>

              {/* Score Distribution */}
              <Card>
                <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" fontSize={12} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ExamAnalytics;
