import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AIChatBox, Message } from "@/components/AIChatBox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REVISION_SUGGESTED_PROMPTS = [
  "Explain the concept of photosynthesis",
  "What are the key differences between mitosis and meiosis?",
  "Help me understand quadratic equations",
  "What are the causes of World War II?",
];

export default function StudentRevision() {
  // All hooks must be called unconditionally at the top
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI revision assistant. I'm here to help you with your studies. Please select your curriculum (**8-4-4** or **CBC**) and optionally specify a subject, then ask me any questions you have!",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [curriculum, setCurriculum] = useState<"8-4-4" | "CBC">("8-4-4");
  const [subject, setSubject] = useState("");
  const studentRevisionMutation = trpc.chat.studentRevision.useMutation();
  const loadHistoryQuery = trpc.chat.loadChatHistory.useQuery(
    { portalType: "student" },
    { enabled: !!isAuthenticated }
  );

  // Load chat history when authenticated
  useEffect(() => {
    if (isAuthenticated && loadHistoryQuery.data?.messages && loadHistoryQuery.data.messages.length > 0) {
      const historyMessages: Message[] = loadHistoryQuery.data.messages
        .filter(
          (m: { role: string; content: string }) =>
            m.role === "user" || m.role === "assistant"
        )
        .map((m: { role: string; content: string }) => ({
          role: m.role as Message["role"],
          content: m.content,
        }));
      if (historyMessages.length > 0) {
        setMessages(historyMessages);
      }
    }
  }, [isAuthenticated, loadHistoryQuery.data]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    );
  }

  // Unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            Sign In Required
          </h2>
          <p className="text-muted-foreground mb-6">
            You need to sign in to access the revision assistant.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  const handleSendMessage = (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Build conversation history for the API
    const conversationHistory = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    studentRevisionMutation.mutate(
      {
        message: content,
        curriculum,
        subject: subject || undefined,
        conversationHistory,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            const assistantMessage: Message = {
              role: "assistant",
              content: response.message,
            };
            setMessages((prev) => [...prev, assistantMessage]);
          } else {
            const errorMessage: Message = {
              role: "assistant",
              content: response.message || "An error occurred. Please try again.",
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
        },
        onError: () => {
          const errorMessage: Message = {
            role: "assistant",
            content:
              "I encountered an error processing your request. Please try again.",
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
        onSettled: () => {
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/student")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Revision Assistant
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-powered study help
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        {/* Settings */}
        <div className="mb-6 grid grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Curriculum
            </label>
            <Select
              value={curriculum}
              onValueChange={(value: any) => setCurriculum(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8-4-4">8-4-4 System</SelectItem>
                <SelectItem value="CBC">CBC (Competency-Based)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Subject (Optional)
            </label>
            <Input
              placeholder="e.g., Mathematics, English, Biology"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 max-w-3xl mx-auto w-full">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="Ask a question about your studies..."
            height="calc(100vh - 280px)"
            suggestedPrompts={REVISION_SUGGESTED_PROMPTS}
            emptyStateMessage="Ask me anything about your subjects"
          />
        </div>
      </div>
    </div>
  );
}
