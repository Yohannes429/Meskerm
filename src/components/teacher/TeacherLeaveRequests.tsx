import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const TeacherLeaveRequests = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const [leaveType, setLeaveType] = useState("personal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: emp } = await supabase.from("employees" as any).select("id").eq("user_id", user.id).single();
      if (emp) setEmployeeId((emp as any).id);

      const { data } = await supabase.from("leave_requests" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setRequests((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) { toast.error("All fields are required"); return; }
    if (!employeeId) { toast.error("Employee record not found. Contact admin."); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("leave_requests" as any).insert({
      employee_id: employeeId, user_id: user!.id, leave_type: leaveType,
      start_date: startDate, end_date: endDate, reason,
    } as any);
    if (error) toast.error("Failed to submit"); else {
      toast.success("Leave request submitted");
      setDialogOpen(false);
      // Refetch
      const { data } = await supabase.from("leave_requests" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      setRequests((data as any) || []);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setLeaveType("personal"); setStartDate(""); setEndDate(""); setReason(""); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Request Leave
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No leave requests</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize">{r.leave_type}</Badge>
                      <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{r.start_date} — {r.end_date}</p>
                    <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>
                    {r.admin_notes && <p className="text-xs text-muted-foreground mt-2 italic">Admin: {r.admin_notes}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="personal">Personal</option>
                <option value="sick">Sick</option>
                <option value="vacation">Vacation</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherLeaveRequests;
