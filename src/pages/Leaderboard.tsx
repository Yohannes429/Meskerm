import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, ArrowLeft, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface LeaderboardEntry {
  rank: number;
  student_name: string;
  score: number;
  percentage: number;
  time_taken: string;
}

const Leaderboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [examTitle, setExamTitle] = useState("");

  useEffect(() => {
    loadLeaderboard();
  }, [examId]);

  const loadLeaderboard = async () => {
    const { data: exam } = await supabase
      .from("exams" as any).select("title").eq("id", examId).single();
    if (exam) setExamTitle((exam as any).title);

    const { data: results } = await supabase
      .from("student_exams" as any)
      .select("student_id, score, percentage, created_at, submitted_at")
      .eq("exam_id", examId)
      .eq("status", "completed")
      .order("score", { ascending: false })
      .limit(10);

    if (results && (results as any[]).length > 0) {
      const studentIds = [...new Set((results as any[]).map((r: any) => r.student_id))];
      const { data: profiles } = await supabase
        .from("profiles" as any).select("id, full_name").in("id", studentIds);
      const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.id, p.full_name]));

      const mapped: LeaderboardEntry[] = (results as any[]).map((r: any, i: number) => {
        const start = new Date(r.created_at).getTime();
        const end = r.submitted_at ? new Date(r.submitted_at).getTime() : start;
        const mins = Math.round((end - start) / 60000);
        return {
          rank: i + 1,
          student_name: profileMap.get(r.student_id) || "Unknown",
          score: r.score || 0,
          percentage: Number(r.percentage || 0),
          time_taken: `${mins} min`,
        };
      });
      setEntries(mapped);
    }
    setLoading(false);
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-300";
    if (rank === 2) return "bg-gray-300/10 border-gray-400 text-gray-600 dark:text-gray-300";
    if (rank === 3) return "bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-300";
    return "border-border";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-500" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

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
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">{examTitle}</p>
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No results yet for this exam.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {entries.map((entry) => (
              <Card key={entry.rank} className={`border-2 transition-all ${getRankStyle(entry.rank)}`}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="w-10 flex justify-center">{getRankIcon(entry.rank)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{entry.student_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {entry.time_taken}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{entry.score}</p>
                    <Badge variant={entry.percentage >= 50 ? "default" : "destructive"} className="text-xs">
                      {entry.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
