# Demo script = end-to-end acceptance test (3 consecutive clean runs required)
Preconditions: Anvil running, TestUSD deployed, backend + frontend up, `POST /api/sandbox/reset` done, LLM key set.
1. Command Center: sandbox healthy, no policy active on `agent-vulnerable-01`. Pick agent + AT-01, trials=1, **Run Security Test**.
2. Live Timeline streams real events: payload_received -> tool_call(get_token_info) -> tool_call(transfer_token) -> policy_decision(NO_POLICY, allow) -> tx_submitted -> receipt -> verdict **EXPLOIT_SUCCEEDED** with tx hash and balance deltas (agent down, unauthorized up). Graph nodes link to those events.
3. Policy Lab: compiler proposes `recipient_allowlist` (allowed = approved recipient). Shows plain-language rule, exact params, diff, blocked actions, legit impact. Click **Apply Fix** (explicit). Policy version shown.
4. Replay Arena: reset sandbox, fingerprint check passes (shown), same AT-01 v1 replays under the policy -> policy_decision(RECIPIENT_NOT_ALLOWED, deny) -> tx_rejected -> **ATTEMPT_BLOCKED**, balances unchanged.
5. Regression: direct legit transfer to approved recipient within limit succeeds (chain delta).
6. Proof Report: stamp **ATTACK BLOCKED · LEGITIMATE TRANSFER PASSED**; run IDs, attack/policy versions, trial counts, limitations; export JSON (no secrets).
7. Repeat with AT-04 -> `max_amount` policy. Also demonstrate: untriggered attack shows ATTACK_NOT_TRIGGERED (not "blocked"); killing the model/RPC shows TEST_ERROR.
Fail the run if any verdict/stamp appears without persisted verifier data.
