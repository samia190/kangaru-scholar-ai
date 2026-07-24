 
import { ENV } from "../env";
import type { InvokeParams, InvokeResult } from "../llm";
import { AIProvider, sleep, parseRetryAfter, computeBackoffDelay, RETRY_MAX_RETRIES } from "./provider";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

export class GroqProvider implements AIProvider {
  readonly name = "groq";

  isConfigured(): boolean {
    return !!ENV.groqApiKey && ENV.groqApiKey.trim().length > 0;
  }

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    if (!ENV.groqApiKey) {
      throw new Error(
  "[AI][Groq] GROQ_API_KEY is missing."
);
    }

    const model = params.model || ENV.groqModel || DEFAULT_MODEL;

    const payload: Record<string, unknown> = {
      messages: params.messages,
      model,
    };

    if (params.tools && params.tools.length > 0) {
      payload.tools = params.tools;
    }

    const toolChoice = params.toolChoice || params.tool_choice;
    if (toolChoice) {
      payload.tool_choice = toolChoice;
    }

    const maxTokens = params.max_tokens ?? params.maxTokens;
    if (typeof maxTokens === "number") {
      payload.max_tokens = maxTokens;
    }
    if (params.thinking) {
  payload.thinking = params.thinking;
}

if (params.reasoning) {
  payload.reasoning = params.reasoning;
}

    if (params.response_format) {
      payload.response_format = params.response_format;
    }
    if (params.responseFormat) {
      payload.response_format = params.responseFormat;
    }

    console.log(
  `[AI][Groq] Calling ${model} (${GROQ_BASE_URL})`
    );

   const controller = new AbortController();

const timeout = setTimeout(() => {
  controller.abort();
}, Number(ENV.aiRequestTimeout || 30000));

try {
  const response = await this.fetchWithBackoff(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.groqApiKey}`,
    },
    signal: controller.signal,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
  `[AI][Groq] LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`

    );
  }

  const result = (await response.json()) as InvokeResult;

  console.log(
    `[AI][Groq] Success • Model=${result.model} • Tokens=${result.usage?.total_tokens ?? "?"}`
  );

  return result;
} finally {
  clearTimeout(timeout);
}
}
    

  private async fetchWithBackoff(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, init);
        if (response.ok || attempt === RETRY_MAX_RETRIES) {
          return response;
        }

        const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
        try {
          await response.body?.cancel();
        } catch {
          // Body already settled
        }
        console.warn(
  `[AI][Groq] HTTP ${response.status} • Retry ${attempt + 1}/${RETRY_MAX_RETRIES}`

        );
        await sleep(computeBackoffDelay(attempt, retryAfterMs));
      } catch (error) {
        lastError = error;
        if (attempt === RETRY_MAX_RETRIES) throw error;
        console.warn(
  `[AI][Groq] Network error • Retry ${attempt + 1}/${RETRY_MAX_RETRIES}`

        );
        await sleep(computeBackoffDelay(attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Groq request failed after exhausting retries");
  }
}
