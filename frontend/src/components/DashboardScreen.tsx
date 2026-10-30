import React, { useMemo, useState } from "react";
import type { AgentConfiguration, AttackDefinition, Health, ScanRun, Verdict } from "../types";
import { formatDelta, shortAddress } from "../format";

interface DashboardScreenProps {
  health: Health | null;
  agents: AgentConfiguration[];
  attacks: AttackDefinition[];
  scans: ScanRun[];
  selectedAgentId: string;
  onSelectAgentId: (id: string) => void;
  selectedAttackIds: string[];
  onToggleAttackId: (id: string) => void;
  onSelectAllAttacks: () => void;
  repeatCount: number;
  onChangeRepeatCount: (count: number) => void;
  isStartingScan: boolean;
  onStartScan: () => void;
  onSelectRun: (runId: string) => void;
  onGoToFixReplay: (runId: string) => void;
  onOpenReset: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  health,
  agents,
  attacks,
  scans,
  selectedAgentId,
  onSelectAgentId,
  selectedAttackIds,
  onToggleAttackId,
  onSelectAllAttacks,
  repeatCount,
  onChangeRepeatCount,
  isStartingScan,
  onStartScan,
  onSelectRun,
  onGoToFixReplay,
  onOpenReset,
}) => {
  const [filterQuery, setFilterQuery] = useState("");

  const activeAgent = useMemo(
    () => agents.find((a) => a.agent_id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId],
  );

  // Filter out parent scan containers to get trials with verdicts
  const trials = useMemo(
    () => scans.filter((s) => s.verdict !== null),
    [scans],
  );

  // Compute live telemetry statistics strictly from real API data
  const latestTrial = trials[0] ?? null;

  const exploitsCount = useMemo(
    () => trials.filter((t) => t.verdict === "EXPLOIT_SUCCEEDED").length,
    [trials],
  );

  const blockedCount = useMemo(
    () => trials.filter((t) => t.verdict === "ATTEMPT_BLOCKED").length,
    [trials],
  );

  const testErrorsCount = useMemo(
    () => trials.filter((t) => t.verdict === "TEST_ERROR").length,
    [trials],
  );

  // Rate denominators: baseline valid trials for ASR, protected valid trials for DBR
  const baselineTrials = useMemo(
    () => trials.filter((t) => !t.policy_version && t.verdict !== "TEST_ERROR"),
    [trials],
  );
  const protectedTrials = useMemo(
    () => trials.filter((t) => Boolean(t.policy_version) && t.verdict !== "TEST_ERROR"),
    [trials],
  );

  const asrPercent = baselineTrials.length > 0
    ? Math.round((exploitsCount / baselineTrials.length) * 100)
    : 0;

  const dbrPercent = protectedTrials.length > 0
    ? Math.round((blockedCount / protectedTrials.length) * 100)
    : 0;

  // Filtered runs for table
  const displayedScans = useMemo(() => {
    if (!filterQuery) return scans.slice(0, 25);
    const q = filterQuery.toLowerCase();
    return scans
      .filter(
        (s) =>
          s.run_id.toLowerCase().includes(q) ||
          (s.attack_id && s.attack_id.toLowerCase().includes(q)) ||
          s.agent_id.toLowerCase().includes(q) ||
          (s.verdict && s.verdict.toLowerCase().includes(q)),
      )
      .slice(0, 25);
  }, [scans, filterQuery]);

  const renderVerdictBadge = (verdict: Verdict | null, status: string) => {
    if (!verdict) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-400 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          {status}
        </span>
      );
    }

    switch (verdict) {
      case "ATTEMPT_BLOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300 uppercase shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ATTEMPT_BLOCKED
          </span>
        );
      case "EXPLOIT_SUCCEEDED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-rose-300 uppercase shadow-[0_0_12px_rgba(244,63,94,0.2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            EXPLOIT_SUCCEEDED
          </span>
        );
      case "ATTACK_NOT_TRIGGERED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300/90 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            NOT_TRIGGERED
          </span>
        );
      case "TEST_ERROR":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-purple-300 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            TEST_ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] text-slate-400">
            {verdict}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Status & Environmental Diagnostics Strip */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="font-semibold text-white">Sandbox Node:</span>
            <span className="font-mono text-slate-300">
              {health?.sandbox.adapter ?? "SimulatedChain"} (Chain #{health?.sandbox.chain_id ?? 31337})
            </span>
          </div>

          <div className="h-3 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Token:</span>
            <span className="font-mono text-indigo-300">
              {health?.sandbox.token_contract
                ? shortAddress(health.sandbox.token_contract, 6, 4)
                : "0x70ce…0000"}
            </span>
          </div>

          <div className="h-3 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Block:</span>
            <span className="font-mono text-emerald-400">#{health?.sandbox.block_number ?? 1}</span>
          </div>

          <div className="h-3 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Active Policies:</span>
            <span className="font-mono font-semibold text-amber-300">
              {health?.active_policy_count ?? 0} applied
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenReset}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-amber-400">restart_alt</span>
          <span>Reset Sandbox</span>
        </button>
      </div>

      {/* 2. Telemetry Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Latest Verdict */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Latest Verdict</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">speed</span>
          </div>
          <div className="my-3">
            {latestTrial ? (
              <div>
                <div className="mb-2">{renderVerdictBadge(latestTrial.verdict, latestTrial.status)}</div>
                <div className="font-mono text-xs text-slate-400">
                  Run <span className="text-white font-semibold">{latestTrial.run_id}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 font-mono">No trials recorded yet</div>
            )}
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Attack: {latestTrial?.attack_id ?? "—"}</span>
            <span className="font-mono text-slate-300">
              {latestTrial?.started_at ? new Date(latestTrial.started_at).toLocaleTimeString() : "—"}
            </span>
          </div>
        </div>

        {/* Card 2: Total Exploits */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Verified Exploits</span>
            <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300 uppercase">
              {exploitsCount > 0 ? "High Risk" : "Clean"}
            </span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="font-display text-3xl font-bold tracking-tight text-rose-400">
              {exploitsCount}
            </span>
            {/* Sparkline Graphic */}
            <svg className="h-8 w-20 text-rose-400/80" fill="none" viewBox="0 0 80 30">
              <polyline
                points="0,26 15,22 30,24 45,14 60,18 75,5 80,4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
              <polygon
                fill="currentColor"
                fillOpacity="0.1"
                points="0,26 15,22 30,24 45,14 60,18 75,5 80,4 80,30 0,30"
              />
            </svg>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
            <span>ASR: <strong className="text-rose-300">{asrPercent}%</strong></span>
            <span className="font-mono text-slate-400">Baseline N={baselineTrials.length}</span>
          </div>
        </div>

        {/* Card 3: Blocked Payloads */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Blocked Payloads</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-400">shield_lock</span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="font-display text-3xl font-bold tracking-tight text-emerald-400">
              {blockedCount}
            </span>
            {/* Donut Gauge */}
            <div className="relative flex h-9 w-9 items-center justify-center">
              <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-emerald-400"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${dbrPercent}, 100`}
                  strokeWidth="3.5"
                />
              </svg>
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
            <span>DBR: <strong className="text-emerald-300">{dbrPercent}%</strong></span>
            <span className="font-mono text-slate-400">Protected N={protectedTrials.length}</span>
          </div>
        </div>

        {/* Card 4: System Exceptions */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Test Exceptions</span>
            <span className="material-symbols-outlined text-[18px] text-purple-400">warning</span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="font-display text-3xl font-bold tracking-tight text-purple-300">
              {testErrorsCount}
            </span>
            <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 font-mono text-[10px] text-purple-300 uppercase">
              Excluded
            </span>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-400 truncate">
            <span>Excluded from rate denominators</span>
          </div>
        </div>
      </div>

      {/* 3. Runner Configuration & Execution Control (Bento Split) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Test Sandbox Configuration Form (8 cols) */}
        <div className="glass-panel p-6 lg:col-span-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[20px]">tune</span>
                <h2 className="font-display text-base font-bold text-white uppercase tracking-tight">
                  Security Test Sandbox Runner
                </h2>
              </div>
              <span className="font-mono text-[11px] text-slate-400 uppercase">
                Target Architecture: ReAct LLM Agent
              </span>
            </div>

            <div className="space-y-5">
              {/* Target Agent Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  Target Sandbox Agent Configuration
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {agents.map((agent) => {
                    const isSelected = agent.agent_id === selectedAgentId;
                    return (
                      <div
                        key={agent.agent_id}
                        onClick={() => onSelectAgentId(agent.agent_id)}
                        className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                          isSelected
                            ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                            : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-white">{agent.agent_id}</span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              agent.guardrail === "none"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {agent.guardrail === "none" ? "Unshielded" : "Proxy Enforcing"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{agent.description || agent.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Threat Vectors Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-slate-300">
                    Active Threat Vectors (Payload Injections)
                  </span>
                  <button
                    type="button"
                    onClick={onSelectAllAttacks}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 uppercase transition-colors"
                  >
                    {selectedAttackIds.length === attacks.length ? "Clear All" : "Select All"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {attacks.map((attack) => {
                    const isChecked = selectedAttackIds.includes(attack.attack_id);
                    return (
                      <label
                        key={attack.attack_id}
                        className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer select-none transition-all ${
                          isChecked
                            ? "border-white/20 bg-white/[0.05]"
                            : "border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleAttackId(attack.attack_id)}
                          className="mt-0.5 h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">
                              {attack.attack_id}
                            </span>
                            <span className="rounded bg-white/10 px-1 py-0.2 font-mono text-[9px] text-slate-300 uppercase">
                              {attack.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 truncate mt-0.5">
                            {attack.name}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Parameter Row: Trials & Target Funds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                    Trial Count (Stochastic Sweep)
                  </label>
                  <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] p-1">
                    <button
                      type="button"
                      onClick={() => onChangeRepeatCount(Math.max(1, repeatCount - 1))}
                      className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={repeatCount}
                      onChange={(e) =>
                        onChangeRepeatCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))
                      }
                      className="w-full bg-transparent text-center font-mono text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeRepeatCount(Math.min(10, repeatCount + 1))}
                      className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <span className="pr-3 text-xs text-slate-400 font-mono">trials</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                    Sandbox Balance Scope
                  </label>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      10,000 TST
                    </span>
                    <span className="text-[11px] text-slate-400">Isolated Test Token</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Execution Trigger CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.08] pt-4 mt-6">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span className="material-symbols-outlined text-[16px] text-indigo-400">info</span>
              <span>
                Executes {selectedAttackIds.length * repeatCount} trial(s) in deterministic sandbox.
              </span>
            </div>

            <button
              type="button"
              disabled={isStartingScan || selectedAttackIds.length === 0}
              onClick={onStartScan}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {isStartingScan ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Executing Scan…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>Run Security Test</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Agent Visualizer / Target Agent Intel (4 cols) */}
        <div className="glass-panel p-6 lg:col-span-4 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-tight text-white">
                Target Agent Intel
              </h3>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                  activeAgent?.guardrail === "none"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {activeAgent?.guardrail === "none" ? "UNSHIELDED" : "POLICY PROXY"}
              </span>
            </div>

            {activeAgent && (
              <div className="space-y-4">
                {/* Visual Telemetry Terminal Preview */}
                <div className="rounded-xl border border-white/10 bg-[#060910] p-3.5 font-mono text-[11px] text-slate-300 leading-relaxed shadow-inner">
                  <div className="flex items-center justify-between text-slate-500 border-b border-white/5 pb-1.5 mb-2 text-[10px]">
                    <span>MEM_MONITOR: ACTIVE</span>
                    <span className="text-emerald-400">VERIFIED</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-indigo-400">&gt; MODEL:</span> {activeAgent.model_id}</p>
                    <p><span className="text-indigo-400">&gt; GUARDRAIL:</span> {activeAgent.guardrail}</p>
                    <p>
                      <span className="text-indigo-400">&gt; TOOLS:</span>{" "}
                      [{activeAgent.tool_set.join(", ")}]
                    </p>
                    <p className={activeAgent.guardrail === "none" ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      &gt; STATUS: {activeAgent.guardrail === "none" ? "No Transaction Firewall" : "Proxy Enforcing Stack"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400">Config Version</span>
                    <span className="font-mono font-bold text-white">v{activeAgent.configuration_version}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400">Environment</span>
                    <span className="font-mono text-indigo-300">{activeAgent.environment_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400">Registered Tools</span>
                    <span className="font-mono text-emerald-400">{activeAgent.tool_set.length} capabilities</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 uppercase">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Replay Engine Ready</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              Equivalence gate enforces matching state fingerprints before verifying policy fixes.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Recent Security Runs Table (Telemetry Log) */}
      <div className="glass-panel overflow-hidden">
        {/* Table Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] p-5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">history</span>
            <h2 className="font-display text-base font-bold text-white uppercase tracking-tight">
              Recent Security Runs
            </h2>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] text-slate-300">
              {scans.length} total
            </span>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by run ID, attack, verdict…"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-56 sm:w-64 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-slate-500">
                search
              </span>
            </div>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.015] font-mono text-[10px] uppercase text-slate-400">
                <th className="py-3 px-4 font-semibold">Run ID</th>
                <th className="py-3 px-4 font-semibold">Target Agent</th>
                <th className="py-3 px-4 font-semibold">Attack Vector</th>
                <th className="py-3 px-4 font-semibold">Verdict</th>
                <th className="py-3 px-4 font-semibold text-right">Balance Delta</th>
                <th className="py-3 px-4 font-semibold">Policy</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {displayedScans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    No runs found matching query. Click "Run Security Test" to start a scan.
                  </td>
                </tr>
              ) : (
                displayedScans.map((run) => {
                  const delta = run.balance_deltas[0]?.delta ?? 0;
                  return (
                    <tr
                      key={run.run_id}
                      onClick={() => onSelectRun(run.run_id)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {run.run_id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{run.agent_id}</td>
                      <td className="py-3.5 px-4">
                        <span className="rounded bg-white/[0.06] border border-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-200">
                          {run.attack_id ?? "SCAN_SUITE"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderVerdictBadge(run.verdict, run.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        {delta !== 0 ? (
                          <span className={delta > 0 ? "text-rose-400" : "text-emerald-400"}>
                            {formatDelta(delta)} TST
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {run.policy_version ? `v${run.policy_version}` : "none"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                        {run.started_at ? new Date(run.started_at).toLocaleTimeString() : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectRun(run.run_id)}
                            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white transition-all"
                          >
                            View
                          </button>
                          {run.verdict === "EXPLOIT_SUCCEEDED" && (
                            <button
                              type="button"
                              onClick={() => onGoToFixReplay(run.run_id)}
                              className="rounded-lg border border-indigo-500/40 bg-indigo-500/20 hover:bg-indigo-500/30 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 transition-all"
                            >
                              Fix
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

