import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Send, Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

export default function TeacherTimetable() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [message, setMessage] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [classInput, setClassInput] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const timetableMutation = trpc.chat.teacherTimetable.useMutation();
  const loadHistoryQuery = trpc.chat.loadChatHistory.useQuery(
    { portalType: "teacher" },
    { enabled: !!user }
  );

  // Load chat history when authenticated
  useEffect(() => {
    if (loadHistoryQuery.data?.messages && loadHistoryQuery.data.messages.length > 0) {
      const historyMessages = loadHistoryQuery.data.messages.filter(
        (m: { role: string; content: string }) =>
          m.role === "user" || m.role === "assistant"
      );
      if (historyMessages.length > 0) {
        setConversationHistory(historyMessages);
      }
    }
  }, [loadHistoryQuery.data]);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [authLoading, user, setLocation]);

  const addSubject = () => {
    if (subjectInput.trim() && !subjects.includes(subjectInput)) {
      setSubjects([...subjects, subjectInput]);
      setSubjectInput("");
    }
  };

  const addClass = () => {
    if (classInput.trim() && !classes.includes(classInput)) {
      setClasses([...classes, classInput]);
      setClassInput("");
    }
  };

  const removeSubject = (idx: number) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const removeClass = (idx: number) => {
    setClasses(classes.filter((_, i) => i !== idx));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || subjects.length === 0 || classes.length === 0)
      return;

    setIsLoading(true);
    const userMessage = message;
    setMessage("");

    try {
      const result = await timetableMutation.mutateAsync({
        message: userMessage,
        subjects,
        classes,
        availability: availability || undefined,
        conversationHistory,
      });

      if (result.success) {
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: userMessage },
          { role: "assistant", content: result.message },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setLocation("/teacher")}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Timetable Generator
            </h1>
            <p className="text-sm text-muted-foreground">
              Create optimized weekly timetables with AI assistance
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Input Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Timetable Configuration
          </h2>

          {/* Subjects */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Subjects to Schedule
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g., Mathematics, English, Biology"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSubject()}
              />
              <Button
                onClick={addSubject}
                variant="outline"
                className="px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject, idx) => (
                <div
                  key={idx}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                >
                  {subject}
                  <button
                    onClick={() => removeSubject(idx)}
                    className="hover:text-primary/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Classes */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Classes/Streams
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g., Form 1A, Form 2B, Form 3C"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addClass()}
              />
              <Button
                onClick={addClass}
                variant="outline"
                className="px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {classes.map((cls, idx) => (
                <div
                  key={idx}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                >
                  {cls}
                  <button
                    onClick={() => removeClass(idx)}
                    className="hover:text-primary/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Teacher Availability / Constraints (Optional)
            </label>
            <Textarea
              placeholder="e.g., 'Not available on Mondays', 'Prefer morning slots', 'Science lab only available 2-4 PM'"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full min-h-20"
            />
          </div>

          {/* Request */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Additional Instructions
            </label>
            <Textarea
              placeholder="Describe any specific requirements for the timetable. For example: 'Minimize back-to-back classes', 'Distribute heavy subjects', 'Science practicals on Wednesdays'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-20"
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={
              isLoading || subjects.length === 0 || classes.length === 0
            }
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Generate Timetable
              </>
            )}
          </Button>
        </Card>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Generated Timetables
            </h2>
            {conversationHistory.map((msg, idx) => (
              <Card
                key={idx}
                className={`p-4 ${
                  msg.role === "user"
                    ? "bg-accent/50 border-accent"
                    : "bg-card border-border"
                }`}
              >
                <div className="text-sm font-semibold mb-2 text-foreground">
                  {msg.role === "user" ? "Your Request" : "Generated Timetable"}
                </div>
                <div className="text-foreground prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                  <Streamdown>{msg.content}</Streamdown>
                </div>
              </Card>
            ))}
          </div>
        )}

        {conversationHistory.length === 0 && (
          <Card className="p-8 text-center border-dashed">
            <div className="text-muted-foreground">
              <p className="mb-2">
                Add subjects and classes, then click Generate to create your
                timetable.
              </p>
              <p className="text-sm">
                The AI will create an optimized weekly schedule based on your
                requirements.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
