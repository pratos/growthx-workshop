import type { StoredEvent } from '../index';

// Rung 2 of the ladder in skills/event-sourcing/references/changing-events.md: upcast on read.
// A v1 DecisionRecorded has no rationale. v2 wants one. The past is not rewritten; it is read through this function,
// which defaults the rationale from the last reply before the decision. Pure, cheap, runs on every read.
type Upcaster = (event: StoredEvent, stream: readonly StoredEvent[]) => StoredEvent;
const upcasters: Record<string, Upcaster> = {
  DecisionRecorded: (e, stream) => {
    const d = e.data as Record<string, unknown>;
    if (typeof d.rationale === 'string') return e;
    const lastReply = stream.toReversed().find((x) => x.type === 'ReplyPosted' && x.version < e.version && (x.data as { threadId: string }).threadId === d.threadId);
    return { ...e, data: { ...d, rationale: lastReply ? (lastReply.data as { body: string }).body : '' } } as StoredEvent;
  },
};

export function upcast(stream: readonly StoredEvent[]): StoredEvent[] {
  return stream.map((e) => (upcasters[e.type] ? upcasters[e.type]!(e, stream) : e));
}
