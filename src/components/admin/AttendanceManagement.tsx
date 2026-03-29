import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  full_name: string;
  role: string;
  department: string | null;
  status: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
}

const AttendanceManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const { data: emps } = await supabase.from("employees" as any).select("id, full_name, role, department, status").eq("status", "active").order("full_name");
    setEmployees((emps as any) || []);

    const { data: att } = await supabase.from("attendance" as any).select("*").eq("date", selectedDate);
    setAttendance((att as any) || []);
    setLoading(false);
  };

  const getStatus = (empId: string) => {
    const record = attendance.find(a => a.employee_id === empId);
    return record?.status || null;
  };

  const markAttendance = async (empId: string, status: string) => {
    const existing = attendance.find(a => a.employee_id === empId);
    if (existing) {
      await supabase.from("attendance" as any).update({ status } as any).eq("id", existing.id);
    } else {
      await supabase.from("attendance" as any).insert({
        employee_id: empId, date: selectedDate, status,
        check_in: status === "present" || status === "late" ? new Date().toISOString() : null,
      } as any);
    }
    toast.success(`Marked ${status}`);
    fetchData();
  };

  const presentCount = attendance.filter(a => a.status === "present").length;
  const absentCount = attendance.filter(a => a.status === "absent").length;
  const lateCount = attendance.filter(a => a.status === "late").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full sm:w-auto" />
        <div className="flex gap-2 flex-wrap">
          <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />{presentCount} Present</Badge>
          <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />{absentCount} Absent</Badge>
          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{lateCount} Late</Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : employees.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No active employees</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(emp => {
                  const currentStatus = getStatus(emp.id);
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.full_name}</TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline">{emp.role}</Badge></TableCell>
                      <TableCell>
                        {currentStatus ? (
                          <Badge variant={currentStatus === "present" ? "default" : currentStatus === "absent" ? "destructive" : "secondary"}>
                            {currentStatus}
                          </Badge>
                        ) : <span className="text-muted-foreground text-sm">Not marked</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant={currentStatus === "present" ? "default" : "outline"}
                            onClick={() => markAttendance(emp.id, "present")} className="h-8 px-2 text-xs">
                            Present
                          </Button>
                          <Button size="sm" variant={currentStatus === "absent" ? "destructive" : "outline"}
                            onClick={() => markAttendance(emp.id, "absent")} className="h-8 px-2 text-xs">
                            Absent
                          </Button>
                          <Button size="sm" variant={currentStatus === "late" ? "secondary" : "outline"}
                            onClick={() => markAttendance(emp.id, "late")} className="h-8 px-2 text-xs">
                            Late
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceManagement;
