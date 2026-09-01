import { AppError } from "../../../shared/errors/AppError";

// Falls back to the public DashScope endpoint (mainland China) if ALIYUN_BASE_URL isn't set;
// account-specific MaaS deployments (e.g. Model Studio) should set ALIYUN_BASE_URL instead.
const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
const DEFAULT_MODEL = "qwen3.8-max";
const GENERATION_PATH = "/services/aigc/multimodal-generation/generation";

export interface AliyunContentPart {
  text?: string;
  image?: string;
}

export interface AliyunMessage {
  role: "system" | "user" | "assistant";
  content: AliyunContentPart[];
}

export interface AliyunGenerationOptions {
  model?: string;
  timeoutMs?: number;
}

function getAliyunApiKey(): string {
  const key = process.env.ALIYUN_API_KEY?.trim();
  if (!key) {
    throw new AppError("ALIYUN_API_KEY_NOT_CONFIGURED", "ALIYUN_API_KEY is not configured", 500);
  }
  return key;
}

function getAliyunBaseUrl(): string {
  return process.env.ALIYUN_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

function getAliyunModel(): string {
  return process.env.ALIYUN_MODEL?.trim() || DEFAULT_MODEL;
}

// Calls Aliyun DashScope's multimodal-generation API (text and/or image input) and returns the reply text.
export async function generate(
  messages: AliyunMessage[],
  options: AliyunGenerationOptions = {},
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  try {
    const response = await fetch(`${getAliyunBaseUrl()}${GENERATION_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAliyunApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model ?? getAliyunModel(),
        input: { messages },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AppError(
        "ALIYUN_REQUEST_FAILED",
        `Aliyun DashScope request failed with status ${response.status}: ${detail}`,
        502,
      );
    }

    const data = (await response.json()) as {
      output?: { choices?: { message?: { content?: AliyunContentPart[] } }[] };
    };
    const parts = data.output?.choices?.[0]?.message?.content;
    const text = parts?.map((part) => part.text).filter(Boolean).join("");
    if (!text) {
      throw new AppError("ALIYUN_EMPTY_RESPONSE", "Aliyun DashScope returned no message content", 502);
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

// Minimal connectivity check: confirms the API key and network path to Aliyun DashScope both work.
export async function testConnection(): Promise<boolean> {
  await generate([{ role: "user", content: [{ text: "ping" }] }], { timeoutMs: 5_000 });
  return true;
}

