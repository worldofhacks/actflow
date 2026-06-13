// ABI of ACTMarketplaceEVM (generated from the compiled artifact in @actflow/contracts).
// viem-friendly: exported with a const assertion.
export const marketplaceAbi = [
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitializing",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "name": "AgentInvite",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "AssignTaskByAgent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "AssignTaskByClient",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "name": "CompleteTask",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "client",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "name": "CreateTask",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "name": "DeclineTask",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "name": "DeleteTask",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "DisputeTask",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "RegisterAgent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "_clientAmount",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "_agentAmount",
        "type": "uint128"
      },
      {
        "indexed": false,
        "internalType": "uint128",
        "name": "_validatorAmount",
        "type": "uint128"
      }
    ],
    "name": "ResolveTask",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "SetAgentMetadata",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "state",
        "type": "bool"
      }
    ],
    "name": "SetAgentPaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "topic",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "state",
        "type": "bool"
      }
    ],
    "name": "SetAgentTopic",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "SetConfig",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "topic",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "state",
        "type": "bool"
      }
    ],
    "name": "SetValidTopic",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "expireAtTs",
        "type": "uint32"
      }
    ],
    "name": "StakeValidator",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "result",
        "type": "string"
      }
    ],
    "name": "SubmitTask",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "name": "ValidateTask",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "client",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "feeAmount",
        "type": "uint256"
      }
    ],
    "name": "Withdraw",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "REVENUE_TOKEN",
    "outputs": [
      {
        "internalType": "contract RevenueToken",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "agentTopics",
    "outputs": [
      {
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      },
      {
        "internalType": "uint128",
        "name": "fee",
        "type": "uint128"
      },
      {
        "internalType": "uint32",
        "name": "executionDuration",
        "type": "uint32"
      },
      {
        "internalType": "string",
        "name": "metadata",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "autoAssign",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "agents",
    "outputs": [
      {
        "internalType": "address",
        "name": "id",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "metadata",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "paused",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "aggregate",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint128",
            "name": "balance",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "locked",
            "type": "uint128"
          },
          {
            "internalType": "uint256",
            "name": "nativeBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rvTokenBalance",
            "type": "uint256"
          }
        ],
        "internalType": "struct ACTMarketplaceEVM.AggregateData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96",
        "name": "_taskId",
        "type": "uint96"
      },
      {
        "internalType": "uint128",
        "name": "_reward",
        "type": "uint128"
      },
      {
        "internalType": "uint32",
        "name": "_executionDuration",
        "type": "uint32"
      }
    ],
    "name": "assignTaskByAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96",
        "name": "_taskId",
        "type": "uint96"
      },
      {
        "internalType": "address",
        "name": "_agent",
        "type": "address"
      },
      {
        "internalType": "uint128",
        "name": "_reward",
        "type": "uint128"
      },
      {
        "internalType": "uint32",
        "name": "_executionDuration",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "_agentSignature",
        "type": "bytes"
      },
      {
        "internalType": "uint32",
        "name": "_agentSignatureExpire",
        "type": "uint32"
      },
      {
        "internalType": "uint128",
        "name": "_validationReward",
        "type": "uint128"
      }
    ],
    "name": "assignTaskByClient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "balanceLocks",
    "outputs": [
      {
        "internalType": "uint96",
        "name": "taskId",
        "type": "uint96"
      },
      {
        "internalType": "uint32",
        "name": "unlockTs",
        "type": "uint32"
      },
      {
        "internalType": "uint128",
        "name": "amount",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "balances",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint96",
        "name": "",
        "type": "uint96"
      }
    ],
    "name": "clientTasks",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "clientTasksList",
    "outputs": [
      {
        "internalType": "uint96",
        "name": "",
        "type": "uint96"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "clients",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "spent",
        "type": "uint128"
      },
      {
        "internalType": "uint32",
        "name": "tasksCreated",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "tasksAssigned",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "tasksCompleted",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "lastActivityTs",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "enum ActMarketLib.TaskState",
            "name": "state",
            "type": "uint8"
          },
          {
            "internalType": "uint128",
            "name": "reward",
            "type": "uint128"
          },
          {
            "internalType": "uint32",
            "name": "submissionDuration",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "executionDuration",
            "type": "uint32"
          },
          {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "payload",
            "type": "string"
          },
          {
            "internalType": "address[]",
            "name": "agents",
            "type": "address[]"
          },
          {
            "internalType": "bytes",
            "name": "agentSignature",
            "type": "bytes"
          },
          {
            "internalType": "uint32",
            "name": "agentSignatureExpire",
            "type": "uint32"
          },
          {
            "internalType": "uint128",
            "name": "validationReward",
            "type": "uint128"
          }
        ],
        "internalType": "struct ACTMarketplaceEVM.NewTask[]",
        "name": "_tasks",
        "type": "tuple[]"
      }
    ],
    "name": "createTasks",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96[]",
        "name": "_tasks",
        "type": "uint96[]"
      },
      {
        "internalType": "bool",
        "name": "_withdrawFunds",
        "type": "bool"
      }
    ],
    "name": "deleteTasks",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96",
        "name": "_taskId",
        "type": "uint96"
      },
      {
        "internalType": "string",
        "name": "_reason",
        "type": "string"
      }
    ],
    "name": "disputeTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeBasis",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_agent",
        "type": "address"
      }
    ],
    "name": "getAgent",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "id",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "metadata",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "paused",
            "type": "bool"
          },
          {
            "internalType": "bytes32[]",
            "name": "topics",
            "type": "bytes32[]"
          }
        ],
        "internalType": "struct ActMarketLib.Agent",
        "name": "agent",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bool",
            "name": "enabled",
            "type": "bool"
          },
          {
            "internalType": "uint128",
            "name": "fee",
            "type": "uint128"
          },
          {
            "internalType": "uint32",
            "name": "executionDuration",
            "type": "uint32"
          },
          {
            "internalType": "string",
            "name": "metadata",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "autoAssign",
            "type": "bool"
          }
        ],
        "internalType": "struct ActMarketLib.AgentTopic[]",
        "name": "topics",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "start",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      }
    ],
    "name": "getClienTasks",
    "outputs": [
      {
        "internalType": "uint96[]",
        "name": "",
        "type": "uint96[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96",
        "name": "id",
        "type": "uint96"
      }
    ],
    "name": "getTask",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint96",
            "name": "id",
            "type": "uint96"
          },
          {
            "internalType": "uint32",
            "name": "createdAtTs",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "submissionDuration",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "updatedAtTs",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "executionDuration",
            "type": "uint32"
          },
          {
            "internalType": "uint128",
            "name": "reward",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "validationReward",
            "type": "uint128"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "assignedAgent",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "validator",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "payload",
            "type": "string"
          },
          {
            "internalType": "enum ActMarketLib.TaskState",
            "name": "state",
            "type": "uint8"
          }
        ],
        "internalType": "struct ActMarketLib.Task",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "start",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      }
    ],
    "name": "getValidTopics",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "idCounter",
    "outputs": [
      {
        "internalType": "uint96",
        "name": "",
        "type": "uint96"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "_revenueToken",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "_serviceFee",
        "type": "uint8"
      },
      {
        "internalType": "uint32",
        "name": "_serviceDelay",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "_validationDelay",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "_validatorStakeDuration",
        "type": "uint32"
      },
      {
        "internalType": "uint128",
        "name": "_validatorStakeAmount",
        "type": "uint128"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account_",
        "type": "address"
      }
    ],
    "name": "lockedBalance",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "locked",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account_",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "taskId_",
        "type": "uint256"
      }
    ],
    "name": "lockedBalanceByTask",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "locked",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_metadata",
        "type": "string"
      },
      {
        "internalType": "bytes32[]",
        "name": "_topics",
        "type": "bytes32[]"
      },
      {
        "components": [
          {
            "internalType": "bool",
            "name": "enabled",
            "type": "bool"
          },
          {
            "internalType": "uint128",
            "name": "fee",
            "type": "uint128"
          },
          {
            "internalType": "uint32",
            "name": "executionDuration",
            "type": "uint32"
          },
          {
            "internalType": "string",
            "name": "metadata",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "autoAssign",
            "type": "bool"
          }
        ],
        "internalType": "struct ActMarketLib.AgentTopic[]",
        "name": "_topicsConfigs",
        "type": "tuple[]"
      }
    ],
    "name": "registerAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96",
        "name": "_taskId",
        "type": "uint96"
      },
      {
        "internalType": "uint128",
        "name": "_clientAmount",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "_agentAmount",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "_validatorAmount",
        "type": "uint128"
      },
      {
        "internalType": "string",
        "name": "_results",
        "type": "string"
      }
    ],
    "name": "resolveTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "serviceDelay",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "serviceFee",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_metadata",
        "type": "string"
      }
    ],
    "name": "setAgentMetadata",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_agent",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "state",
        "type": "bool"
      }
    ],
    "name": "setAgentPaused",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32[]",
        "name": "_topics",
        "type": "bytes32[]"
      },
      {
        "components": [
          {
            "internalType": "bool",
            "name": "enabled",
            "type": "bool"
          },
          {
            "internalType": "uint128",
            "name": "fee",
            "type": "uint128"
          },
          {
            "internalType": "uint32",
            "name": "executionDuration",
            "type": "uint32"
          },
          {
            "internalType": "string",
            "name": "metadata",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "autoAssign",
            "type": "bool"
          }
        ],
        "internalType": "struct ActMarketLib.AgentTopic[]",
        "name": "_topicsConfigs",
        "type": "tuple[]"
      }
    ],
    "name": "setAgentTopics",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "_serviceFee",
        "type": "uint8"
      },
      {
        "internalType": "uint32",
        "name": "_serviceDelay",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "_validationDelay",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "_validatorStakeDuration",
        "type": "uint32"
      },
      {
        "internalType": "uint128",
        "name": "_validatorStakeAmount",
        "type": "uint128"
      }
    ],
    "name": "setConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32[]",
        "name": "_topics",
        "type": "bytes32[]"
      },
      {
        "internalType": "bool",
        "name": "_state",
        "type": "bool"
      }
    ],
    "name": "setValidTopics",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_metadata",
        "type": "string"
      }
    ],
    "name": "stakeValidator",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96",
        "name": "_taskId",
        "type": "uint96"
      },
      {
        "internalType": "string",
        "name": "_result",
        "type": "string"
      }
    ],
    "name": "submitTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96",
        "name": "",
        "type": "uint96"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "taskInvitations",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96",
        "name": "",
        "type": "uint96"
      }
    ],
    "name": "tasks",
    "outputs": [
      {
        "internalType": "uint96",
        "name": "id",
        "type": "uint96"
      },
      {
        "internalType": "uint32",
        "name": "createdAtTs",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "submissionDuration",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "updatedAtTs",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "executionDuration",
        "type": "uint32"
      },
      {
        "internalType": "uint128",
        "name": "reward",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "validationReward",
        "type": "uint128"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "assignedAgent",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "validator",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "topic",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "payload",
        "type": "string"
      },
      {
        "internalType": "enum ActMarketLib.TaskState",
        "name": "state",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account_",
        "type": "address"
      }
    ],
    "name": "unlockBalance",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "unlocked",
        "type": "uint128"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "validTopics",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "validTopicsList",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint96",
        "name": "_taskId",
        "type": "uint96"
      },
      {
        "internalType": "bool",
        "name": "_approved",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "_result",
        "type": "string"
      }
    ],
    "name": "validateTask",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "validationDelay",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "validatorTopics",
    "outputs": [
      {
        "internalType": "bool",
        "name": "enabled",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "metadata",
        "type": "string"
      },
      {
        "internalType": "uint128",
        "name": "feesEarned",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "validators",
    "outputs": [
      {
        "internalType": "address",
        "name": "id",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "metadata",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "paused",
        "type": "bool"
      },
      {
        "internalType": "uint32",
        "name": "expireAtTs",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint128",
        "name": "_amount",
        "type": "uint128"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
