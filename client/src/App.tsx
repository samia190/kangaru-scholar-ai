import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import GuestChat from "./pages/GuestChat";
import StudentPortal from "./pages/StudentPortal";
import StudentRevision from "./pages/StudentRevision";
import TeacherPortal from "./pages/TeacherPortal";
import TeacherLessonPlan from "./pages/TeacherLessonPlan";
import TeacherTimetable from "./pages/TeacherTimetable";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/guest-chat" component={GuestChat} />
      <Route path="/student" component={StudentPortal} />
      <Route path="/student/revision" component={StudentRevision} />
      <Route path="/teacher" component={TeacherPortal} />
      <Route path="/teacher/lesson-plan" component={TeacherLessonPlan} />
      <Route path="/teacher/timetable" component={TeacherTimetable} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
