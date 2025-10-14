import { Award, Target, Eye, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for academic excellence and continuous improvement in all aspects of education.",
    },
    {
      icon: Target,
      title: "Innovation",
      description: "Embracing digital transformation to provide modern, effective learning solutions.",
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a supportive community of learners, educators, and families.",
    },
    {
      icon: Eye,
      title: "Integrity",
      description: "Maintaining the highest standards of honesty, transparency, and ethical conduct.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-foreground lg:text-5xl">
              About Meskerm Secondary School
            </h1>
            <p className="text-lg text-muted-foreground">
              Leading Ethiopian education into the digital age with innovation, excellence, and a commitment to student success.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Target className="h-6 w-6 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To provide world-class education that combines traditional Ethiopian values with modern digital learning tools, preparing students for success in an increasingly connected world. We aim to empower every student with the knowledge, skills, and confidence to excel academically and contribute meaningfully to society.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Eye className="h-6 w-6 text-secondary" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To be Ethiopia's leading secondary school in digital education, recognized for academic excellence, innovative teaching methods, and producing graduates who are well-prepared for higher education and the challenges of the 21st century. We envision a future where every student has access to quality education regardless of location or circumstances.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
              Our Core Values
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              These principles guide everything we do and shape the educational experience we provide
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <Card key={index} className="border-2 transition-all hover:border-primary hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                    <value.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-foreground lg:text-4xl">
              Our History
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <p className="text-lg">
                Meskerm Secondary School was established with a vision to transform education in Ethiopia through innovation and excellence. From our inception, we recognized the potential of digital technology to enhance learning outcomes and provide students with opportunities previously unavailable in traditional educational settings.
              </p>
              <p className="text-lg">
                Our journey began with a commitment to academic excellence and a belief that every student deserves access to quality education. Over the years, we have grown from a small institution into one of Ethiopia's leading secondary schools, known for our innovative approach to teaching and our use of technology to enhance the learning experience.
              </p>
              <p className="text-lg">
                Today, we serve over 1,000 students across multiple grade levels, supported by a dedicated team of more than 50 experienced educators. Our digital exam platform represents the latest evolution in our commitment to providing students with the best possible educational experience, combining the convenience of modern technology with rigorous academic standards.
              </p>
              <p className="text-lg">
                As we look to the future, we remain committed to innovation, excellence, and preparing our students for success in an increasingly digital world. We continue to invest in new technologies, teaching methods, and programs that will benefit our students and the broader Ethiopian educational community.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
