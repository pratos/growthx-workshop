import { createModels } from "@earendil-works/pi-ai/models";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import { openrouterProvider } from "@earendil-works/pi-ai/providers/openrouter";
import { fauxAssistantMessage, fauxProvider, fauxText } from "@earendil-works/pi-ai";
import type { ModelRef } from "@earendil-works/pi-durable";

/**
 * Provider by which key is in the environment, in this order: ANTHROPIC_API_KEY (Anthropic, claude-sonnet-5-5),
 * OPENROUTER_API_KEY (the same model through OpenRouter), OPENAI_API_KEY (OpenAI). `AGENT_MODEL=provider/modelId`
 * overrides the model id. pi-ai reads the key from the environment itself; this code never touches its value.
 */
export function chooseModel(): { models: ReturnType<typeof createModels>; model: ModelRef } {
  const models = createModels();
  const override = process.env.AGENT_MODEL?.split("/");
  const pick = (provider: string, modelId: string): ModelRef =>
    override && override[0] === provider && override.length > 1
      ? { provider, modelId: override.slice(1).join("/") }
      : { provider, modelId };
  if (process.env.ANTHROPIC_API_KEY) {
    models.setProvider(anthropicProvider());
    return { models, model: pick("anthropic", "claude-sonnet-5-5") };
  }
  if (process.env.OPENROUTER_API_KEY) {
    models.setProvider(openrouterProvider());
    return { models, model: pick("openrouter", "anthropic/claude-sonnet-5.5") };
  }
  if (process.env.OPENAI_API_KEY) {
    models.setProvider(openaiProvider());
    return { models, model: pick("openai", "gpt-5.4-mini") };
  }
  throw new Error(
    "Set ANTHROPIC_API_KEY (or OPENROUTER_API_KEY, or OPENAI_API_KEY) in the environment.",
  );
}

// How many times the faux model has been asked, so a test can prove a restart answered from the store.
let fauxCalls = 0;
export const fauxCallCount = () => fauxCalls;

/**
 * The same choice, but with no key (or AGENT_MODEL=faux) a faux model answers instead of throwing: it echoes the
 * question back as a short reply, deterministically, through the same pi-durable harness, checkpoints and all. For
 * local testing, end-to-end tests and the expect tests; set a key for real answers.
 */
export function chooseModelOrFaux(): { models: ReturnType<typeof createModels>; model: ModelRef; faux: boolean } {
  const wantsFaux = process.env.AGENT_MODEL === "faux";
  if (!wantsFaux && (process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY)) {
    return { ...chooseModel(), faux: false };
  }
  const models = createModels();
  const handle = fauxProvider();
  models.setProvider(handle.provider);
  const reply = (context: { messages: ReadonlyArray<{ role: string; content: unknown }> }) => {
    fauxCalls += 1;
    const last = [...context.messages].reverse().find((m) => m.role === "user");
    const text = typeof last?.content === "string" ? last.content
      : Array.isArray(last?.content) ? last.content.map((b: { type?: string; text?: string }) => (b.type === "text" ? b.text : "")).join(" ") : "";
    return fauxAssistantMessage([fauxText(`On "${text.trim()}": noted. (faux model; set ANTHROPIC_API_KEY for a real answer)`)]);
  };
  // Enough scripted turns for a long local session; each one answers whatever was asked.
  handle.setResponses(Array.from({ length: 10_000 }, () => reply as never));
  const m = handle.getModel();
  return { models, model: { provider: m.provider, modelId: m.id }, faux: true };
}
