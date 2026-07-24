export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",

  cookieSecret: process.env.JWT_SECRET ?? "",

  databaseUrl: process.env.DATABASE_URL ?? "",

  mongoUrl:
    process.env.MONGO_URL ??
    process.env.DATABASE_URL ??
    "",


  oAuthServerUrl:
    process.env.OAUTH_SERVER_URL ?? "",

  ownerOpenId:
    process.env.OWNER_OPEN_ID ?? "",


  isProduction:
    process.env.NODE_ENV === "production",


  forgeApiUrl:
    process.env.BUILT_IN_FORGE_API_URL ??
    process.env.FORGE_API_URL ??
    "",

  forgeApiKey:
    process.env.BUILT_IN_FORGE_API_KEY ??
    process.env.FORGE_API_KEY ??
    "",


  // ─── Ollama ───

  ollamaBaseUrl:
    process.env.OLLAMA_BASE_URL ??
    "http://localhost:11434",

  ollamaApiKey:
    process.env.OLLAMA_API_KEY ?? "",

  ollamaModel:
    process.env.OLLAMA_MODEL ??
    "llama3.2:1b",

  ollamaKeepAlive:
    process.env.OLLAMA_KEEP_ALIVE ??
    "30m",


  // ─── Groq ───

  groqApiKey:
    process.env.GROQ_API_KEY ?? "",

  groqModel:
    process.env.GROQ_MODEL ??
    "llama-3.1-8b-instant",


  // ─── OpenRouter ───

  openrouterBaseUrl:
    process.env.OPENROUTER_BASE_URL ??
    "https://openrouter.ai/api/v1",

  openrouterApiKey:
    process.env.OPENROUTER_API_KEY ?? "",

  openrouterModel:
    process.env.OPENROUTER_MODEL ??
    "meta-llama/llama-3.1-8b-instruct",


  // ─── AI Settings ───

  aiRequestTimeout:
    process.env.AI_REQUEST_TIMEOUT ??
    "30000",
};