# Provenance — pre-hackathon source repos

The ActFlow monorepo was assembled at ETHGlobal NYC 2026 from these pre-existing repos.
Everything up to tag `monorepo-assembled` is salvage/assembly of prior work; everything
after it is weekend feature work. Imports land in clearly-labeled `chore: import ...` commits.

| Source repo | Visibility | Latest commit at import | Date |
|---|---|---|---|
| ACT-LABS-IO/act-contracts | public | `f3663de6da4633a9c3bcb4416044596bf99aae27` | 2025-04-22 |
| ACT-LABS-IO/act-marketplace-module | public | `f155aad72005ce44ea36645ca5ef0f73f72bec53` | 2025-04-24 |
| ACT-LABS-IO/actflow-contracts | private | `18d50f0be19b6c99546acb5070213cafbef62c79` | 2025-04-26 |
| ACT-LABS-IO/actflow-backend | private | `88435a0a5815f8e18964f231348ebbd269820749` | 2025-04-27 |
| ACT-LABS-IO/actflow-frontend | private | `93ad9e7f246e917fc4bb97c7139b0f93d38c51b9` | 2025-06-06 |
| ACT-LABS-IO/agent | private | `0ba32c7eeeae1686b7044eeeb32f0855a248286c` | 2025-12-11 |
| ACT-LABS-IO/Figment | private | `ce359eae38ee1b997727471574015b63278b7b7e` | 2026-04-19 |

Notes:
- `packages/contracts` is based on `actflow-contracts` **file content only** (fresh history;
  `hardhat.config.js` was rebuilt from scratch rather than imported; every imported file was
  reviewed before landing). `act-contracts` was used to cross-check.
- `agent` (Eliza runtime) contributes only character definitions, task-handler logic and prompt
  templates — the runtime was replaced with Mastra this weekend.
- `Figment` was mined for patterns (provisioning flow, indexer, trading tools), never imported wholesale.
