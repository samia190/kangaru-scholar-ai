import type { InvokeParams, InvokeResult } from "../llm";

import type { AIProvider } from "./provider";
import { OllamaProvider } from "./ollama";
import { GroqProvider } from "./groq";
import { OpenRouterProvider } from "./openrouter";
type ProviderHealth = {
  healthy: boolean;
  failures: number;
  lastFailure?: number;
};

export type ProviderStatus = {
  name: string;
  configured: boolean;
  healthy: boolean;
  failures: number;
  lastFailure?: number;
};
const MAX_FAILURES = 3;
const HEALTH_RESET_MS = 60_000; // 1 minute
export class ProviderManager {
  private readonly providers: AIProvider[];
  private readonly health = new Map<string, ProviderHealth>();

  constructor() {
  this.providers = [
    new OllamaProvider(),
    new GroqProvider(),
    new OpenRouterProvider(),
  ];

  for (const provider of this.providers) {
    this.health.set(provider.name, {
      healthy: true,
      failures: 0,
    });
  }
}
  private getHealth(provider: AIProvider): ProviderHealth {
  const health = this.health.get(provider.name);

  if (!health) {
    throw new Error(
      `[ProviderManager] Missing health state for ${provider.name}`
    );
  }

  return health;
}

private markSuccess(provider: AIProvider): void {
  const health = this.getHealth(provider);

  health.healthy = true;
  health.failures = 0;
  delete health.lastFailure;
}
private markFailure(provider: AIProvider): void {
  const health = this.getHealth(provider);

  health.failures++;
  health.lastFailure = Date.now();

  if (health.failures >= MAX_FAILURES) {
    health.healthy = false;
  }
}
private isHealthy(provider: AIProvider): boolean {
  const health = this.getHealth(provider);

  if (health.healthy) {
    return true;
  }

  if (
    health.lastFailure &&
    Date.now() - health.lastFailure >= HEALTH_RESET_MS
  ) {
    health.healthy = true;
    health.failures = 0;
    delete health.lastFailure;

    return true;
  }

  return false;
}
async invoke(params: InvokeParams): Promise<InvokeResult> {
  let lastError: Error | undefined;

  for (const provider of this.providers) {
    // Skip providers that are not configured
    if (!provider.isConfigured()) {
      console.log(
        `[ProviderManager] Skipping ${provider.name} (not configured)`
      );
      continue;
    }

   
    // Skip unhealthy providers
    if (!this.isHealthy(provider)) {
      console.log(
        `[ProviderManager] Skipping ${provider.name} (unhealthy)`
      );
      continue;
    }

    try {
      console.log(
        `[AI][Manager] Trying ${provider.name}`
      );

      const result = await provider.invoke(params);

      this.markSuccess(provider);

      return result;
    } catch (error) {
      this.markFailure(provider);

      lastError =
        error instanceof Error
          ? error
          : new Error(String(error));

      console.warn(
  `[AI][Manager] ${provider.name} failed: ${lastError.message}`

      );
    }
  }

  throw (
    lastError ??
    new Error("[ProviderManager] No AI providers are available.")
  );
}
getProviderStatus(): ProviderStatus[] {
  return this.providers.map((provider) => {
    const health = this.getHealth(provider);

    return {
      name: provider.name,
      configured: provider.isConfigured(),
      healthy: this.isHealthy(provider),
      failures: health.failures,
      lastFailure: health.lastFailure,
    };
  });
}

}


export const providerManager = new ProviderManager();