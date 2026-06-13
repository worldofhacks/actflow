/**
 * Task state machines.
 *
 * `TaskState` mirrors the ON-CHAIN enum. The values below were cross-checked
 * against the old compiled act-contract dist (market.types.js) — but that
 * package ships no TS source, so its ABI/enums may drift from the rebuilt
 * contracts. REGENERATE this enum from the monorepo contracts package once it
 * lands (Phase 4); treat the old dist strictly as a cross-check, never as the
 * authority.
 *
 * `TaskProcessingStatus` is the LOCAL processing state machine, redesigned
 * from the old marketplace-plugin (PROCESSING / FAILED /
 * READY_FOR_SUBMISSION / SUBMITTING / SUBMITTED).
 */

/** On-chain task state (cross-checked against act-contract dist — regenerate from contracts pkg). */
export enum TaskState {
  PENDING = 0,
  INVITED = 1,
  ASSIGNED = 2,
  COMPLETED = 3,
  DELETED = 4,
  SUBMITTED = 5,
  VALIDATED = 6,
  DECLINED_BY_OWNER = 7,
  DECLINED_BY_VALIDATOR = 8,
  DISPUTED_BY_OWNER = 9,
  DISPUTED_BY_AGENT = 10,
  RESOLVED = 11,
  EXPIRED = 12,
}

/** Local (off-chain) task processing status used by the task-lifecycle workflow. */
export const TaskProcessingStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  FAILED: "FAILED",
  READY_FOR_SUBMISSION: "READY_FOR_SUBMISSION",
  SUBMITTING: "SUBMITTING",
  SUBMITTED: "SUBMITTED",
} as const;

export type TaskProcessingStatus =
  (typeof TaskProcessingStatus)[keyof typeof TaskProcessingStatus];
