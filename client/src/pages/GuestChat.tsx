import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, Message } from "@/components/AIChatBox";

const GUEST_SUGGESTED_PROMPTS = [
  "What is Kangaru Girls High School's motto?",
  "Tell me about the school's academic performance",
  "How do I contact the school?",
  "What facilities are available on campus?",
];

export default function GuestChat() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! Welcome to **Kangaru Girls High School** AI Assistant. I'm here to answer any questions you have about our school. Feel free to ask about our history, academics, facilities, admissions, or anything else you'd like to know!",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const guestChatMutation = trpc.chat.guestChat.useMutation();

  const handleSendMessage = (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Build conversation history from messages (excluding the welcome message)
    const conversationHistory = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    guestChatMutation.mutate(
      {
        message: content,
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
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Kangaru Girls High School
            </h1>
            <p className="text-sm text-muted-foreground">
              Guest AI Assistant
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        <div className="max-w-3xl mx-auto w-full">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="Ask a question about Kangaru Girls High School..."
            height="calc(100vh - 180px)"
            suggestedPrompts={GUEST_SUGGESTED_PROMPTS}
            emptyStateMessage="Ask me anything about Kangaru Girls High School"
          />
        </div>
      </div>
    </div>
  );
}
