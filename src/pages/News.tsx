import { Calendar, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const News = () => {
  const newsItems = [
    {
      title: "Digital Platform Launch",
      excerpt: "Meskerm Secondary School launches innovative digital exam platform for all students.",
      category: "Technology",
      date: "October 10, 2025",
      author: "Admin Team",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80",
    },
    {
      title: "Excellent National Exam Results",
      excerpt: "Our Grade 12 students achieve outstanding results in national examinations with 95% pass rate.",
      category: "Academic",
      date: "September 25, 2025",
      author: "Principal",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
    },
    {
      title: "New Science Laboratory",
      excerpt: "State-of-the-art science laboratory opens, enhancing hands-on learning opportunities.",
      category: "Facilities",
      date: "September 15, 2025",
      author: "Facilities Team",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
    },
    {
      title: "Student Achievement Awards",
      excerpt: "Celebrating exceptional student achievements in academics, sports, and community service.",
      category: "Events",
      date: "September 1, 2025",
      author: "Academic Dean",
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
    },
    {
      title: "Teacher Training Workshop",
      excerpt: "Faculty members complete advanced training in digital teaching methodologies.",
      category: "Professional Development",
      date: "August 20, 2025",
      author: "HR Department",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
    },
    {
      title: "Community Outreach Program",
      excerpt: "Students participate in community service projects, making a positive impact in local neighborhoods.",
      category: "Community",
      date: "August 10, 2025",
      author: "Student Council",
      image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80",
    },
  ];

  const categories = ["All", "Technology", "Academic", "Facilities", "Events", "Professional Development", "Community"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-foreground lg:text-5xl">
              News & Updates
            </h1>
            <p className="text-lg text-muted-foreground">
              Stay informed about the latest happenings, achievements, and announcements at Meskerm Secondary School
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="border-b bg-muted/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category, index) => (
              <Badge
                key={index}
                variant={index === 0 ? "default" : "outline"}
                className={index === 0 ? "bg-primary cursor-pointer" : "cursor-pointer hover:bg-muted"}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {newsItems.map((item, index) => (
              <Card key={index} className="overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg">
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary">{item.category}</Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      {item.date}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 line-clamp-3">
                    {item.excerpt}
                  </CardDescription>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <User className="mr-1 h-3 w-3" />
                    {item.author}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default News;
