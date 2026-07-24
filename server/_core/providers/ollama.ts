import { ENV } from "../env";
import type { InvokeParams, InvokeResult } from "../llm";
import { AIProvider, sleep, parseRetryAfter, computeBackoffDelay, RETRY_MAX_RETRIES } from "./provider";

const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.2:1b";

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";

  private getBaseUrl(): string {
    const base = (ENV.ollamaBaseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
    return `${base}/v1/chat/completions`;
  }

  private getModel(): string {
    return ENV.ollamaModel || DEFAULT_MODEL;
  }

  isConfigured(): boolean {
    return true; // Ollama is always "configured" — may just fail to connect
  }

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    const url = this.getBaseUrl();
    const model = params.model || this.getModel();

    const payload: Record<string, unknown> = {
  messages: params.messages,
  model,
  keep_alive: ENV.ollamaKeepAlive || "30m",
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

    if (params.thinking) payload.thinking = params.thinking;
    if (params.reasoning) payload.reasoning = params.reasoning;

    if (params.response_format) {
      payload.response_format = params.response_format;
    }
    if (params.responseFormat) {
      payload.response_format = params.responseFormat;
    }

    console.log(
  `[AI][Ollama] Calling ${model} (${url})`
    );

    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (ENV.ollamaApiKey) {
      headers["authorization"] = `Bearer ${ENV.ollamaApiKey}`;
    }

  const controller = new AbortController();

const timeout = setTimeout(() => {
  controller.abort();
}, 30000);

try {
  const response = await this.fetchWithBackoff(url, {
    method: "POST",
    headers,
    signal: controller.signal,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[Ollama] LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = (await response.json()) as InvokeResult;

  console.log(
    `[AI][Ollama] Success • Model=${result.model} • Tokens=${result.usage?.total_tokens ?? "?"}`
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
        `[AI][Ollama] HTTP ${response.status} • Retry ${attempt + 1}/${RETRY_MAX_RETRIES}`
        );
        await sleep(computeBackoffDelay(attempt, retryAfterMs));
      } catch (error) {
        lastError = error;
        if (attempt === RETRY_MAX_RETRIES) throw error;
        console.warn(
        `[AI][Ollama] Network error • Retry ${attempt + 1}/${RETRY_MAX_RETRIES}`
        );
        await sleep(computeBackoffDelay(attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Ollama request failed after exhausting retries");
  }
}
