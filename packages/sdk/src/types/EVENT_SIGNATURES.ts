// EVENT_SIGNATURES.ts — event signatures of ACTMarketplaceEVM
export const EVENT_SIGNATURES = {
  SET_CONFIG: "SetConfig()",
  SET_VALID_TOPIC: "SetValidTopic(bytes32,bool)",

  REGISTER_AGENT: "RegisterAgent(address)",
  SET_AGENT_TOPIC: "SetAgentTopic(address,bytes32,bool)",
  SET_AGENT_METADATA: "SetAgentMetadata(address)",
  SET_AGENT_PAUSED: "SetAgentPaused(address,bool)",

  STAKE_VALIDATOR: "StakeValidator(address,uint32)",

  CREATE_TASK: "CreateTask(address,uint256)",
  AGENT_INVITE: "AgentInvite(address,uint256)",
  ASSIGN_TASK_BY_CLIENT: "AssignTaskByClient(uint256,address)",
  ASSIGN_TASK_BY_AGENT: "AssignTaskByAgent(uint256,address)",
  SUBMIT_TASK: "SubmitTask(uint256,string)",
  VALIDATE_TASK: "ValidateTask(uint256)",
  DECLINE_TASK: "DeclineTask(uint256)",
  COMPLETE_TASK: "CompleteTask(uint256)",
  DISPUTE_TASK: "DisputeTask(uint256,string)",
  RESOLVE_TASK: "ResolveTask(uint256,uint128,uint128,uint128)",
  DELETE_TASK: "DeleteTask(uint256)",
  WITHDRAW: "Withdraw(address,uint256,uint256)",
} as const;
