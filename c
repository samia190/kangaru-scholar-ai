[OAuth] Initialized with baseURL: 
[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable.
(node:14204) [DEP0205] DeprecationWarning: `module.register()` is deprecated. Use `module.registerHooks()` instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[MongoDB] Failed to connect: Error: querySrv ECONNREFUSED _mongodb._tcp.aiassistant.bnd3x4f.mongodb.net
    at QueryReqWrap.onresolve [as oncomplete] (node:internal/dns/promises:293:17) {
  errno: undefined,
  code: 'ECONNREFUSED',
  syscall: 'querySrv',
  hostname: '_mongodb._tcp.aiassistant.bnd3x4f.mongodb.net'
}
Server running on http://localhost:3000/
(!) %VITE_ANALYTICS_ENDPOINT% is not defined in env variables found in /guest-chat. Is the variable mistyped?
(!) %VITE_ANALYTICS_WEBSITE_ID% is not defined in env variables found in /guest-chat. Is the variable mistyped?
[baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
Malformed URI sequence in request URL: /%VITE_ANALYTICS_ENDPOINT%/umami
URIError: Failed to decode param '/%VITE_ANALYTICS_ENDPOINT%/umami'
    at decodeURIComponent (<anonymous>)
    at decode_param (C:\Users\hp\Downloads\kangaru-scholar-ai-mongodb\kangaru-scholar-ai\node_modules\.pnpm\express@4.21.2\node_modules\express\lib\router\layer.js:172:12)
    at Layer.match (C:\Users\hp\Downloads\kangaru-scholar-ai-mongodb\kangaru-scholar-ai\node_modules\.pnpm\express@4.21.2\node_modules\express\lib\router\layer.js:123:27)
    at matchLayer (C:\Users\hp\Downloads\kangaru-scholar-ai-mongodb\kangaru-scholar-ai\node_modules\.pnpm\express@4.21.2\node_modules\express\lib\router\index.js:585:18)
    at Immediate.next [as _onImmediate] (C:\Users\hp\Downloads\kangaru-scholar-ai-mongodb\kangaru-scholar-ai\node_modules\.pnpm\express@4.21.2\node_modules\express\lib\router\index.js:226:15)
    at process.processImmediate (node:internal/timers:506:21)
(!) %VITE_ANALYTICS_ENDPOINT% is not defined in env variables found in /favicon.ico. Is the variable mistyped?
(!) %VITE_ANALYTICS_WEBSITE_ID% is not defined in env variables found in /favicon.ico. Is the variable mistyped?
[Auth] Missing session cookie
[AI][LLM] Invoking LLM { model: undefined, messageCount: 3, tools: 0 }
[AI][LLM] Calling ProviderManager.invoke
[AI][Manager] Trying ollama
[AI][Ollama] Calling llama3.2:1b (http://localhost:11434/v1/chat/completions)
[AI][Ollama] Network error • Retry 1/4
[AI][Ollama] Network error • Retry 2/4
[AI][Ollama] Network error • Retry 3/4
[AI][Ollama] Network error • Retry 4/4
[AI][Manager] ollama failed: This operation was aborted
[ProviderManager] Skipping groq (not configured)
[ProviderManager] Skipping openrouter (not configured)
[GuestChat] Error: [DOMException [AbortError]: This opera