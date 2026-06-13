// Ported verbatim from the vendored @act-1-the-prophecy/contract prebuilt dist
// (actflow-backend/src/packages/act-contracts/dist/types/abi/marketplaceAbi.js).
// TODO(contracts-parity): before pointing the indexer at a fresh deployment, diff this ABI
// and EVENT_SIGNATURES against packages/contracts (ACTMarketplaceEVM). A silent mismatch
// drops events. See docs/hackathon/CONTRACTS-DIFF.md.
export const marketplaceAbi = [
  {
    "type": "error",
    "name": "EnforcedPause",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ExpectedPause",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidInitialization",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotInitializing",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "type": "address",
        "name": "owner"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "type": "address",
        "name": "account"
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "AgentInvite",
    "inputs": [
      {
        "type": "address",
        "name": "agent",
        "indexed": true
      },
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "AssignTaskByAgent",
    "inputs": [
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      },
      {
        "type": "address",
        "name": "agent",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "AssignTaskByClient",
    "inputs": [
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      },
      {
        "type": "address",
        "name": "agent",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "CompleteTask",
    "inputs": [
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "CreateTask",
    "inputs": [
      {
        "type": "address",
        "name": "client",
        "indexed": true
      },
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "DeclineTask",
    "inputs": [
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "DeleteTask",
    "inputs": [
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "DisputeTask",
    "inputs": [
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      },
      {
        "type": "string",
        "name": "reason",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "Initialized",
    "inputs": [
      {
        "type": "uint64",
        "name": "version",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "type": "address",
        "name": "previousOwner",
        "indexed": true
      },
      {
        "type": "address",
        "name": "newOwner",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "Paused",
    "inputs": [
      {
        "type": "address",
        "name": "account",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "RegisterAgent",
    "inputs": [
      {
        "type": "address",
        "name": "agent",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "ResolveTask",
    "inputs": [
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      },
      {
        "type": "uint128",
        "name": "_clientAmount",
        "indexed": false
      },
      {
        "type": "uint128",
        "name": "_agentAmount",
        "indexed": false
      },
      {
        "type": "uint128",
        "name": "_validatorAmount",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "SetAgentMetadata",
    "inputs": [
      {
        "type": "address",
        "name": "agent",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "SetAgentPaused",
    "inputs": [
      {
        "type": "address",
        "name": "agent",
        "indexed": true
      },
      {
        "type": "bool",
        "name": "state",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "SetAgentTopic",
    "inputs": [
      {
        "type": "address",
        "name": "agent",
        "indexed": true
      },
      {
        "type": "bytes32",
        "name": "topic",
        "indexed": true
      },
      {
        "type": "bool",
        "name": "state",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "SetConfig",
    "inputs": [
      {
        "type": "uint8",
        "name": "serviceFee",
        "indexed": false
      },
      {
        "type": "uint32",
        "name": "serviceDelay",
        "indexed": false
      },
      {
        "type": "uint32",
        "name": "validationDelay",
        "indexed": false
      },
      {
        "type": "uint32",
        "name": "validatorStakeDuration",
        "indexed": false
      },
      {
        "type": "uint128",
        "name": "validatorStakeAmount",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "StakeValidator",
    "inputs": [
      {
        "type": "address",
        "name": "agent",
        "indexed": true
      },
      {
        "type": "uint32",
        "name": "expireAtTs",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "SubmitTask",
    "inputs": [
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      },
      {
        "type": "string",
        "name": "result",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "Unpaused",
    "inputs": [
      {
        "type": "address",
        "name": "account",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "ValidateTask",
    "inputs": [
      {
        "type": "uint256",
        "name": "taskId",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "anonymous": false,
    "name": "Withdraw",
    "inputs": [
      {
        "type": "address",
        "name": "client",
        "indexed": true
      },
      {
        "type": "uint256",
        "name": "amount",
        "indexed": false
      },
      {
        "type": "uint256",
        "name": "feeAmount",
        "indexed": false
      }
    ]
  },
  {
    "type": "function",
    "name": "ACT_STORY",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [],
    "outputs": [
      {
        "type": "address",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "REVENUE_TOKEN",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [],
    "outputs": [
      {
        "type": "address",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "agentTopics",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": ""
      },
      {
        "type": "bytes32",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "bool",
        "name": "enabled"
      },
      {
        "type": "uint128",
        "name": "fee"
      },
      {
        "type": "uint32",
        "name": "executionDuration"
      },
      {
        "type": "string",
        "name": "metadata"
      },
      {
        "type": "bool",
        "name": "autoAssign"
      }
    ]
  },
  {
    "type": "function",
    "name": "agents",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "address",
        "name": "id"
      },
      {
        "type": "string",
        "name": "metadata"
      },
      {
        "type": "bool",
        "name": "paused"
      }
    ]
  },
  {
    "type": "function",
    "name": "aggregate",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "account"
      }
    ],
    "outputs": [
      {
        "type": "tuple",
        "name": "data",
        "components": [
          {
            "type": "uint128",
            "name": "balance"
          },
          {
            "type": "uint128",
            "name": "locked"
          },
          {
            "type": "uint256",
            "name": "nativeBalance"
          },
          {
            "type": "uint256",
            "name": "rvTokenBalance"
          }
        ]
      }
    ]
  },
  {
    "type": "function",
    "name": "assignTaskByAgent",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "uint96",
        "name": "_taskId"
      },
      {
        "type": "uint128",
        "name": "_reward"
      },
      {
        "type": "uint32",
        "name": "_executionDuration"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "assignTaskByClient",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "uint96",
        "name": "_taskId"
      },
      {
        "type": "address",
        "name": "_agent"
      },
      {
        "type": "uint128",
        "name": "_reward"
      },
      {
        "type": "uint32",
        "name": "_executionDuration"
      },
      {
        "type": "bytes",
        "name": "_agentSignature"
      },
      {
        "type": "uint32",
        "name": "_agentSignatureExpire"
      },
      {
        "type": "uint128",
        "name": "_validationReward"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "balanceLocks",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": ""
      },
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "uint96",
        "name": "taskId"
      },
      {
        "type": "uint32",
        "name": "unlockTs"
      },
      {
        "type": "uint128",
        "name": "amount"
      }
    ]
  },
  {
    "type": "function",
    "name": "balances",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "uint128",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "clientTasks",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": ""
      },
      {
        "type": "uint96",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "bool",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "clientTasksList",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": ""
      },
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "uint96",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "clients",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "uint128",
        "name": "spent"
      },
      {
        "type": "uint32",
        "name": "tasksCreated"
      },
      {
        "type": "uint32",
        "name": "tasksAssigned"
      },
      {
        "type": "uint32",
        "name": "tasksCompleted"
      },
      {
        "type": "uint32",
        "name": "lastActivityTs"
      }
    ]
  },
  {
    "type": "function",
    "name": "createTasks",
    "constant": false,
    "stateMutability": "payable",
    "payable": true,
    "inputs": [
      {
        "type": "tuple[]",
        "name": "_tasks",
        "components": [
          {
            "type": "uint8",
            "name": "state"
          },
          {
            "type": "uint128",
            "name": "reward"
          },
          {
            "type": "uint32",
            "name": "submissionDuration"
          },
          {
            "type": "uint32",
            "name": "executionDuration"
          },
          {
            "type": "bytes32",
            "name": "topic"
          },
          {
            "type": "string",
            "name": "payload"
          },
          {
            "type": "address[]",
            "name": "agents"
          },
          {
            "type": "bytes",
            "name": "agentSignature"
          },
          {
            "type": "uint32",
            "name": "agentSignatureExpire"
          },
          {
            "type": "uint128",
            "name": "validationReward"
          }
        ]
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "deleteTasks",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "uint96[]",
        "name": "_tasks"
      },
      {
        "type": "bool",
        "name": "_withdrawFunds"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "disputeTask",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "uint96",
        "name": "_taskId"
      },
      {
        "type": "string",
        "name": "_reason"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "feeBasis",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [],
    "outputs": [
      {
        "type": "uint16",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "getAgent",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "_agent"
      }
    ],
    "outputs": [
      {
        "type": "tuple",
        "name": "agent",
        "components": [
          {
            "type": "address",
            "name": "id"
          },
          {
            "type": "string",
            "name": "metadata"
          },
          {
            "type": "bool",
            "name": "paused"
          },
          {
            "type": "bytes32[]",
            "name": "topics"
          }
        ]
      },
      {
        "type": "tuple[]",
        "name": "topics",
        "components": [
          {
            "type": "bool",
            "name": "enabled"
          },
          {
            "type": "uint128",
            "name": "fee"
          },
          {
            "type": "uint32",
            "name": "executionDuration"
          },
          {
            "type": "string",
            "name": "metadata"
          },
          {
            "type": "bool",
            "name": "autoAssign"
          }
        ]
      }
    ]
  },
  {
    "type": "function",
    "name": "getClienTasks",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "owner"
      },
      {
        "type": "uint256",
        "name": "start"
      },
      {
        "type": "uint256",
        "name": "count"
      }
    ],
    "outputs": [
      {
        "type": "uint96[]",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "getTask",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "uint96",
        "name": "id"
      }
    ],
    "outputs": [
      {
        "type": "tuple",
        "name": "",
        "components": [
          {
            "type": "uint96",
            "name": "id"
          },
          {
            "type": "uint32",
            "name": "createdAtTs"
          },
          {
            "type": "uint32",
            "name": "submissionDuration"
          },
          {
            "type": "uint32",
            "name": "updatedAtTs"
          },
          {
            "type": "uint32",
            "name": "executionDuration"
          },
          {
            "type": "uint128",
            "name": "reward"
          },
          {
            "type": "uint128",
            "name": "validationReward"
          },
          {
            "type": "address",
            "name": "owner"
          },
          {
            "type": "address",
            "name": "assignedAgent"
          },
          {
            "type": "address",
            "name": "validator"
          },
          {
            "type": "bytes32",
            "name": "topic"
          },
          {
            "type": "string",
            "name": "payload"
          },
          {
            "type": "uint8",
            "name": "state"
          }
        ]
      }
    ]
  },
  {
    "type": "function",
    "name": "idCounter",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [],
    "outputs": [
      {
        "type": "uint96",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "initialize",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "_actStory"
      },
      {
        "type": "address",
        "name": "_revenueToken"
      },
      {
        "type": "uint8",
        "name": "_serviceFee"
      },
      {
        "type": "uint32",
        "name": "_serviceDelay"
      },
      {
        "type": "uint32",
        "name": "_validationDelay"
      },
      {
        "type": "uint32",
        "name": "_validatorStakeDuration"
      },
      {
        "type": "uint128",
        "name": "_validatorStakeAmount"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "lockedBalance",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "account_"
      }
    ],
    "outputs": [
      {
        "type": "uint128",
        "name": "locked"
      }
    ]
  },
  {
    "type": "function",
    "name": "lockedBalanceByTask",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "account_"
      },
      {
        "type": "uint256",
        "name": "taskId_"
      }
    ],
    "outputs": [
      {
        "type": "uint128",
        "name": "locked"
      }
    ]
  },
  {
    "type": "function",
    "name": "owner",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [],
    "outputs": [
      {
        "type": "address",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "paused",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [],
    "outputs": [
      {
        "type": "bool",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "registerAgent",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "string",
        "name": "_metadata"
      },
      {
        "type": "bytes32[]",
        "name": "_topics"
      },
      {
        "type": "tuple[]",
        "name": "_topicsConfigs",
        "components": [
          {
            "type": "bool",
            "name": "enabled"
          },
          {
            "type": "uint128",
            "name": "fee"
          },
          {
            "type": "uint32",
            "name": "executionDuration"
          },
          {
            "type": "string",
            "name": "metadata"
          },
          {
            "type": "bool",
            "name": "autoAssign"
          }
        ]
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "constant": false,
    "payable": false,
    "inputs": [],
    "outputs": []
  },
  {
    "type": "function",
    "name": "resolveTask",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "uint96",
        "name": "_taskId"
      },
      {
        "type": "uint128",
        "name": "_clientAmount"
      },
      {
        "type": "uint128",
        "name": "_agentAmount"
      },
      {
        "type": "uint128",
        "name": "_validatorAmount"
      },
      {
        "type": "string",
        "name": "_results"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "serviceDelay",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [],
    "outputs": [
      {
        "type": "uint32",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "serviceFee",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [],
    "outputs": [
      {
        "type": "uint8",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "setAgentMetadata",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "string",
        "name": "_metadata"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "setAgentPaused",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "_agent"
      },
      {
        "type": "bool",
        "name": "state"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "setAgentTopics",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "bytes32[]",
        "name": "_topics"
      },
      {
        "type": "tuple[]",
        "name": "_topicsConfigs",
        "components": [
          {
            "type": "bool",
            "name": "enabled"
          },
          {
            "type": "uint128",
            "name": "fee"
          },
          {
            "type": "uint32",
            "name": "executionDuration"
          },
          {
            "type": "string",
            "name": "metadata"
          },
          {
            "type": "bool",
            "name": "autoAssign"
          }
        ]
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "setConfig",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "uint8",
        "name": "_serviceFee"
      },
      {
        "type": "uint32",
        "name": "_serviceDelay"
      },
      {
        "type": "uint32",
        "name": "_validationDelay"
      },
      {
        "type": "uint32",
        "name": "_validatorStakeDuration"
      },
      {
        "type": "uint128",
        "name": "_validatorStakeAmount"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "stakeValidator",
    "constant": false,
    "stateMutability": "payable",
    "payable": true,
    "inputs": [
      {
        "type": "string",
        "name": "_metadata"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "submitTask",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "uint96",
        "name": "_taskId"
      },
      {
        "type": "string",
        "name": "_result"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "taskInvitations",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "uint96",
        "name": ""
      },
      {
        "type": "uint256",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "address",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "tasks",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "uint96",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "uint96",
        "name": "id"
      },
      {
        "type": "uint32",
        "name": "createdAtTs"
      },
      {
        "type": "uint32",
        "name": "submissionDuration"
      },
      {
        "type": "uint32",
        "name": "updatedAtTs"
      },
      {
        "type": "uint32",
        "name": "executionDuration"
      },
      {
        "type": "uint128",
        "name": "reward"
      },
      {
        "type": "uint128",
        "name": "validationReward"
      },
      {
        "type": "address",
        "name": "owner"
      },
      {
        "type": "address",
        "name": "assignedAgent"
      },
      {
        "type": "address",
        "name": "validator"
      },
      {
        "type": "bytes32",
        "name": "topic"
      },
      {
        "type": "string",
        "name": "payload"
      },
      {
        "type": "uint8",
        "name": "state"
      }
    ]
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "newOwner"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "unlockBalance",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "account_"
      }
    ],
    "outputs": [
      {
        "type": "uint128",
        "name": "unlocked"
      }
    ]
  },
  {
    "type": "function",
    "name": "validateTask",
    "constant": false,
    "stateMutability": "payable",
    "payable": true,
    "inputs": [
      {
        "type": "uint96",
        "name": "_taskId"
      },
      {
        "type": "bool",
        "name": "_approved"
      },
      {
        "type": "string",
        "name": "_result"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "validationDelay",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [],
    "outputs": [
      {
        "type": "uint32",
        "name": ""
      }
    ]
  },
  {
    "type": "function",
    "name": "validators",
    "constant": true,
    "stateMutability": "view",
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": ""
      }
    ],
    "outputs": [
      {
        "type": "address",
        "name": "id"
      },
      {
        "type": "string",
        "name": "metadata"
      },
      {
        "type": "bool",
        "name": "paused"
      },
      {
        "type": "uint32",
        "name": "expireAtTs"
      }
    ]
  },
  {
    "type": "function",
    "name": "withdraw",
    "constant": false,
    "payable": false,
    "inputs": [
      {
        "type": "uint128",
        "name": "_amount"
      }
    ],
    "outputs": []
  }
];
