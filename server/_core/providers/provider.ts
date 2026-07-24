import type { InvokeParams, InvokeResult } from "../llm";

export interface AIProvider {
  /** Unique provider name */
  readonly name: string;

  /** Returns true if the provider has been configured */
  isConfigured(): boolean;

  /** Execute an LLM request */
  invoke(params: InvokeParams): Promise<InvokeResult>;
}

export type ProviderHealth = {
  healthy: boolean;
  failures: number;
  lastFailure?: number;
  cooldownUntil?: number;
};

export const RETRY_MAX_RETRIES = 4;
export const RETRY_BASE_DELAY_MS = 500;
export const RETRY_MAX_DELAY_MS = 30000;

export const PROVIDER_COOLDOWN_MS = 60000;

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const parseRetryAfter = (
  value: string | null
): number | undefined => {
  if (!value) return;

  const seconds = Number(value);

  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const date = Date.parse(value);

  if (Number.isNaN(date)) return;

  return Math.max(0, date - Date.now());
};

export const computeBackoffDelay = (
  attempt: number,
  retryAfterMs?: number
): number => {
  const cap = Math.min(
    RETRY_BASE_DELAY_MS * 2 ** attempt,
    RETRY_MAX_DELAY_MS
  );

  const jitter = cap / 2 + Math.random() * (cap / 2);

  return Math.min(
    Math.max(jitter, retryAfterMs ?? 0),
    RETRY_MAX_DELAY_MS
  );
};