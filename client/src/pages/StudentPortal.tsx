import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BookOpen, MessageCircle } from "lucide-react";

export default function StudentPortal() {
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
            Please sign in to access the Student Portal.
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
            <h1 className="text-2xl font-bold text-primary">Student Portal</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.name || "Student"}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-primary">
          Revision & Learning Tools
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Revision Assistant */}
          <Card className="p-8 border-border hover:shadow-lg transition-shadow">
            <BookOpen className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">Revision Assistant</h3>
            <p className="text-muted-foreground mb-6">
              Get AI-powered help with your studies. Ask questions about any
              subject from the 8-4-4 or CBE curriculum, get explanations, and
              practice questions.
            </p>
            <Button
              onClick={() => setLocation("/student/revision")}
              className="w-full"
            >
              Start Revision Session
            </Button>
          </Card>

          {/* Chat History */}
          <Card className="p-8 border-border hover:shadow-lg transition-shadow">
            <MessageCircle className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-3">Chat History</h3>
            <p className="text-muted-foreground mb-6">
              Access your previous revision sessions and continue where you left
              off. All your conversations are saved for easy reference.
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

        {/* Curriculum Info */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border-border">
            <h4 className="font-bold mb-3">8-4-4 Curriculum</h4>
            <p className="text-muted-foreground text-sm">
              Traditional system with 8 years of primary, 4 years of secondary,
              and 4 years of tertiary education.
            </p>
          </Card>
          <Card className="p-6 bg-card border-border">
            <h4 className="font-bold mb-3">CBE (Competency-Based Curriculum)</h4>
            <p className="text-muted-foreground text-sm">
              Modern system focusing on competencies and skills development
              across different learning areas.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
