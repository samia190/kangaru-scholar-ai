import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

export default function TeacherLessonPlan() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [message, setMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const lessonPlanMutation = trpc.chat.teacherLessonPlan.useMutation();
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !subject || !gradeLevel) return;

    setIsLoading(true);
    const userMessage = message;
    setMessage("");

    try {
      const result = await lessonPlanMutation.mutateAsync({
        message: userMessage,
        subject,
        gradeLevel,
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
              Lesson Planner
            </h1>
            <p className="text-sm text-muted-foreground">
              Create comprehensive lesson plans with AI assistance
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Input Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Lesson Details
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Subject
              </label>
              <Input
                placeholder="e.g., Mathematics, English, Biology"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Grade Level
              </label>
              <Input
                placeholder="e.g., Form 1, Form 4, Grade 10"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Lesson Topic or Request
            </label>
            <Textarea
              placeholder="Describe what you'd like help with. For example: 'Create a lesson plan for quadratic equations' or 'Help me structure a lesson on photosynthesis'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-24"
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !subject || !gradeLevel || !message.trim()}
            className="mt-4 w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Generate Lesson Plan
              </>
            )}
          </Button>
        </Card>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Lesson Plans
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
                  {msg.role === "user" ? "Your Request" : "AI Lesson Plan"}
                </div>
                <div className="text-foreground prose prose-sm dark:prose-invert max-w-none">
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
                Fill in the lesson details and describe what you need help with.
              </p>
              <p className="text-sm">
                The AI will generate a comprehensive lesson plan tailored to your
                subject and grade level.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
