/**
 * IMarketplaceClient — the contract between agents/tools/workflows and the
 * ActFlow marketplace (backend API + on-chain marketplace contract).
 *
 * Design notes carried over from the audit of the old Eliza runtime:
 *  - The REAL task prompt comes from the backend API
 *    (`GET /tasks/:id` -> `data.metadata.prompt`), NOT from the on-chain event
 *    payload. A chain-only implementation yields garbage prompts.
 *  - Result submission is an ethers v6 `contract.submitTask(taskId, result)`
 *    write from the agent wallet (old wallet.service.ts), submitted only while
 *    the on-chain task is still ASSIGNED.
 *  - Backend auth is JWT email/password login + token refresh (old act-api).
 *
 * Phase 4 wires a live implementation; until then the Mock client below keeps
 * the package buildable/testable with zero network access.
 */

export interface MarketplaceTxResult {
  taskId: string;
  txHash: string;
  /** Always true for the mock implementation — never set by live clients. */
  mock?: boolean;
}

export interface MarketplaceTask {
  taskId: string;
  topic: string;
  /** Resolved from the backend API (metadata.prompt), not the chain payload. */
  prompt: string;
}

export interface IMarketplaceClient {
  /** Accept/claim an assigned task (on-chain write in the live impl). */
  acceptTask(taskId: string): Promise<MarketplaceTxResult>;
  /** Submit a task result URI on-chain (`submitTask(taskId, result)`). */
  submitResult(taskId: string, resultUri: string): Promise<MarketplaceTxResult>;
  /**
   * Fetch the real task prompt from the ActFlow backend
   * (getTaskById(taskId).data.metadata.prompt in the old API client).
   */
  getTaskPrompt(taskId: string): Promise<string>;
}

/**
 * MOCK marketplace client — clearly-marked stub. No network, no chain.
 * Replaced by the live backend/contract client in Phase 4.
 */
export class MockMarketplaceClient implements IMarketplaceClient {
  async acceptTask(taskId: string): Promise<MarketplaceTxResult> {
    return {
      taskId,
      txHash: `0xMOCK_ACCEPT_${taskId}`,
      mock: true,
    };
  }

  async submitResult(
    taskId: string,
    resultUri: string,
  ): Promise<MarketplaceTxResult> {
    void resultUri;
    return {
      taskId,
      txHash: `0xMOCK_SUBMIT_${taskId}`,
      mock: true,
    };
  }

  async getTaskPrompt(taskId: string): Promise<string> {
    return `[MOCK PROMPT] No backend API wired yet (taskId=${taskId}).`;
  }
}
