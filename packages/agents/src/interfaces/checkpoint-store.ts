/**
 * ICheckpointStore — single source of truth for the block-range polling
 * checkpoint (lastProcessedBlock) used by the Phase 4 chain listener.
 *
 * Redesign note from the audit: the old Eliza marketplace-plugin persisted
 * LAST_PROCESSED_BLOCK in BOTH character secrets and sqlite, which drifted.
 * The new runtime keeps exactly ONE store behind this interface — never
 * duplicate the checkpoint into agent config.
 */

export interface ICheckpointStore {
  /**
   * Last processed block for an agent address; returns `deploymentBlock`
   * when nothing has been recorded yet.
   */
  getLastProcessedBlock(
    agentAddress: string,
    deploymentBlock: number,
  ): Promise<number>;
  /** Record a new checkpoint; implementations must ignore regressions. */
  setLastProcessedBlock(
    agentAddress: string,
    blockNumber: number,
  ): Promise<void>;
}

/** In-memory checkpoint store — for tests and local dev only. */
export class InMemoryCheckpointStore implements ICheckpointStore {
  private readonly blocks = new Map<string, number>();

  async getLastProcessedBlock(
    agentAddress: string,
    deploymentBlock: number,
  ): Promise<number> {
    return this.blocks.get(agentAddress.toLowerCase()) ?? deploymentBlock;
  }

  async setLastProcessedBlock(
    agentAddress: string,
    blockNumber: number,
  ): Promise<void> {
    const key = agentAddress.toLowerCase();
    const current = this.blocks.get(key) ?? 0;
    if (blockNumber > current) {
      this.blocks.set(key, blockNumber);
    }
  }
}
