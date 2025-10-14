import { BookOpen, Calculator, Beaker, Globe, Microscope, Atom } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Academics = () => {
  const subjects = {
    "Grade 9-10": [
      { icon: BookOpen, name: "English", description: "Language, literature, and communication skills" },
      { icon: BookOpen, name: "Amharic", description: "Ethiopian language and literature" },
      { icon: Calculator, name: "Mathematics", description: "Algebra, geometry, and problem-solving" },
      { icon: Beaker, name: "Chemistry", description: "Matter, reactions, and laboratory work" },
      { icon: Microscope, name: "Biology", description: "Life sciences and living organisms" },
      { icon: Atom, name: "Physics", description: "Matter, energy, and natural phenomena" },
      { icon: Globe, name: "Geography", description: "Earth, environment, and human societies" },
      { icon: BookOpen, name: "History", description: "Ethiopian and world history" },
    ],
    "Grade 11-12": [
      { icon: Calculator, name: "Advanced Mathematics", description: "Calculus, statistics, and advanced topics" },
      { icon: Beaker, name: "Advanced Chemistry", description: "Organic chemistry and advanced concepts" },
      { icon: Microscope, name: "Advanced Biology", description: "Genetics, ecology, and advanced life sciences" },
      { icon: Atom, name: "Advanced Physics", description: "Mechanics, electricity, and modern physics" },
      { icon: BookOpen, name: "English Literature", description: "Literary analysis and critical thinking" },
      { icon: Globe, name: "Economics", description: "Economic principles and Ethiopian economy" },
      { icon: BookOpen, name: "Civics & Ethical Education", description: "Citizenship and ethical values" },
    ],
  };

  const programs = [
    {
      title: "Digital Learning Platform",
      description: "Access course materials, assignments, and resources online 24/7. Our platform supports both online and offline learning for maximum flexibility.",
    },
    {
      title: "Exam Preparation",
      description: "Comprehensive preparation for national exams with practice tests, past papers, and detailed performance analytics to track your progress.",
    },
    {
      title: "Laboratory Work",
      description: "Hands-on experience in well-equipped science laboratories with modern equipment and safety protocols for practical learning.",
    },
    {
      title: "Library Resources",
      description: "Extensive collection of books, digital resources, and research materials to support your studies and encourage independent learning.",
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
              Academic Excellence
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive curriculum designed to prepare students for national exams and future success
            </p>
          </div>
        </div>
      </section>

      {/* Subjects by Grade */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
              Our Curriculum
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A comprehensive range of subjects aligned with Ethiopian national curriculum standards
            </p>
          </div>

          <Tabs defaultValue="Grade 9-10" className="w-full">
            <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="Grade 9-10">Grade 9-10</TabsTrigger>
              <TabsTrigger value="Grade 11-12">Grade 11-12</TabsTrigger>
            </TabsList>

            {Object.entries(subjects).map(([grade, subjectList]) => (
              <TabsContent key={grade} value={grade} className="mt-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {subjectList.map((subject, index) => (
                    <Card key={index} className="border-2 transition-all hover:border-primary hover:shadow-lg">
                      <CardHeader>
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                          <subject.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle>{subject.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          {subject.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Programs & Resources */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
              Learning Resources
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Comprehensive resources and support to enhance your educational experience
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {programs.map((program, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl">{program.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{program.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Assessment */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-foreground lg:text-4xl">
              Assessment & Evaluation
            </h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Continuous Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Regular quizzes, assignments, and class participation contribute to your overall grade. Our digital platform allows for instant feedback and detailed performance tracking.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Term Examinations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Comprehensive exams at the end of each term assess your understanding of the curriculum. These exams are available both online and offline through our ExamNova platform.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>National Exam Preparation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Dedicated preparation for Grade 10 and Grade 12 national examinations, including practice tests, past papers, and intensive review sessions to ensure student success.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Academics;
