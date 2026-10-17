export type AIProvider = "openai" | "gemini" | "openai-compatible";

export type AIConfig = {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
};

const STORAGE_KEY = "jee-prep-hub.ai-config.v1";

export function getAIConfig(): AIConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AIConfig>;
    if (!parsed.provider || !parsed.apiKey || !parsed.model) return null;
    return parsed as AIConfig;
  } catch {
    return null;
  }
}

export function saveAIConfig(config: AIConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearAIConfig() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function maskAPIKey(key: string) {
  if (!key) return "";
  if (key.length <= 4) return "••••";
  return `••••••••••••${key.slice(-4)}`;
}

function normaliseBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

async function parseJSON(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function requestOpenAI(config: AIConfig, prompt: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: prompt,
    }),
  });

  const data = await parseJSON(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed.");
  }

  if (typeof data?.output_text === "string") return data.output_text;

  const output = Array.isArray(data?.output) ? data.output : [];
  const text = output
    .flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
    .map((item: any) => item?.text)
    .filter(Boolean)
    .join("\n");

  if (!text) throw new Error("OpenAI returned an empty response.");
  return text;
}

async function requestGemini(config: AIConfig, prompt: string) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await parseJSON(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini request failed.");
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part?.text)
    .filter(Boolean)
    .join("\n");

  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

async function requestOpenAICompatible(config: AIConfig, prompt: string) {
  const baseUrl = normaliseBaseUrl(config.baseUrl || "");
  if (!baseUrl) throw new Error("A custom base URL is required for this provider.");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });

  const data = await parseJSON(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || "Compatible AI request failed.");
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Compatible provider returned an empty response.");
  return text;
}

export async function generateAIResponse(prompt: string, config = getAIConfig()) {
  if (!config) throw new Error("AI is not configured. Add an API key in Settings.");

  if (config.provider === "openai") return requestOpenAI(config, prompt);
  if (config.provider === "gemini") return requestGemini(config, prompt);
  return requestOpenAICompatible(config, prompt);
}

export async function testAIConnection(config: AIConfig) {
  const text = await generateAIResponse(
    "Respond with exactly: OK",
    config,
  );
  return /\bok\b/i.test(text.trim());
}
