import { ENV } from "../env";
import type { InvokeParams, InvokeResult } from "../llm";
import { AIProvider, sleep, parseRetryAfter, computeBackoffDelay, RETRY_MAX_RETRIES } from "./provider";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
// Updated DEFAULT_MODEL to a known free and stable model
const DEFAULT_MODEL = "nvidia/nemotron-3-ultra"; 

export class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter";

  private getBaseUrl(): string {
    return (ENV.openrouterBaseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  isConfigured(): boolean {
    return !!ENV.openrouterApiKey && ENV.openrouterApiKey.trim().length > 0;
  }

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    if (!ENV.openrouterApiKey) {
      throw new Error(
        "[AI][OpenRouter] OPENROUTER_API_KEY is missing."
      );
    }

    const url = `${this.getBaseUrl()}/chat/completions`;
    // Split the OPENROUTER_MODEL env variable into an array of models
    const models = (params.model || ENV.openrouterModel || DEFAULT_MODEL)
      .split(",")
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (models.length === 0) {
      throw new Error("[AI][OpenRouter] No models configured for OpenRouter.");
    }

    let lastError: Error | undefined;

    // Iterate through the list of models
    for (const model of models) {
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
        `[AI][OpenRouter] Trying model: ${model} (${url})`
      );
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, Number(ENV.aiRequestTimeout || 30000));

      try {
        const response = await this.fetchWithBackoff(
          url,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ENV.openrouterApiKey}`,
              "HTTP-Referer": "https://kangarugirls.sc.ke",
              "X-Title": "Kangaru Scholar AI",
            },
            signal: controller.signal,
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          // Check for specific errors that warrant trying another model
          if (response.status === 400 && errorText.includes("not a valid model ID")) {
            console.warn(`[AI][OpenRouter] Model ${model} returned invalid ID error, trying next model...`);
            lastError = new Error(`[AI][OpenRouter] Model ${model} invalid: ${errorText}`);
            continue; // Try the next model
          } else if (response.status === 429) { // Rate limit
            console.warn(`[AI][OpenRouter] Model ${model} hit rate limit, trying next model...`);
            lastError = new Error(`[AI][OpenRouter] Model ${model} rate limited: ${errorText}`);
            continue; // Try the next model
          }
          throw new Error(
            `[AI][OpenRouter] LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
          );
        }

        const result = (await response.json()) as InvokeResult;

        console.log(
          `[AI][OpenRouter] Success • Model=${result.model} • Tokens=${result.usage?.total_tokens ?? "?"}`
        );

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // If it's a network error or a generic fetch error, we might want to try the next model
        if (lastError.message.includes("fetch failed") || lastError.message.includes("NetworkError")) {
          console.warn(`[AI][OpenRouter] Model ${model} network error, trying next model...`);
          continue; // Try the next model
        }
        throw lastError; // Re-throw other unexpected errors
      } finally {
        clearTimeout(timeout);
      }
    }

    // If all models failed, throw the last encountered error or a generic one
    throw lastError || new Error("[AI][OpenRouter] All configured OpenRouter models failed to respond.");
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
          `[AI][OpenRouter] HTTP ${response.status} • Retry ${attempt + 1}/${RETRY_MAX_RETRIES}`
        );
        await sleep(computeBackoffDelay(attempt, retryAfterMs));
      } catch (error) {
        lastError = error;
        if (attempt === RETRY_MAX_RETRIES) throw error;
        console.warn(
          `[AI][OpenRouter] Network error • Retry ${attempt + 1}/${RETRY_MAX_RETRIES}`
        );
        await sleep(computeBackoffDelay(attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("[AI][OpenRouter] Request failed after exhausting retries");
  }
}
