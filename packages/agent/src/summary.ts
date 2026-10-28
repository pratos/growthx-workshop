// One-line summaries of transcript entries, shared by demo.ts (in-process view) and watch.ts (reads the SQLite file).

type Block = { type: string; text?: string; name?: string };
type Message = {
  role?: string;
  content?: string | readonly Block[];
  toolName?: string;
  isError?: boolean;
};

export type EntryLike = {
  id: number | string;
  kind: string;
  model?: readonly Message[] | undefined;
  data?: unknown;
};

function textOf(content: string | readonly Block[] | undefined): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join(" ");
}

function oneLine(text: string, max = 110): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function summarize(entry: EntryLike): string {
  const message = entry.model?.[0];
  switch (entry.kind) {
    case "pi.user":
      return oneLine(textOf(message?.content));
    case "pi.assistant": {
      const blocks = Array.isArray(message?.content) ? message.content : [];
      const calls = blocks
        .filter((block) => block.type === "toolCall")
        .map((block) => String(block.name));
      const text = textOf(message?.content);
      if (calls.length > 0)
        return `tool call: ${calls.join(", ")}${text ? ` — ${oneLine(text, 60)}` : ""}`;
      return oneLine(text);
    }
    case "pi.tool-result":
      return `${message?.toolName ?? "tool"}${message?.isError ? " (error)" : ""} → ${oneLine(textOf(message?.content))}`;
    case "pi.system":
      return "system prompt or tool list changed";
    default:
      return entry.data === undefined ? "" : oneLine(JSON.stringify(entry.data));
  }
}

export function stamp(): string {
  return new Date().toISOString().slice(11, 23);
}
