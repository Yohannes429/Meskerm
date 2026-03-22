import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, Users, Award, TrendingUp, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-image.jpg";
import { supabase } from "@/integrations/supabase/client";

interface NewsPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  category: string;
  created_at: string;
}

const LandingPage = () => {
  const [latestNews, setLatestNews] = useState<NewsPost[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from("news_posts" as any)
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);
      setLatestNews((data as any) || []);
    };
    fetchNews();
  }, []);
  const features = [
    {
      icon: BookOpen,
      title: "Digital Exams",
      description: "Take exams online with instant feedback and detailed analytics",
    },
    {
      icon: GraduationCap,
      title: "Quality Education",
      description: "Access to comprehensive curriculum and learning resources",
    },
    {
      icon: Users,
      title: "Expert Teachers",
      description: "Learn from qualified and experienced educators",
    },
    {
      icon: Award,
      title: "Track Progress",
      description: "Monitor your academic performance with detailed reports",
    },
  ];

  const stats = [
    { value: "1000+", label: "Students" },
    { value: "50+", label: "Teachers" },
    { value: "100+", label: "Exams" },
    { value: "95%", label: "Success Rate" },
  ];

  const benefits = [
    "24/7 access to learning materials",
    "Instant exam results and feedback",
    "Works offline and online",
    "Comprehensive performance analytics",
    "Preparation for national exams",
    "Mobile-friendly platform",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="container relative mx-auto px-4 py-20 lg:py-32">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5">
                <span className="text-sm font-medium text-primary">
                  Welcome to Meskerm Secondary School
                </span>
              </div>
              <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-6xl">
                Transform Your Learning with{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Digital Education
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Join Ethiopia's premier digital education platform. Take exams online, track your progress, and excel in your studies with our innovative learning system.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link to="/auth">
                  <Button size="lg" className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 sm:w-auto">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl" />
              <img
                src={heroImage}
                alt="Ethiopian students learning with technology"
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary lg:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
              Why Choose Meskerm?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Experience modern education with our comprehensive digital platform designed for Ethiopian students
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 transition-all hover:border-primary hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-foreground lg:text-4xl">
                Everything You Need to Succeed
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Our platform provides comprehensive tools and resources to help you excel in your academic journey.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <TrendingUp className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle>Track Progress</CardTitle>
                  <CardDescription>
                    Monitor your performance with detailed analytics and insights
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="mt-6 border-2 border-secondary/20 sm:mt-12">
                <CardHeader>
                  <Award className="mb-2 h-8 w-8 text-secondary" />
                  <CardTitle>Achieve Excellence</CardTitle>
                  <CardDescription>
                    Prepare for national exams with our comprehensive resources
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-12 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
                Ready to Start Your Journey?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
                Join thousands of students already benefiting from our digital education platform
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
