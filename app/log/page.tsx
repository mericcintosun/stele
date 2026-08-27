// /log
//
// The full uploadAiLog audit trail. Step 6 of DEMO.md lands here: the refusal
// receipt sits in the same list as the orders, with the queue depth at the top.
//
// The console panel shows the same records in a narrow column. This page shows
// them wide, so a judge can read an explanation without a scrollbar fight.

import Link from "next/link";
import { stamp } from "@/lib/format";
import { getStore } from "@/lib/store";
import type { AiLogRecord } from "@/lib/types";

export const metadata = { title: "Audit trail" };

export const dynamic = "force-dynamic";

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
    <div className="grid gap-1 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3">
      <span className="font-mono text-[10px] uppercase tracking-wide text-mut">{label}</span>
      <div className="overflow-x-auto">
        <span className="font-mono text-[11px] leading-relaxed text-ink/85">{value}</span>
      </div>
    </div>
  );
}

function Record({ log }: { log: AiLogRecord }) {
  return (
    <li className="space-y-2 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
            STAGE_STYLE[log.stage] ?? STAGE_STYLE.signal
          }`}
        >
          {log.stage}
        </span>
        <span className="font-mono text-[11px] text-mut">{log.id}</span>
        <span className="font-mono text-[11px] text-mut">{log.thesisId}</span>
        <span className="ml-auto font-mono text-[10px] text-mut">{stamp(log.postedAt)}</span>
      </div>

      <Field label="model" value={log.model} />
      <Field label="input" value={log.input} />
      <Field label="output" value={log.output} />
      <Field label="explain" value={log.explanation} />
      <Field label="orderId" value={log.orderId ?? "null"} />

      <div className="overflow-x-auto">
        {log.weexResponse ? (
          <p className="inline-block rounded border border-ok/30 bg-ok/5 px-2 py-1.5 font-mono text-[10px] whitespace-nowrap text-ok">
            WEEX {JSON.stringify(log.weexResponse)}
          </p>
        ) : (
          <p className="rounded border border-warn/30 bg-warn/5 px-2 py-1.5 font-mono text-[10px] text-warn">
            queued locally, UID not on the uploadAiLog allowlist yet, replays in order on approval
          </p>
        )}
      </div>

      <p className="font-mono text-[10px] text-mut">{log.explanation.length} / 1000 characters</p>
    </li>
  );
}

export default async function LogPage() {
  const store = getStore();
  const logs = await store.listLogs();
  const queueDepth = await store.queueDepth();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Audit trail</h2>
        <p className="font-mono text-[11px] text-mut">POST /capi/v3/order/uploadAiLog</p>
      </div>

      <p className="max-w-3xl leading-relaxed text-mut">
        Every decision the agent made this round, including the ones it refused. WEEX removes a team
        from the ranking if it cannot produce valid evidence of AI participation, so this list is
        both the compliance record and the memory the capital valve sizes from.
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-panel px-4 py-3 font-mono text-xs">
        <span className="text-mut">
          Records <span className="text-ink">{logs.length}</span>
        </span>
        <span className="text-mut">
          Queue depth{" "}
          <span className={queueDepth > 0 ? "text-warn" : "text-ok"}>{queueDepth}</span>
        </span>
        <span className="text-mut">
          {queueDepth > 0
            ? "waiting on the uploadAiLog allowlist, replayed in postedAt order"
            : "every receipt accepted by the exchange"}
        </span>
        <Link href="/console" className="ml-auto text-acc hover:underline">
          Back to the console
        </Link>
      </div>

      <section className="rounded-xl border border-line bg-panel">
        {logs.length === 0 ? (
          <p className="px-4 py-8 text-sm text-mut">No records written this round yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {logs.map((log) => (
              <Record key={log.id} log={log} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
