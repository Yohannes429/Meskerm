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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Megaphone, Pin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  target_audience: string;
  is_pinned: boolean;
  status: string;
  created_at: string;
}

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");
  const [pinned, setPinned] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("announcements" as any).select("*").order("created_at", { ascending: false });
    setAnnouncements((data as any) || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null); setTitle(""); setContent(""); setTarget("all"); setPinned(false);
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a); setTitle(a.title); setContent(a.content); setTarget(a.target_audience); setPinned(a.is_pinned);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content required"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { title, content, target_audience: target, is_pinned: pinned, updated_at: new Date().toISOString() };

    if (editing) {
      await supabase.from("announcements" as any).update(payload as any).eq("id", editing.id);
      toast.success("Announcement updated");
    } else {
      await supabase.from("announcements" as any).insert({ ...payload, author_id: user!.id, status: "published" } as any);
      toast.success("Announcement created");
    }
    setSaving(false); setDialogOpen(false); fetch();
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from("announcements" as any).delete().eq("id", id);
    toast.success("Announcement deleted"); fetch();
  };

  const togglePin = async (a: Announcement) => {
    await supabase.from("announcements" as any).update({ is_pinned: !a.is_pinned } as any).eq("id", a.id);
    toast.success(a.is_pinned ? "Unpinned" : "Pinned"); fetch();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Announcement</Button>
      </div>

      {announcements.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12">
          <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No announcements</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className={a.is_pinned ? "border-2 border-primary/30" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {a.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                      <Badge variant="outline" className="capitalize">{a.target_audience}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => togglePin(a)}><Pin className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAnnouncement(a.id)}>Delete</AlertDialogAction>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Announcement" : "New Announcement"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Content *</Label><Textarea value={content} onChange={e => setContent(e.target.value)} rows={4} /></div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <select value={target} onChange={e => setTarget(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All</option>
                <option value="teachers">Teachers</option>
                <option value="staff">Staff</option>
                <option value="students">Students</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="rounded" />
              Pin this announcement
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementManagement;
