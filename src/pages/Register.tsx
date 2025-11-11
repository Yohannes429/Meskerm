import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const registrationData = {
      full_name: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      grade_level: parseInt(formData.get("gradeLevel") as string),
      previous_school: formData.get("previousSchool") as string,
      parent_name: formData.get("parentName") as string,
      parent_phone: formData.get("parentPhone") as string,
      address: formData.get("address") as string,
      additional_info: formData.get("additionalInfo") as string,
      created_at: new Date().toISOString(),
    };

    // Store registration in a temporary table or send via email
    // For now, we'll just show success message
    // TODO: Create a 'school_registrations' table to store these applications
    
    console.log("Registration data:", registrationData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Application submitted successfully! We'll contact you soon.");
    (e.target as HTMLFormElement).reset();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl">Register for School</CardTitle>
              <CardDescription className="text-base">
                Apply to Meskerem Secondary School - Fill out the form below to begin your academic journey with us
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Student Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter student's full name"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="student@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+251-XXX-XXX-XXX"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel">Grade Level Applying For *</Label>
                    <Select name="gradeLevel" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9">Grade 9</SelectItem>
                        <SelectItem value="10">Grade 10</SelectItem>
                        <SelectItem value="11">Grade 11</SelectItem>
                        <SelectItem value="12">Grade 12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previousSchool">Previous School</Label>
                    <Input
                      id="previousSchool"
                      name="previousSchool"
                      type="text"
                      placeholder="Name of previous school"
                    />
                  </div>
                </div>

                {/* Parent/Guardian Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                    <Input
                      id="parentName"
                      name="parentName"
                      type="text"
                      placeholder="Enter parent/guardian name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Parent/Guardian Phone *</Label>
                    <Input
                      id="parentPhone"
                      name="parentPhone"
                      type="tel"
                      placeholder="+251-XXX-XXX-XXX"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Home Address *</Label>
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="Enter full address"
                      required
                      rows={3}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="additionalInfo">
                      Tell us why you want to join Meskerem Secondary School
                    </Label>
                    <Textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      placeholder="Share your academic goals and interests..."
                      rows={4}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <a href="/auth" className="text-primary hover:underline">
                    Sign in here
                  </a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
