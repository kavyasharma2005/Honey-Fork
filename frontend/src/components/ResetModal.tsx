import React from "react";

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isResetting: boolean;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isResetting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0C121C]/90 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <span className="material-symbols-outlined text-[22px]">restart_alt</span>
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Reset Sandbox State?</h3>
            <p className="text-xs text-slate-400">Deterministic EVM environment rollback</p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-300">
          This restores all wallet accounts and test token balances back to their known initial state
          (Agent: 10,000 TST, Recipients: 0 TST). Stored run records, telemetry events, and report history will remain preserved.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            onClick={onClose}
            disabled={isResetting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-40"
            onClick={onConfirm}
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                Resetting…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Confirm Reset
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

