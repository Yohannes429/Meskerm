import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Search, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  department: string | null;
  position: string | null;
  status: string;
  hire_date: string;
  created_at: string;
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("teacher");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [hireDate, setHireDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from("employees" as any).select("*").order("created_at", { ascending: false });
    setEmployees((data as any) || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setFullName(""); setEmail(""); setPhone(""); setRole("teacher");
    setDepartment(""); setPosition(""); setHireDate(new Date().toISOString().split("T")[0]);
    setDialogOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setFullName(e.full_name); setEmail(e.email); setPhone(e.phone || "");
    setRole(e.role); setDepartment(e.department || ""); setPosition(e.position || "");
    setHireDate(e.hire_date);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) { toast.error("Name and email are required"); return; }
    setSaving(true);
    const payload = {
      full_name: fullName, email, phone: phone || null, role, department: department || null,
      position: position || null, hire_date: hireDate, updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("employees" as any).update(payload as any).eq("id", editing.id);
      if (error) toast.error("Failed to update"); else toast.success("Employee updated");
    } else {
      const { error } = await supabase.from("employees" as any).insert(payload as any);
      if (error) toast.error("Failed to add employee"); else toast.success("Employee added");
    }
    setSaving(false); setDialogOpen(false); fetchEmployees();
  };

  const toggleStatus = async (emp: Employee) => {
    const newStatus = emp.status === "active" ? "inactive" : "active";
    await supabase.from("employees" as any).update({ status: newStatus } as any).eq("id", emp.id);
    toast.success(`Employee ${newStatus === "active" ? "activated" : "deactivated"}`);
    fetchEmployees();
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from("employees" as any).delete().eq("id", id);
    if (error) toast.error("Failed to delete"); else { toast.success("Employee removed"); fetchEmployees(); }
  };

  const filtered = employees.filter(e =>
    search === "" || e.full_name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No employees found</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.full_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{emp.email}</TableCell>
                    <TableCell><Badge variant="outline">{emp.role}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{emp.department || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={emp.status === "active" ? "default" : "secondary"}
                        className="cursor-pointer" onClick={() => toggleStatus(emp)}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(emp)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Employee</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove {emp.full_name}.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteEmployee(emp.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Department</Label><Input value={department} onChange={e => setDepartment(e.target.value)} /></div>
              <div className="space-y-2"><Label>Position</Label><Input value={position} onChange={e => setPosition(e.target.value)} /></div>
              <div className="space-y-2"><Label>Hire Date</Label><Input type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;
