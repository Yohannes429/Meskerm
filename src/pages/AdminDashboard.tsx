import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Plus, Edit, Trash2, Newspaper, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface NewsPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  category: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("General");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data: profileData } = await supabase
      .from("profiles" as any).select("*").eq("id", user.id).single();

    const role = (profileData as any)?.role || user.user_metadata?.role || "student";
    if (role !== "admin") {
      toast.error("Unauthorized: Admin access required");
      navigate("/");
      return;
    }

    setProfile(profileData || { full_name: user.user_metadata?.full_name, role });
    await fetchPosts();
    setLoading(false);
  };

  const fetchPosts = async () => {
    // Admins can see all posts via RLS policy
    const { data } = await supabase
      .from("news_posts" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as any) || []);
  };

  const openCreateDialog = () => {
    setEditingPost(null);
    setTitle(""); setContent(""); setExcerpt(""); setCategory("General");
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEditDialog = (post: NewsPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setExcerpt(post.excerpt || "");
    setCategory(post.category);
    setImageFile(null);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("news-images").upload(fileName, file);
    if (error) { toast.error("Image upload failed"); return null; }
    const { data } = supabase.storage.from("news-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);

    let imageUrl = editingPost?.image_url || null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (editingPost) {
      const { error } = await supabase
        .from("news_posts" as any)
        .update({ title, content, excerpt: excerpt || null, image_url: imageUrl, category, updated_at: new Date().toISOString() } as any)
        .eq("id", editingPost.id);
      if (error) toast.error("Failed to update post");
      else toast.success("Post updated!");
    } else {
      const { error } = await supabase
        .from("news_posts" as any)
        .insert({ title, content, excerpt: excerpt || null, image_url: imageUrl, category, author_id: user!.id, status: "published" } as any);
      if (error) toast.error("Failed to create post");
      else toast.success("Post created!");
    }

    setDialogOpen(false);
    setSaving(false);
    await fetchPosts();
  };

  const togglePostStatus = async (post: NewsPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("news_posts" as any)
      .update({ status: newStatus } as any)
      .eq("id", post.id);
    if (error) toast.error("Failed to update status");
    else { toast.success(`Post ${newStatus === "published" ? "published" : "unpublished"}`); await fetchPosts(); }
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("news_posts" as any).delete().eq("id", id);
    if (error) toast.error("Failed to delete post");
    else { toast.success("Post deleted"); await fetchPosts(); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const publishedPosts = posts.filter((p) => p.status === "published");
  const draftPosts = posts.filter((p) => p.status === "draft");

  const categories = ["General", "Academic", "Technology", "Events", "Facilities", "Community", "Sports"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" /> New Post
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <Newspaper className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{posts.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Eye className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{publishedPosts.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{draftPosts.length}</div></CardContent>
          </Card>
        </div>

        {/* Posts List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftPosts.length})</TabsTrigger>
          </TabsList>

          {["all", "published", "drafts"].map((tab) => {
            const filtered = tab === "all" ? posts : tab === "published" ? publishedPosts : draftPosts;
            return (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {filtered.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No posts yet</p>
                      <Button className="mt-4" onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" /> Create Post</Button>
                    </CardContent>
                  </Card>
                ) : (
                  filtered.map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status}</Badge>
                              <Badge variant="outline">{post.category}</Badge>
                            </div>
                            <CardTitle className="text-lg truncate">{post.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">{post.excerpt || post.content.substring(0, 100)}</CardDescription>
                            <p className="text-xs text-muted-foreground mt-2">{new Date(post.created_at).toLocaleDateString()}</p>
                          </div>
                          {post.image_url && (
                            <img src={post.image_url} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(post)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => togglePostStatus(post)}>
                            {post.status === "published" ? <><EyeOff className="h-4 w-4 mr-1" /> Unpublish</> : <><Eye className="h-4 w-4 mr-1" /> Publish</>}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePost(post.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
            <DialogDescription>Fill in the details for your news post</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post-title">Title *</Label>
              <Input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-excerpt">Excerpt</Label>
              <Input id="post-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary (optional)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-category">Category</Label>
              <select
                id="post-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-content">Content *</Label>
              <Textarea id="post-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your post content..." rows={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-image">Image (optional)</Label>
              <Input id="post-image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              {editingPost?.image_url && !imageFile && (
                <img src={editingPost.image_url} alt="" className="h-24 rounded-lg object-cover mt-2" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : editingPost ? "Update Post" : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
