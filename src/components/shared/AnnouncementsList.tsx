import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Pin } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  is_pinned: boolean;
  created_at: string;
}

interface Props {
  audiences: string[]; // e.g. ["all", "teachers"] or ["all", "students"]
}

const AnnouncementsList = ({ audiences }: Props) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("announcements" as any)
        .select("*").eq("status", "published").in("target_audience", audiences)
        .order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
      setAnnouncements((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (announcements.length === 0) {
    return (
      <Card><CardContent className="flex flex-col items-center justify-center py-12">
        <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No announcements</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map(a => (
        <Card key={a.id} className={a.is_pinned ? "border-2 border-primary/30" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {a.is_pinned && <Pin className="h-3 w-3 text-primary" />}
              <Badge variant="outline" className="capitalize">{a.target_audience}</Badge>
              <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            <h3 className="font-semibold">{a.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnnouncementsList;
