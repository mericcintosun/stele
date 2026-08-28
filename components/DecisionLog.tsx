"use client";

import { stamp } from "@/lib/format";
import type { AiLogRecord } from "@/lib/types";

const STAGE_STYLE: Record<string, string> = {
  signal: "border-line bg-panel2 text-mut",
  thesis_match: "border-line bg-panel2 text-mut",
  sizing: "border-warn/40 bg-warn/10 text-warn",
  order: "border-acc/40 bg-acc/10 text-acc",
  rejection: "border-bad/40 bg-bad/10 text-bad",
  attribution: "border-ok/40 bg-ok/10 text-ok",
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
    <section className="rounded-xl border border-line bg-panel">
      <header className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">uploadAiLog stream</h2>
        <span className="text-[11px] text-mut">
          {queued > 0 ? `${queued} queued for allowlist` : "all receipts accepted"}
        </span>
      </header>

      <p className="border-b border-line px-4 py-2 font-mono text-[10px] text-mut">
        POST /capi/v3/order/uploadAiLog
      </p>

      {logs.length === 0 ? (
        <p className="px-4 py-6 text-sm text-mut">
          No record has been written to the exchange yet. Run a signal in the queue and the body
          this panel posts, stage, model, input, output and the explanation, fills in here before
          the order leaves.
        </p>
      ) : (
        <ul className="max-h-[35rem] divide-y divide-line overflow-y-auto">
          {logs.map((log) => (
            <li key={log.id} className="space-y-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${STAGE_STYLE[log.stage] ?? STAGE_STYLE.signal}`}
                >
                  {log.stage}
                </span>
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
    </section>
  );
}
