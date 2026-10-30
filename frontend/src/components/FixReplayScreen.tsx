import React, { useState } from "react";
import type { Comparison, Policy, PolicyTemplate, RegressionResult, ReplayResult, ScanRun } from "../types";
import { formatDelta } from "../format";

interface FixReplayScreenProps {
  originalRun: ScanRun | null;
  policy: Policy | null;
  policyTemplate: PolicyTemplate | null;
  policyNote: string | null;
  activeVersions: string[];
  isProposing: boolean;
  onProposePolicy: () => void;
  isApplying: boolean;
  onApplyPolicy: () => void;
  isReplaying: boolean;
  onRunReplay: () => void;
  replayResult: ReplayResult | null;
  comparison: Comparison | null;
  onExportReport: () => void;
  onBackToDashboard: () => void;
}

export const FixReplayScreen: React.FC<FixReplayScreenProps> = ({
  originalRun,
  policy,
  policyTemplate,
  policyNote,
  activeVersions,
  isProposing,
  onProposePolicy,
  isApplying,
  onApplyPolicy,
  isReplaying,
  onRunReplay,
  replayResult,
  comparison,
  onExportReport,
  onBackToDashboard,
}) => {
  const [activeView, setActiveView] = useState<"side-by-side" | "diff">("side-by-side");

  // Replay details
  const replayRun = replayResult?.replay_run ?? comparison?.replay ?? null;
  const regression: RegressionResult | null = replayResult?.regression ?? comparison?.regression ?? null;
  const proof = replayResult?.proof_status ?? comparison?.proof_status ?? null;
  const equivalence = comparison?.state_equivalence ?? null;

  // Strict verified gate: Only display proof banner when backend returned verified true
  const isVerified = Boolean(proof?.verified || regression?.fix_status === "VERIFIED");

  if (!originalRun) {
    return (
      <div className="glass-panel p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">published_with_changes</span>
        <h3 className="text-base font-bold text-white">No Target Run Selected for Replay</h3>
        <p className="mt-1 text-xs text-slate-400">
          Select an exploited run from the Dashboard or Run Detail to stage a policy fix and verify it via replay.
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

  return (
    <div className="space-y-6">
      {/* 1. HIGH-VISIBILITY PROOF BANNER: Displays ONLY when verified */}
      {isVerified && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(16,185,129,0.25)] animate-slidein">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <span className="material-symbols-outlined text-[28px]">verified_user</span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-500/25 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                    SIMULATION VALIDATED [EVM EQUIVALENCE CONFIRMED]
                  </span>
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">
                  ATTACK BLOCKED · LEGITIMATE TRANSFER PASSED
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  Deterministic execution confirmed. Adversarial payload neutralised while legitimate worker subroutines executed without interruption.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onExportReport}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-emerald-300 transition-all shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Export Audit JSON</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-Header Context Strip */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-400">Target Run:</span>
          <span className="font-mono font-bold text-white">{originalRun.run_id}</span>
          <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-indigo-300">
            {originalRun.attack_id}
          </span>
          {equivalence && (
            <span
              className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                equivalence.equivalent
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              {equivalence.equivalent ? "Fingerprint Match" : "State Mismatched"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            <button
              type="button"
              onClick={() => setActiveView("side-by-side")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeView === "side-by-side"
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">splitscreen</span>
              <span>Side-By-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("diff")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeView === "diff"
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">difference</span>
              <span>Delta Diff</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExportReport}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Candidate Policy Rule / Policy Lab */}
      <div className="glass-panel p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white uppercase tracking-tight">
                  {policy ? `Candidate Policy: ${policy.policy_id}` : "Policy Remediation Lab"}
                </h3>
                {policy && (
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                      policy.status === "applied"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {policy.status === "applied" ? "APPLIED & ENFORCED" : "PROPOSED"}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {policy ? `Type: ${policy.type} · Version ${policy.version}` : "Review & stage enforceable policy rule"}
              </span>
            </div>
          </div>

          {/* Policy Actions Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isProposing}
              onClick={onProposePolicy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-40"
            >
              {isProposing ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Proposing…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span>Propose Fix</span>
                </>
              )}
            </button>

            {policy && policy.status !== "applied" && (
              <button
                type="button"
                disabled={isApplying}
                onClick={onApplyPolicy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-300 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-[0.98] disabled:opacity-40"
              >
                {isApplying ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Applying Rule…</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Apply Fix</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              disabled={isReplaying}
              onClick={onRunReplay}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98] disabled:opacity-40"
            >
              {isReplaying ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Replaying 3x Trials…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Run Replay (Verify Fix)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Policy Details */}
        {!policy ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <span className="material-symbols-outlined text-3xl text-slate-500 mb-2">policy</span>
            <p className="text-xs text-slate-400">
              {policyNote || "No policy proposed yet. Click \"Propose Fix\" to map this exploit to an enforceable policy rule."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Plain English Explanation */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Policy Behavior Summary</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{policy.rationale}</p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <strong className="text-slate-300">Expected Effect:</strong> {policy.expected_effect}
                </div>
                <div>
                  <strong className="text-slate-300">Legitimate Impact:</strong> {policy.legitimate_task_impact}
                </div>
                {policyTemplate && (
                  <div className="sm:col-span-2">
                    <strong className="text-slate-300">Blocked Actions:</strong> {policyTemplate.blocks}
                  </div>
                )}
                {activeVersions.length > 0 && (
                  <div className="sm:col-span-2 flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-slate-400">Enforced Stack:</span>
                    {activeVersions.map((v) => (
                      <span key={v} className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1 text-emerald-300">
                        v{v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Parameter Diff Table */}
            {policy.diff && policy.diff.length > 0 && (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-white/[0.03] px-4 py-2 border-b border-white/10 font-mono text-[10px] uppercase font-bold text-slate-400">
                  Structured Parameter Changes
                </div>
                <div className="divide-y divide-white/5 bg-[#060910] text-xs font-mono">
                  {policy.diff.map((d, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2">
                      <span className="text-slate-400 font-semibold">{d.parameter}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 line-through">
                          {Array.isArray(d.before) ? d.before.join(", ") || "[]" : String(d.before)}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="text-emerald-400 font-bold">
                          {Array.isArray(d.after) ? d.after.join(", ") : String(d.after)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. SIDE-BY-SIDE FORENSIC COMPARISON: Before vs After */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: Before Fix (Baseline Vulnerable Agent) */}
        <div className="glass-panel p-6 border-rose-500/20 bg-rose-500/[0.02] space-y-4">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <h3 className="font-display text-sm font-bold uppercase text-white tracking-tight">
                Before Fix (Vulnerable Agent)
              </h3>
            </div>
            <span className="rounded-md border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300 uppercase">
              EXPLOIT_SUCCEEDED
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Run ID:</span>
              <span className="text-white font-bold">{originalRun.run_id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Policy in Force:</span>
              <span className="text-rose-400">none (unshielded)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Transactions:</span>
              <span className="text-rose-400 font-bold">
                {originalRun.transaction_hashes.length > 0
                  ? `${originalRun.transaction_hashes.length} leak tx submitted`
                  : "None"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Balance Delta:</span>
              <span className="text-rose-400 font-bold">
                {originalRun.balance_deltas[0] ? `${formatDelta(originalRun.balance_deltas[0].delta)} TST` : "—"}
              </span>
            </div>
            <div className="py-1">
              <span className="text-slate-400 block mb-1">State Fingerprint:</span>
              <span className="text-slate-500 text-[10px] break-all">
                {originalRun.environment_snapshot_id || "snap-baseline"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: After Fix (Policy Enforced) */}
        <div className="glass-panel p-6 border-emerald-500/20 bg-emerald-500/[0.02] space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <h3 className="font-display text-sm font-bold uppercase text-white tracking-tight">
                After Fix (Policy Enforced)
              </h3>
            </div>
            {replayRun ? (
              <span
                className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                  replayRun.verdict === "ATTEMPT_BLOCKED"
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "border-slate-700 bg-slate-800 text-slate-400"
                }`}
              >
                {replayRun.verdict || replayRun.status}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">Replay not run yet</span>
            )}
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Replay Run ID:</span>
              <span className="text-white font-bold">{replayRun ? replayRun.run_id : "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Enforced Policy:</span>
              <span className="text-emerald-400 font-semibold">
                {replayRun?.policy_version ? `v${replayRun.policy_version}` : policy?.version ? `v${policy.version}` : "none"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Prohibited Tx Hashes:</span>
              <span className={replayRun && replayRun.transaction_hashes.length === 0 ? "text-emerald-400 font-bold" : "text-slate-400"}>
                {replayRun
                  ? replayRun.transaction_hashes.length === 0
                    ? "0 tx (Blocked before signing)"
                    : `${replayRun.transaction_hashes.length} submitted`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Legitimate Regression:</span>
              <span className={regression?.legitimate_task_passed ? "text-emerald-400 font-bold" : "text-slate-400"}>
                {regression ? (regression.legitimate_task_passed ? "PASSED (Transfer Succeeded)" : "FAILED") : "—"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Equivalence Gate:</span>
              <span className={equivalence?.equivalent ? "text-emerald-400 font-bold" : "text-slate-400"}>
                {equivalence ? (equivalence.equivalent ? "EQUIVALENT (Fingerprints Match)" : "MISMATCHED") : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

