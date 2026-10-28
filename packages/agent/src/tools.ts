import { Type } from "@earendil-works/pi-ai";
import { defineExtension, defineTool } from "@earendil-works/pi-durable";

export const SERVICE_STATUS_SECONDS = 8;

/**
 * A slow, read-only status check. It takes about 8 seconds so there is time to `kill -9` the process while it runs.
 *
 * `replay: "safe"` is how pi-durable is told a tool may run again after a crash. Without it, an interrupted call is
 * answered to the model with an `interrupted` error result instead of being rerun (README, "Tools").
 */
export const serviceStatus = defineTool({
  name: "service_status",
  description: "Check the live status of the checkout service. Slow: takes several seconds.",
  parameters: Type.Object({}),
  replay: "safe",
  execute: async (_args, api, context) => {
    const signal = context.abortSignal;
    for (let second = 1; second <= SERVICE_STATUS_SECONDS; second++) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 1000);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(signal.reason instanceof Error ? signal.reason : new Error("aborted"));
          },
          { once: true },
        );
      });
      const line = `service_status: ${second}s / ${SERVICE_STATUS_SECONDS}s (pid ${process.pid})`;
      console.log(line);
      api.output(`${line}\n`); // committed as running output, at most every 100 ms
    }
    const status = { checkout: "degraded" } as const;
    return {
      output: [{ type: "text", text: JSON.stringify(status) }],
      details: status,
    };
  },
});

export const Incident = defineExtension({
  name: "incident",
  tools: [serviceStatus],
});
