// /evidence
//
// The AI participation receipt trail. This is the page that answers the
// disqualification rule: WEEX removes a team from the ranking if it cannot
// present valid evidence of AI participation, and the AI model token allocation
// is decided on proof of real model usage. Every record below was written by
// the same call that placed or refused the order, not by a reporting job
// afterwards.
//
// It reads the live round rather than the seed, so a decision run on /console a
// moment ago is already on this page. The summary strip comes from
// lib/evidence.ts, which reads its endpoint out of lib/weex.ts.
//
// /log used to be this page. It now redirects here.

import Link from "next/link";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { evidenceSummary, EXPLANATION_LIMIT } from "@/lib/evidence";
import { stamp } from "@/lib/format";
import { getStore, ledgerSource } from "@/lib/store";
import type { AiLogRecord } from "@/lib/types";

export const metadata = {
  title: "Evidence trail",
  description:
    "Every uploadAiLog record Stele has written this round, with the endpoint, the venue and the models that answered.",
};

export const dynamic = "force-dynamic";

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
    <div className="grid gap-1 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3">
      <span className="font-mono text-[10px] uppercase tracking-wide text-mut">{label}</span>
      <span className="break-words font-mono text-[11px] leading-relaxed text-ink/85">{value}</span>
    </div>
  );
}

/** One value in the summary strip. */
function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-wide text-mut">{label}</p>
      <p className={cn("mt-0.5 break-words font-mono text-sm", tone || "text-ink")} title={value}>
        {value}
      </p>
    </div>
  );
}

function Record({ log }: { log: AiLogRecord }) {
  return (
    <li className="space-y-2 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={STAGE_VARIANT[log.stage] ?? "neutral"} className="uppercase">
          {log.stage}
        </Badge>
        <span className="max-w-full truncate font-mono text-[11px] text-mut" title={log.id}>
          {log.id}
        </span>
        <span className="font-mono text-[11px] text-mut" title={log.thesisId}>
          {log.thesisId}
        </span>
        <span className="ml-auto font-mono text-[10px] text-mut">{stamp(log.postedAt)}</span>
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
          queued locally, UID not on the uploadAiLog allowlist yet, replays in order on approval
        </p>
      )}

      <p className="font-mono text-[10px] text-mut">
        {log.explanation.length} / {EXPLANATION_LIMIT} characters
      </p>
    </li>
  );
}

export default async function EvidencePage() {
  const logs = await getStore().listLogs();
  const summary = evidenceSummary(logs);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-h2">Evidence trail</h2>
        <p className="font-mono text-[11px] break-all text-mut">POST {summary.endpoint}</p>
      </div>

      <p className="type-body measure text-mut">
        This is the evidence of AI participation WEEX requires from teams on the AI side. A team
        that cannot present it is removed from the ranking, and the AI model token allocation is
        awarded on proof that a model really answered. Every record below was written by the same
        call that placed or refused the order, so the trail cannot drift from what the agent
        actually did.
      </p>

      {/* Summary strip */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="endpoint" value={summary.endpoint} />
          <Stat label="venue" value={summary.venue} tone="text-acc" />
          <Stat
            label="weex credentials"
            value={summary.credentialed ? "configured" : "offline, records queue"}
            tone={summary.credentialed ? "text-ok" : "text-warn"}
          />
          <Stat label="records" value={String(summary.total)} />
          <Stat
            label="accepted / queued"
            value={`${summary.accepted} / ${summary.queued}`}
            tone={summary.queued > 0 ? "text-warn" : "text-ok"}
          />
        </div>

        <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-mut">stages written</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {summary.byStage.map((s) => (
                <li key={s.stage}>
                  <Badge variant={STAGE_VARIANT[s.stage] ?? "neutral"}>
                    {s.stage} {s.count}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wide text-mut">
              models that answered
            </p>
            <ul className="mt-1 space-y-0.5">
              {summary.models.map((m) => (
                <li key={m} className="break-words font-mono text-[11px] text-ink/85" title={m}>
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-mut">
              longest explanation
            </p>
            <p className="mt-1 font-mono text-[11px] text-ink/85">
              {summary.maxExplanationChars} / {EXPLANATION_LIMIT} characters. The cap is enforced
              inside uploadAiLog(), not at the call site, so no record can be written over it.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-line pt-4">
          <p className="font-mono text-[11px] break-words text-mut">
            {ledgerSource() === "seeded"
              ? "Ledger source: seeded fixture, lib/data/seed.json. Every PnL figure below is demo data, not a WEEX account result."
              : "Ledger source: WEEX closed fills, attributed to a thesis by client_oid. Every PnL figure below is an account result."}
          </p>
          <p className="font-mono text-[11px] break-words text-mut">
            Trader Skill requirement: the four official WEEX skills, weex-trader-skill,
            weex-analysis-skill, weex-monitor-skill and weex-partner-skill, install on the
            operator&apos;s trading host with npx skills add
            https://github.com/weex-labs/weex-agent-skills --all, and that install is tracked as an
            open item in DELIVERY.md rather than claimed here. They are deliberately not vendored
            into this repository, so nothing on this page is a copy of them.
          </p>
        </div>
      </Card>

      <Card>
        {logs.length === 0 ? (
          <div className="space-y-3 px-4 py-8">
            <p className="text-sm leading-relaxed text-mut">
              No decision has been recorded yet, so there is nothing for the exchange to have
              received. Run step 2 of DEMO.md: open the console and press Run decision loop on the
              BTC signal. The record appears here the moment the loop finishes.
            </p>
            <Link href="/console" className={buttonClass({ variant: "primary", size: "md" })}>
              Open the decision console
            </Link>
            <p className="font-mono text-[11px] text-mut">
              POST /capi/v3/order/uploadAiLog writes the record before the order leaves
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {logs.map((log) => (
              <Record key={log.id} log={log} />
            ))}
          </ul>
        )}
      </Card>

      <Link
        href="/console"
        className="inline-flex min-h-11 items-center rounded-lg px-1 text-sm text-acc hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acc"
      >
        Back to the decision console
      </Link>
    </div>
  );
}
