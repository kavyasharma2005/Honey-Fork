import React from "react";
import type { Health } from "../types";

export type ActiveTab = "dashboard" | "run-detail" | "fix-replay";

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  health: Health | null;
  selectedRunId: string | null;
  hasProposedPolicy: boolean;
  onOpenReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  health,
  selectedRunId,
  hasProposedPolicy,
  onOpenReset,
}) => {
  const activePolicyCount = health?.active_policy_count ?? 0;
  const activePolicyVersion = health?.active_policy_version;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#070B12]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onTabChange("dashboard")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500/30 to-emerald-400/30 border border-white/15 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <span className="material-symbols-outlined text-[20px] text-emerald-300">security</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                AgentCrash Replay
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Security Regression Loop
              </span>
            </div>
          </div>

          {/* Sandbox Status Chip */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="font-mono text-[11px] text-slate-300">
              SANDBOX: {health?.sandbox.adapter ?? "SimulatedChain"} #{health?.sandbox.chain_id ?? 31337}
            </span>
          </div>
        </div>

        {/* Apple-style Segmented Navigation Tabs */}
        <nav className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 shadow-inner backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onTabChange("dashboard")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-white/[0.12] text-white shadow-sm border border-white/[0.1]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("run-detail")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "run-detail"
                ? "bg-white/[0.12] text-white shadow-sm border border-white/[0.1]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            <span>Run Detail</span>
            {selectedRunId && (
              <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.2 font-mono text-[10px] text-indigo-300 border border-white/10">
                {selectedRunId.slice(0, 8)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("fix-replay")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "fix-replay"
                ? "bg-white/[0.12] text-white shadow-sm border border-white/[0.1]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">published_with_changes</span>
            <span>Fix & Replay</span>
            {hasProposedPolicy && (
              <span className="ml-1 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </nav>

        {/* Right Status / Reset Sandbox Control */}
        <div className="flex items-center gap-3">
          {/* Active Policy Status */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Policy:</span>
            {activePolicyCount > 0 ? (
              <span className="font-mono text-emerald-400 font-semibold">
                v{activePolicyVersion || activePolicyCount} ({activePolicyCount} active)
              </span>
            ) : (
              <span className="font-mono text-slate-400">none (unshielded)</span>
            )}
          </div>

          {/* Reset Sandbox Trigger Button */}
          <button
            type="button"
            onClick={onOpenReset}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
            title="Rollback sandbox balances to known initial state"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-400">restart_alt</span>
            <span className="hidden md:inline">Reset Sandbox</span>
          </button>
        </div>
      </div>
    </header>
  );
};

