"use client";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { stamp } from "@/lib/format";
import type { AiLogRecord } from "@/lib/types";

/** One badge variant per uploadAiLog stage. Same colors the old map carried. */
const STAGE_VARIANT: Record<string, BadgeVariant> = {
  signal: "neutral",
  thesis_match: "neutral",
  sizing: "warn",
  order: "accent",
  rejection: "bad",
  attribution: "ok",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    // 64px at 360px, where a 76px label column pushed the value into a two
    // character ribbon. The wider column comes back at sm.
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 sm:grid-cols-[76px_minmax(0,1fr)]">
      <span className="pt-0.5 font-mono text-[10px] uppercase tracking-wide text-mut">{label}</span>
      <span className="break-words font-mono text-[11px] leading-relaxed text-ink/85">{value}</span>
    </div>
  );
}

interface Props {
  logs: AiLogRecord[];
  /**
   * The store's own count of records the exchange has not accepted. It can be
   * higher than what this list shows, because the queue holds every record from
   * the round and this panel renders the current session's stream.
   */
  queueDepth?: number;
}

export default function DecisionLog({ logs, queueDepth }: Props) {
  const queued = queueDepth ?? logs.filter((l) => l.queued).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>uploadAiLog stream</CardTitle>
        <span className="text-[11px] text-mut">
          {queued > 0 ? `${queued} queued for allowlist` : "all receipts accepted"}
        </span>
      </CardHeader>

      <p className="border-b border-line px-4 py-2 font-mono text-[10px] text-mut">
        POST /capi/v3/order/uploadAiLog
      </p>

      {logs.length === 0 ? (
        <div className="space-y-2 px-4 py-6">
          <p className="text-sm leading-relaxed text-mut">
            No record has been written to the exchange yet. Run a signal in the queue and the body
            this panel posts, stage, model, input, output and the explanation, fills in here before
            the order leaves.
          </p>
          <p className="font-mono text-[11px] text-mut">
            stage · model · input · output · explanation, 1000 character cap
          </p>
        </div>
      ) : (
        <ul className="max-h-[35rem] divide-y divide-line overflow-y-auto">
          {logs.map((log) => (
            <li key={log.id} className="space-y-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <Badge variant={STAGE_VARIANT[log.stage] ?? "neutral"} className="uppercase">
                  {log.stage}
                </Badge>
                <span className="truncate font-mono text-[11px] text-mut" title={log.thesisId}>
                  {log.thesisId}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-mut">
                  {stamp(log.postedAt)}
                </span>
              </div>

              <Field label="model" value={log.model} />
              <Field label="input" value={log.input} />
              <Field label="output" value={log.output} />
              <Field label="explain" value={log.explanation} />
              <Field label="orderId" value={log.orderId ?? "null"} />

              {log.weexResponse ? (
                <p className="rounded border border-ok/30 bg-ok/5 px-2 py-1.5 font-mono text-[10px] break-words text-ok">
                  WEEX {JSON.stringify(log.weexResponse)}
                </p>
              ) : (
                <p className="rounded border border-warn/30 bg-warn/5 px-2 py-1.5 font-mono text-[10px] text-warn">
                  queued locally, UID not on the uploadAiLog allowlist yet, replays in order on
                  approval
                </p>
              )}

              <p className="font-mono text-[10px] text-mut">
                {log.explanation.length} / 1000 characters
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
