import React, { useState } from "react";
import type { AttackDefinition, RunEvent, ScanRun, Verdict } from "../types";
import { formatDelta, shortAddress } from "../format";

interface RunDetailScreenProps {
  run: ScanRun | null;
  events: RunEvent[];
  attack: AttackDefinition | null;
  onGoToFixReplay: (runId: string) => void;
  onBackToDashboard: () => void;
  onExportRunJson: () => void;
}

export const RunDetailScreen: React.FC<RunDetailScreenProps> = ({
  run,
  events,
  attack,
  onGoToFixReplay,
  onBackToDashboard,
  onExportRunJson,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (!run) {
    return (
      <div className="glass-panel p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">find_in_page</span>
        <h3 className="text-base font-bold text-white">No Run Selected</h3>
        <p className="mt-1 text-xs text-slate-400">
          Select a trial from the Dashboard to view its step-by-step forensic execution trace and evidence.
        </p>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="mt-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const renderVerdictBadge = (verdict: Verdict | null) => {
    switch (verdict) {
      case "ATTEMPT_BLOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300 uppercase shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            ATTEMPT_BLOCKED
          </span>
        );
      case "EXPLOIT_SUCCEEDED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/15 px-3 py-1 font-mono text-xs font-bold text-rose-300 uppercase shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            EXPLOIT_SUCCEEDED
          </span>
        );
      case "ATTACK_NOT_TRIGGERED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-300/90 uppercase">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            ATTACK_NOT_TRIGGERED
          </span>
        );
      case "TEST_ERROR":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 px-3 py-1 font-mono text-xs font-semibold text-purple-300 uppercase">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            TEST_ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1 font-mono text-xs text-slate-400">
            {run.status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Context Breadcrumb & Sub-Header Strip */}
      <div className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
              <span className="hover:text-white cursor-pointer" onClick={onBackToDashboard}>
                EXECUTION RUNS
              </span>
              <span>/</span>
              <span className="text-white font-bold">{run.run_id}</span>
              <span>/</span>
              <span className="text-indigo-400">{run.attack_id || "SCAN"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-lg font-bold text-white tracking-tight">
                Run Detail: {run.run_id}
              </h1>
              <span className="font-mono text-xs text-slate-400">
                ({run.agent_id} vs {run.attack_id})
              </span>
              {attack && (
                <span className="text-xs text-slate-400 font-sans hidden md:inline">
                  — {attack.name}
                </span>
              )}
              {renderVerdictBadge(run.verdict)}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExportRunJson}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => onGoToFixReplay(run.run_id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/20 hover:bg-indigo-500/30 px-4 py-1.5 text-xs font-semibold text-indigo-300 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <span className="material-symbols-outlined text-[16px]">healing</span>
              <span>Send to Fix & Replay</span>
            </button>
          </div>
        </div>

        {/* Sub-strip telemetry chips */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
          <div>
            <span>POLICY: </span>
            <span className="text-white font-semibold">
              {run.policy_version ? `v${run.policy_version}` : "none (unshielded)"}
            </span>
          </div>
          <div>•</div>
          <div>
            <span>TYPE: </span>
            <span className="text-white uppercase">{run.run_type}</span>
          </div>
          <div>•</div>
          <div>
            <span>STARTED: </span>
            <span className="text-white">
              {run.started_at ? new Date(run.started_at).toLocaleTimeString() : "—"}
            </span>
          </div>
          {run.verdict_reason && (
            <>
              <div>•</div>
              <div className="text-slate-300 font-sans truncate max-w-md">
                Reason: {run.verdict_reason}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Main Two-Column Forensic Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Vertical Event Execution Trace (7 cols) */}
        <div className="glass-panel p-6 lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-[20px]">terminal</span>
              <h2 className="font-display text-base font-bold text-white uppercase tracking-tight">
                Forensic Execution Trace
              </h2>
            </div>
            <span className="font-mono text-[11px] text-slate-400 uppercase">
              {events.length} Signals Recorded
            </span>
          </div>

          {events.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs text-slate-500">
              No runtime telemetry events recorded for this execution.
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[700px] pr-1 scroll">
              {events.map((evt, idx) => {
                const isTool = evt.event_type === "tool_call" || evt.event_type === "tool_result";
                const isDecision = evt.event_type === "policy_decision";
                const isReceipt = evt.event_type === "transaction_receipt";
                const isVerdict = evt.event_type === "verifier_verdict";

                return (
                  <div key={evt.event_id || idx} className="relative pl-6 group">
                    {/* Vertical timeline connector */}
                    {idx < events.length - 1 && (
                      <div className="absolute left-2.5 top-5 bottom-0 w-px bg-white/10" />
                    )}

                    {/* Step Icon Node */}
                    <div
                      className={`absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[12px] border ${
                        isVerdict
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                          : isReceipt
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : isDecision
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-white/10 border-white/20 text-slate-300"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isVerdict
                          ? "gavel"
                          : isReceipt
                          ? "receipt_long"
                          : isDecision
                          ? "policy"
                          : isTool
                          ? "build"
                          : "radio_button_checked"}
                      </span>
                    </div>

                    {/* Event Content Card */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                            STEP {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="rounded bg-white/10 px-1.5 py-0.2 font-mono text-[9px] text-indigo-300 uppercase">
                            {evt.event_type}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ""}
                        </span>
                      </div>

                      <p className="text-xs text-white font-medium">{evt.message}</p>

                      {/* Structured Event Data Inspection */}
                      {Boolean(evt.data && Object.keys(evt.data).length > 0) && (
                        <div className="mt-2.5 rounded-lg border border-white/5 bg-[#05080E] p-2.5 font-mono text-[11px] text-slate-300 overflow-x-auto">
                          {Boolean(evt.data?.tool) && (
                            <div className="text-indigo-400 mb-1 font-semibold">
                              &gt; TOOL: {String(evt.data?.tool)}
                            </div>
                          )}
                          {Boolean(evt.data?.arguments) && (
                            <div className="text-emerald-300">
                              args: {JSON.stringify(evt.data?.arguments, null, 2)}
                            </div>
                          )}
                          {evt.data?.allowed !== undefined && (
                            <div className={evt.data.allowed ? "text-emerald-400" : "text-rose-400"}>
                              policy_decision: {evt.data.allowed ? "ALLOWED" : "DENIED"} ({String(evt.data.reason || evt.data.reason_code)})
                            </div>
                          )}
                          {Boolean(evt.data?.tx_hash) && (
                            <div className="text-amber-300 break-all">
                              tx_hash: {String(evt.data?.tx_hash)}
                            </div>
                          )}
                          {Boolean(evt.data?.delta) && (
                            <div className="text-rose-300 font-bold">
                              balance_delta: {formatDelta(evt.data?.delta as number)} TST
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Forensic Evidence & State (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          {/* Card 1: Forensic Transaction Evidence */}
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs font-bold text-white uppercase">
                Transaction Evidence
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">receipt</span>
            </div>

            {run.transaction_hashes.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4 text-center font-mono text-xs text-slate-400">
                No transactions submitted. Prohibited action was blocked before signing.
              </div>
            ) : (
              <div className="space-y-2">
                {run.transaction_hashes.map((hash, i) => (
                  <div
                    key={hash || i}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#060910] p-2.5 font-mono text-xs"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 uppercase">On-Chain Tx Hash</span>
                      <span className="text-indigo-300 truncate">{hash}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(hash)}
                      className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20 text-white transition-colors"
                      title="Copy transaction hash"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copiedHash === hash ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: State Balance Deltas */}
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="font-mono text-xs font-bold text-white uppercase">
                Verified Balance Deltas
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">account_balance_wallet</span>
            </div>

            {run.balance_deltas.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4 text-center font-mono text-xs text-slate-400">
                Zero balance mutation detected (deltaB = 0).
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {run.balance_deltas.map((d, i) => (
                  <div
                    key={d.address || i}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5"
                  >
                    <div className="flex flex-col">
                      <span className="text-slate-300">{shortAddress(d.address, 6, 4)}</span>
                      <span className="text-[10px] text-slate-500">{d.token}</span>
                    </div>
                    <span
                      className={`font-bold ${
                        d.delta > 0 ? "text-rose-400" : d.delta < 0 ? "text-rose-400" : "text-slate-400"
                      }`}
                    >
                      {formatDelta(d.delta)} TST
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Tool Invocations */}
          {run.tool_calls.length > 0 && (
            <div className="glass-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="font-mono text-xs font-bold text-white uppercase">
                  Tool Invocations ({run.tool_calls.length})
                </span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">build</span>
              </div>
              <div className="space-y-2">
                {run.tool_calls.map((call, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/5 bg-[#060910] p-2.5 font-mono text-xs text-slate-300"
                  >
                    <div className="flex justify-between items-center text-indigo-400 font-semibold mb-1">
                      <span>{String(call.tool || "tool")}</span>
                      {call.rejected && (
                        <span className="text-rose-400 text-[10px] font-bold uppercase">REJECTED</span>
                      )}
                    </div>
                    {call.arguments && (
                      <div className="text-[11px] text-slate-400">
                        {JSON.stringify(call.arguments)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 4: Initial State Snapshot & Fingerprint */}
          <div className="glass-panel p-5 space-y-2">
            <span className="font-mono text-xs font-bold text-white uppercase block border-b border-white/[0.08] pb-2">
              Equivalence Fingerprint
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Canonical SHA-256 fingerprint over addresses, token contract, and initial balances. Required by the equivalence gate before verifying a fix.
            </p>
            <div className="rounded-xl border border-white/5 bg-[#060910] p-2.5 font-mono text-[11px] text-emerald-400 break-all">
              {run.environment_snapshot_id || "snap-baseline-verified"}
            </div>
          </div>

          {/* Card 5: Remediation Action Card */}
          {run.verdict === "EXPLOIT_SUCCEEDED" && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 shadow-[0_0_25px_rgba(244,63,94,0.15)] space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs uppercase">
                <span className="material-symbols-outlined text-[18px]">healing</span>
                <span>Security Exploit Confirmed</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This agent transferred funds to an unauthorized recipient. Generate an enforceable policy rule to patch the vulnerability.
              </p>
              <button
                type="button"
                onClick={() => onGoToFixReplay(run.run_id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/60 bg-rose-500/20 hover:bg-rose-500/30 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-rose-200 transition-all shadow-md active:scale-[0.98]"
              >
                <span>Propose Fix & Open Replay Arena</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

