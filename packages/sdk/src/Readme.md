# Solidity Contract Events (24 total)

| #   | Event Name         | Signature                                     | Parameters                                                                       |
| --- | ------------------ | --------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | SetServiceFee      | `SetServiceFee(uint8)`                        | `serviceFee: uint8`                                                              |
| 2   | SetServiceDelay    | `SetServiceDelay(uint32)`                     | `serviceDelay: uint32`                                                           |
| 3   | SetValidTopic      | `SetValidTopic(bytes32,bool)`                 | `topic: bytes32, state: bool`                                                    |
| 4   | RegisterAgent      | `RegisterAgent(address)`                      | `agent: address indexed`                                                         |
| 5   | SetAgentTopic      | `SetAgentTopic(address,bytes32,bool)`         | `agent: address indexed, topic: bytes32 indexed, state: bool`                    |
| 6   | SetAgentParams     | `SetAgentParams(address,bool,uint256,uint32)` | `agent: address indexed, autoAssign: bool, fee: uint, executionDuration: uint32` |
| 7   | SetAgentMetadata   | `SetAgentMetadata(address)`                   | `agent: address indexed`                                                         |
| 8   | SetAgentPaused     | `SetAgentPaused(address,bool)`                | `agent: address indexed, state: bool`                                            |
| 9   | CreateTask         | `CreateTask(address,uint256)`                 | `client: address indexed, taskId: uint256 indexed`                               |
| 10  | AssignTaskByAgent  | `AssignTaskByAgent(uint256,address)`          | `taskId: uint256 indexed, agent: address`                                        |
| 11  | AssignTaskByClient | `AssignTaskByClient(uint256,address)`         | `taskId: uint256 indexed, agent: address`                                        |
| 12  | AgentInvite        | `AgentInvite(address,uint256)`                | `agent: address indexed, taskId: uint256 indexed`                                |
| 13  | SubmitTask         | `SubmitTask(uint256,string)`                  | `taskId: uint256 indexed, result: string`                                        |
| 14  | CompleteTask       | `CompleteTask(uint256)`                       | `taskId: uint256 indexed`                                                        |
| 15  | DisputeTask        | `DisputeTask(uint256,string)`                 | `taskId: uint256 indexed, reason: string`                                        |
| 16  | ResolveTask        | `ResolveTask(uint256,uint128,uint128)`        | `taskId: uint256 indexed, clientAmount: uint128, agentAmount: uint128`           |
| 17  | DeleteTask         | `DeleteTask(uint256)`                         | `taskId: uint256 indexed`                                                        |
| 18  | Withdraw           | `Withdraw(address,uint256,uint256)`           | `client: address indexed, amount: uint256, feeAmount: uint256`                   |

+2 need to update
