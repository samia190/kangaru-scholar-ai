import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BookMarked, Calendar, HelpCircle } from "lucide-react";

export default function TeacherPortal() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            Authentication Required
          </h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to access the Teacher Portal.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Teacher Portal</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.name || "Teacher"}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-primary">
          Teaching & Planning Tools
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Lesson Planner */}
          <Card className="p-8 border-border hover:shadow-lg transition-shadow">
            <BookMarked className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">Lesson Planner</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Generate comprehensive lesson plans with AI assistance. Outline
              objectives, activities, and assessments for your classes.
            </p>
            <Button
              onClick={() => setLocation("/teacher/lesson-plan")}
              className="w-full"
            >
              Create Lesson Plan
            </Button>
          </Card>

          {/* Timetable Generator */}
          <Card className="p-8 border-border hover:shadow-lg transition-shadow">
            <Calendar className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">Timetable Generator</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Create optimized weekly timetables. Input your subjects, classes,
              and availability for automatic scheduling.
            </p>
            <Button
              onClick={() => setLocation("/teacher/timetable")}
              className="w-full"
            >
              Generate Timetable
            </Button>
          </Card>

          {/* Pedagogical Q&A */}
          <Card className="p-8 border-border hover:shadow-lg transition-shadow">
            <HelpCircle className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">Pedagogical Assistant</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Ask questions about teaching methods, curriculum alignment,
              assessment strategies, and educational best practices.
            </p>
            <Button
              variant="outline"
              className="w-full"
              disabled
            >
              Coming Soon
            </Button>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card border-border text-center">
            <p className="text-3xl font-bold text-primary mb-2">0</p>
            <p className="text-muted-foreground">Lesson Plans Created</p>
          </Card>
          <Card className="p-6 bg-card border-border text-center">
            <p className="text-3xl font-bold text-primary mb-2">0</p>
            <p className="text-muted-foreground">Timetables Generated</p>
          </Card>
          <Card className="p-6 bg-card border-border text-center">
            <p className="text-3xl font-bold text-primary mb-2">0</p>
            <p className="text-muted-foreground">Questions Answered</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
