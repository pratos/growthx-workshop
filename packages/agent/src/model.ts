import { createModels } from "@earendil-works/pi-ai/models";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import { openrouterProvider } from "@earendil-works/pi-ai/providers/openrouter";
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
