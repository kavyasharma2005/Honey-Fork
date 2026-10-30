import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "./api";
import { Header, type ActiveTab } from "./components/Header";
import { DashboardScreen } from "./components/DashboardScreen";
import { RunDetailScreen } from "./components/RunDetailScreen";
import { FixReplayScreen } from "./components/FixReplayScreen";
import { ResetModal } from "./components/ResetModal";
import { usePolling } from "./usePolling";
import type {
  AgentConfiguration,
  AttackDefinition,
  Comparison,
  Health,
  Policy,
  PolicyTemplate,
  ReplayResult,
  ScanRun,
} from "./types";

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [health, setHealth] = useState<Health | null>(null);
  const [agents, setAgents] = useState<AgentConfiguration[]>([]);
  const [attacks, setAttacks] = useState<AttackDefinition[]>([]);
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [runs, setRuns] = useState<ScanRun[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);

  // Scan runner controls
  const [agentId, setAgentId] = useState("");
  const [selectedAttacks, setSelectedAttacks] = useState<string[]>([]);
  const [repeatCount, setRepeatCount] = useState(1);
  const [isStartingScan, setIsStartingScan] = useState(false);

  // Selected run state
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Policy & Replay state
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policyNote, setPolicyNote] = useState<string | null>(null);
  const [isProposingPolicy, setIsProposingPolicy] = useState(false);
  const [isApplyingPolicy, setIsApplyingPolicy] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);

  // Notification toast
  const [notice, setNotice] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);

  const showNotice = (message: string, type: "info" | "success" | "error" = "info") => {
    setNotice({ message, type });
    setTimeout(() => {
      setNotice((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const loadRuns = useCallback(async () => {
    try {
      const scans = await api.scans(50);
      setRuns(scans);
      if (!selectedRunId && scans.length > 0) {
        // Auto-select latest run if none selected
        setSelectedRunId(scans[0].run_id);
      }
    } catch (err) {
      console.error("Failed to load runs:", err);
    }
  }, [selectedRunId]);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const [h, a, at, t] = await Promise.all([
          api.health(),
          api.agents(),
          api.attacks(),
          api.policyTemplates(),
        ]);
        setHealth(h);
        setAgents(a);
        setAttacks(at);
        setTemplates(t);
        setAgentId(a[0]?.agent_id ?? "");
        setSelectedAttacks(at.map((x) => x.attack_id));
        await loadRuns();
      } catch (err) {
        setFatal(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [loadRuns]);

  // Periodic polling for health
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const h = await api.health();
        setHealth(h);
      } catch {
        /* ignore transient failures */
      }
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Polling events for selected run
  const events = usePolling(
    () => api.events(selectedRunId as string),
    Boolean(selectedRunId),
    1000,
  );

  const selectedRun = useMemo(
    () => runs.find((r) => r.run_id === selectedRunId) ?? null,
    [runs, selectedRunId],
  );

  const selectedAttack = useMemo(
    () => attacks.find((a) => a.attack_id === selectedRun?.attack_id) ?? null,
    [attacks, selectedRun],
  );

  const policyTemplate = useMemo(
    () => templates.find((t) => t.type === policy?.type) ?? null,
    [templates, policy],
  );

  // Handlers
  const handleToggleAttackId = (id: string) => {
    setSelectedAttacks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAllAttacks = () => {
    if (selectedAttacks.length === attacks.length) {
      setSelectedAttacks([]);
    } else {
      setSelectedAttacks(attacks.map((x) => x.attack_id));
    }
  };

  const handleStartScan = async () => {
    if (selectedAttacks.length === 0) return;
    setIsStartingScan(true);
    try {
      const accepted = await api.startScan({
        agent_id: agentId,
        attack_ids: selectedAttacks,
        repeat_count: repeatCount,
      });
      showNotice(`Scan accepted (${accepted.run_id}). Running ${accepted.total_trials} trial(s)…`, "info");

      // Wait a moment then reload runs
      setTimeout(async () => {
        await loadRuns();
        setIsStartingScan(false);
        if (accepted.run_id) {
          setSelectedRunId(accepted.run_id);
        }
      }, 1500);
    } catch (err) {
      setIsStartingScan(false);
      const msg = err instanceof ApiError ? `${err.code}: ${err.message}` : String(err);
      showNotice(msg, "error");
    }
  };

  const handleResetSandbox = async () => {
    setIsResetting(true);
    try {
      await api.resetSandbox();
      const h = await api.health();
      setHealth(h);
      await loadRuns();
      setIsResetModalOpen(false);
      showNotice("Sandbox environment restored to known initial state.", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.code}: ${err.message}` : String(err);
      showNotice(msg, "error");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    setActiveTab("run-detail");
  };

  const handleGoToFixReplay = async (runId: string) => {
    setSelectedRunId(runId);
    setActiveTab("fix-replay");
    // Automatically trigger policy proposal for this run if not already proposed
    try {
      setIsProposingPolicy(true);
      const result = await api.proposePolicy(runId);
      setPolicy(result.policy);
      setPolicyNote(result.policy ? null : (result.message ?? "No automatic fix is available."));
      if (result.policy) {
        showNotice(`Proposed candidate policy: ${result.policy.policy_id}`, "info");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.code}: ${err.message}` : String(err);
      showNotice(msg, "error");
    } finally {
      setIsProposingPolicy(false);
    }
  };

  const handleProposePolicy = async () => {
    if (!selectedRunId) return;
    setIsProposingPolicy(true);
    try {
      const result = await api.proposePolicy(selectedRunId);
      setPolicy(result.policy);
      setPolicyNote(result.policy ? null : (result.message ?? "No automatic fix is available."));
      if (result.policy) {
        showNotice(`Proposed candidate policy: ${result.policy.policy_id}`, "info");
      } else {
        showNotice(result.message || "No automatic policy fix matches this attack.", "info");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.code}: ${err.message}` : String(err);
      showNotice(msg, "error");
    } finally {
      setIsProposingPolicy(false);
    }
  };

  const handleApplyPolicy = async () => {
    if (!policy) return;
    setIsApplyingPolicy(true);
    try {
      const result = await api.applyPolicy(policy.policy_id);
      setPolicy(result.policy);
      const h = await api.health();
      setHealth(h);
      showNotice(
        `Applied ${result.policy.type} as policy v${result.policy.version}. Policy is now enforced!`,
        "success",
      );
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.code}: ${err.message}` : String(err);
      showNotice(msg, "error");
    } finally {
      setIsApplyingPolicy(false);
    }
  };

  const handleRunReplay = async () => {
    if (!selectedRunId) return;
    setIsReplaying(true);
    try {
      const result = await api.replay(selectedRunId, 3);
      setReplayResult(result);
      try {
        const comp = await api.comparison(selectedRunId, result.replay_run.run_id);
        setComparison(comp);
      } catch (e) {
        console.warn("Comparison fetch warning:", e);
      }
      await loadRuns();
      if (result.proof_status?.verified) {
        showNotice("VERIFIED FIX: Attack Blocked · Legitimate Transfer Passed!", "success");
      } else {
        showNotice(`Replay finished with status: ${result.proof_status?.label || result.regression.fix_status}`, "info");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.code}: ${err.message}` : String(err);
      showNotice(msg, "error");
    } finally {
      setIsReplaying(false);
    }
  };

  const handleExportReport = async () => {
    if (!selectedRunId) return;
    try {
      const reportRes = await api.createReport([selectedRunId]);
      await api.exportReport(reportRes.report.report_id);
      showNotice(`Audit report ${reportRes.report.report_id} exported successfully.`, "success");
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.code}: ${err.message}` : String(err);
      showNotice(msg, "error");
    }
  };

  const handleExportRunJson = () => {
    if (!selectedRun) return;
    const data = {
      run: selectedRun,
      events: events.data ?? [],
    };
    api.exportRunJson(data, `run-${selectedRun.run_id}.json`);
    showNotice(`Run ${selectedRun.run_id} JSON exported.`, "success");
  };

  if (fatal) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-[#070B12]">
        <div className="glass-panel p-8 max-w-md text-center border-rose-500/30">
          <span className="material-symbols-outlined text-4xl text-rose-400 mb-2">error</span>
          <h2 className="text-lg font-bold text-white">System Initialization Error</h2>
          <p className="mt-2 text-xs text-slate-300 font-mono">{fatal}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B12] text-[#E2E8F0] flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-300">
      {/* 1. Frosted Glass Top Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        health={health}
        selectedRunId={selectedRunId}
        hasProposedPolicy={Boolean(policy && policy.status === "proposed")}
        onOpenReset={() => setIsResetModalOpen(true)}
      />

      {/* Floating Apple-style Notification Toast */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 animate-slidein">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-2xl text-xs font-medium max-w-md ${
              notice.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                : notice.type === "error"
                ? "border-rose-500/40 bg-rose-500/15 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.2)]"
                : "border-white/15 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {notice.type === "success"
                ? "check_circle"
                : notice.type === "error"
                ? "error"
                : "info"}
            </span>
            <span className="leading-snug">{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-auto opacity-70 hover:opacity-100"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        {activeTab === "dashboard" && (
          <DashboardScreen
            health={health}
            agents={agents}
            attacks={attacks}
            scans={runs}
            selectedAgentId={agentId}
            onSelectAgentId={setAgentId}
            selectedAttackIds={selectedAttacks}
            onToggleAttackId={handleToggleAttackId}
            onSelectAllAttacks={handleSelectAllAttacks}
            repeatCount={repeatCount}
            onChangeRepeatCount={setRepeatCount}
            isStartingScan={isStartingScan}
            onStartScan={handleStartScan}
            onSelectRun={handleSelectRun}
            onGoToFixReplay={handleGoToFixReplay}
            onOpenReset={() => setIsResetModalOpen(true)}
          />
        )}

        {activeTab === "run-detail" && (
          <RunDetailScreen
            run={selectedRun}
            events={events.data ?? []}
            attack={selectedAttack}
            onGoToFixReplay={handleGoToFixReplay}
            onBackToDashboard={() => setActiveTab("dashboard")}
            onExportRunJson={handleExportRunJson}
          />
        )}

        {activeTab === "fix-replay" && (
          <FixReplayScreen
            originalRun={selectedRun}
            policy={policy}
            policyTemplate={policyTemplate}
            policyNote={policyNote}
            activeVersions={health?.active_policy_versions ?? []}
            isProposing={isProposingPolicy}
            onProposePolicy={handleProposePolicy}
            isApplying={isApplyingPolicy}
            onApplyPolicy={handleApplyPolicy}
            isReplaying={isReplaying}
            onRunReplay={handleRunReplay}
            replayResult={replayResult}
            comparison={comparison}
            onExportReport={handleExportReport}
            onBackToDashboard={() => setActiveTab("dashboard")}
          />
        )}
      </main>

      {/* Reset Sandbox Confirmation Modal */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetSandbox}
        isResetting={isResetting}
      />
    </div>
  );
}
export default App;
