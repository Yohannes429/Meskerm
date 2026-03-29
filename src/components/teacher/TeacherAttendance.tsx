import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
}

const TeacherAttendance = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find employee record linked to this user
      const { data: emp } = await supabase.from("employees" as any).select("id").eq("user_id", user.id).single();
      if (!emp) { setLoading(false); return; }

      const { data } = await supabase.from("attendance" as any)
        .select("*").eq("employee_id", (emp as any).id).order("date", { ascending: false }).limit(30);
      setRecords((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (records.length === 0) {
    return <Card><CardContent className="flex flex-col items-center justify-center py-12">
      <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">No attendance records found</p>
    </CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="pt-6 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Check In</TableHead>
            <TableHead className="hidden md:table-cell">Check Out</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {records.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "present" ? "default" : r.status === "absent" ? "destructive" : "secondary"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TeacherAttendance;
