import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Check, X } from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employee_id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  employee_name?: string;
}

const LeaveManagement = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    const { data } = await supabase.from("leave_requests" as any).select("*").order("created_at", { ascending: false });
    const reqs = (data as any[]) || [];

    // Enrich with employee names
    const empIds = [...new Set(reqs.map(r => r.employee_id))];
    if (empIds.length > 0) {
      const { data: emps } = await supabase.from("employees" as any).select("id, full_name").in("id", empIds);
      const empMap = new Map((emps as any[] || []).map((e: any) => [e.id, e.full_name]));
      reqs.forEach(r => r.employee_name = empMap.get(r.employee_id) || "Unknown");
    }
    setRequests(reqs);
    setLoading(false);
  };

  const openReview = (req: LeaveRequest) => {
    setSelected(req);
    setAdminNotes(req.admin_notes || "");
    setReviewDialog(true);
  };

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selected) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("leave_requests" as any).update({
      status, admin_notes: adminNotes || null, reviewed_by: user?.id, updated_at: new Date().toISOString(),
    } as any).eq("id", selected.id);
    toast.success(`Leave request ${status}`);
    setReviewDialog(false);
    fetchRequests();
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected"].map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
            {f} {f !== "all" && `(${requests.filter(r => r.status === f).length})`}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No leave requests</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.employee_name}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{req.leave_type}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {req.start_date} — {req.end_date}
                    </TableCell>
                    <TableCell>
                      <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "secondary"}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {req.status === "pending" ? (
                        <Button size="sm" variant="outline" onClick={() => openReview(req)}>Review</Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => openReview(req)}>View</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Leave Request Review</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <p><strong>Employee:</strong> {selected.employee_name}</p>
              <p><strong>Type:</strong> {selected.leave_type}</p>
              <p><strong>Dates:</strong> {selected.start_date} — {selected.end_date}</p>
              <p><strong>Reason:</strong> {selected.reason}</p>
              <div className="space-y-2">
                <strong>Admin Notes</strong>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Optional notes..."
                  disabled={selected.status !== "pending"} />
              </div>
            </div>
          )}
          {selected?.status === "pending" && (
            <DialogFooter className="gap-2">
              <Button variant="destructive" onClick={() => handleReview("rejected")}><X className="h-4 w-4 mr-1" />Reject</Button>
              <Button onClick={() => handleReview("approved")}><Check className="h-4 w-4 mr-1" />Approve</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveManagement;
