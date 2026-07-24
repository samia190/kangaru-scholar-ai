import { ENV } from "./env";
import { providerManager } from "./providers/manager";
import type { ProviderStatus } from "./providers/manager";

// ─── Exported Types (Preserved as per requirements) ───

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: { name: string };
};

export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: string;
  data: ModelInfo[];
};

// ─── Logging Utility ───

const log = (prefix: string, message: string, ...args: unknown[]) => {
  console.log(`${prefix} ${message}`, ...args);
};

// ─── Message Normalization (Preserved and improved readability/typing) ───

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  // Type guards ensure 'part' has a 'type' property
  if (part.type === "text") return part;
  if (part.type === "image_url") return part;
  if (part.type === "file_url") return part;
  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id, content } = message;

  if (role === "tool" || role === "function") {
    // For tool/function roles, content is typically a string or a simple object
    const normalizedContent = ensureArray(content)
      .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");
    return { role, name, tool_call_id, content: normalizedContent };
  }

  const contentParts = ensureArray(content).map(normalizeContentPart);

  // If there's only one text part, simplify the content to a string
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return { role, name, content: contentParts[0].text };
  }

  return { role, name, content: contentParts };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;
  if (toolChoice === "none" || toolChoice === "auto") return toolChoice;

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error("tool_choice 'required' but no tools configured");
    }
    if (tools.length > 1) {
      throw new Error("tool_choice 'required' needs a single tool or explicit name");
    }
    return { type: "function", function: { name: tools[0].function.name } };
  }

  // Handle ToolChoiceByName { name: string }
  if ("name" in toolChoice && typeof (toolChoice as any).name === "string") {
    return { type: "function", function: { name: (toolChoice as any).name } };
  }

  // Explicit validation for ToolChoiceExplicit
  if (
    typeof toolChoice === "object" &&
    "type" in toolChoice &&
    (toolChoice as any).type === "function"
  ) {
    return toolChoice as ToolChoiceExplicit;
  }

  throw new Error("Invalid tool choice format");
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// ─── Main LLM Invoke (Provider-agnostic) ───

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  log("[AI][LLM]", "Invoking LLM", {
    model: params.model,
    messageCount: params.messages.length,
    tools: params.tools?.length ?? 0,
  });

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens,
  } = params;

  const normalizedMessages = messages.map(normalizeMessage);
  const normalizedToolChoiceValue = normalizeToolChoice(toolChoice || tool_choice, tools);
  const normalizedResponseFormatValue = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  const invokePayload = {
    messages: normalizedMessages,
    tools,
    toolChoice: normalizedToolChoiceValue,
    responseFormat: normalizedResponseFormatValue,
    model,
    thinking,
    reasoning,
    maxTokens: max_tokens ?? maxTokens, // Prefer max_tokens if both are provided
  };

  log("[AI][LLM]", "Calling ProviderManager.invoke");
  const result = await providerManager.invoke(invokePayload);
  log("[AI][LLM]", `Response received: model=${result.model}, tokens=${result.usage?.total_tokens ?? "?"}`);
  return result;
}

// ─── Model Listing ───

export async function listLLMModels(): Promise<ModelsResponse> {
  log("[AI][LLM]", "Listing LLM models.");

  // To make this truly provider-agnostic and functional on Render without a local Ollama instance,
  // we need to query configured cloud providers. Since ProviderManager does not expose a listModels method,
  // and we cannot modify ProviderManager, we will simulate a list based on configured providers.
  // This will prevent the function from failing and provide a basic list of available models.

  const configuredProviders: ProviderStatus[] = providerManager.getProviderStatus();
  const models: ModelInfo[] = [];

  // Add models from configured Groq provider
  const groqStatus = configuredProviders.find(p => p.name === "groq");
  if (groqStatus?.configured) {
    models.push({
      id: ENV.groqModel || "llama-3.1-8b-instant", // Use default if ENV is not set
      object: "model",
      created: Date.now(),
      owned_by: "groq",
    });
    log("[AI][LLM]", `Added Groq model: ${ENV.groqModel || "llama-3.1-8b-instant"}`);
  }

  // Add models from configured OpenRouter provider
  const openrouterStatus = configuredProviders.find(p => p.name === "openrouter");
  if (openrouterStatus?.configured) {
    models.push({
      id: ENV.openrouterModel || "meta-llama/llama-3.1-8b-instruct", // Use default if ENV is not set
      object: "model",
      created: Date.now(),
      owned_by: "openrouter",
    });
    log("[AI][LLM]", `Added OpenRouter model: ${ENV.openrouterModel || "meta-llama/llama-3.1-8b-instruct"}`);
  }

  // If Ollama is configured (e.g., for local development), we can still include its default model.
  // However, on Render, this will likely not be configured or reachable.
  const ollamaStatus = configuredProviders.find(p => p.name === "ollama");
  if (ollamaStatus?.configured && ENV.ollamaBaseUrl !== "http://localhost:11434") {
    models.push({
      id: ENV.ollamaModel || "llama3.2:1b",
      object: "model",
      created: Date.now(),
      owned_by: "ollama",
    });
    log("[AI][LLM]", `Added Ollama model: ${ENV.ollamaModel || "llama3.2:1b"}`);
  }

  if (models.length === 0) {
    log("[AI][LLM]", "No AI models found from configured providers.");
    // Optionally, you could throw an error here if no models are absolutely required,
    // but returning an empty list is safer to prevent crashes.
  }

  return {
    object: "list",
    data: models,
  };
}
