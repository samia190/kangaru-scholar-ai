import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="mb-6">
            <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tight">
              Kangaru Girls High School
            </h1>
            <div className="mt-4 inline-block">
              <p className="text-xl md:text-2xl font-semibold italic text-foreground/80">
                "Grow in Grace"
              </p>
            </div>
          </div>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
            Empowering young women through education, innovation, and AI-powered learning tools.
          </p>

          {/* Key Stats */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-3xl font-bold text-primary">7.385</p>
              <p className="text-sm text-muted-foreground mt-1">KCSE Mean Score</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-3xl font-bold text-primary">Extra</p>
              <p className="text-sm text-muted-foreground mt-1">County Category</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-3xl font-bold text-primary">1989</p>
              <p className="text-sm text-muted-foreground mt-1">Founded</p>
            </div>
          </div>
        </div>
      </header>

      {/* Portal Entry Points */}
      <main className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
          Choose Your Portal
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Guest Portal */}
          <Card
            className="p-8 border-border hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer group"
            onClick={() => setLocation("/guest-chat")}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Guest Portal</h3>
            <p className="text-muted-foreground mb-6">
              Ask our AI assistant anything about Kangaru Girls High School — history, academics, facilities, contacts, and more.
            </p>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Enter Guest Portal
            </Button>
          </Card>

          {/* Student Portal */}
          <Card
            className="p-8 border-border hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer group"
            onClick={() => {
              if (isAuthenticated) {
                setLocation("/student");
              } else {
                startLogin();
              }
            }}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Student Portal</h3>
            <p className="text-muted-foreground mb-6">
              AI-powered revision tools for 8-4-4 and CBC curricula. Get study help, explanations, and practice questions.
            </p>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {isAuthenticated ? "Enter Student Portal" : "Sign In to Access"}
            </Button>
          </Card>

          {/* Teacher Portal */}
          <Card
            className="p-8 border-border hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer group"
            onClick={() => {
              if (isAuthenticated) {
                setLocation("/teacher");
              } else {
                startLogin();
              }
            }}
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Teacher Portal</h3>
            <p className="text-muted-foreground mb-6">
              Generate lesson plans and timetables with AI assistance. Organize your teaching workflow efficiently.
            </p>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {isAuthenticated ? "Enter Teacher Portal" : "Sign In to Access"}
            </Button>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-muted-foreground text-sm">
            Kangaru Girls High School — Embu County, Kenya
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Powered by self-hosted AI | Motto: "Grow in Grace"
          </p>
          {isAuthenticated && user?.name && (
            <p className="text-muted-foreground text-sm mt-2">
              Signed in as: {user.name}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
