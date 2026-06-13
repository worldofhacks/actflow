// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./mocks/AgentNFT.sol";
import "./mocks/RevenueToken.sol";

import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import {ActMarketLib} from "./ACTLib.sol";

contract ACTMarketplaceEVM is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    bytes32[] public validTopicsList;
    mapping(bytes32 => bool) public validTopics;

    mapping(address => ActMarketLib.Client) public clients;
    uint96 public idCounter;
    mapping(uint96 => ActMarketLib.Task) public tasks;
    mapping(address => uint96[]) public clientTasksList;
    mapping(address => mapping(uint96 => bool)) public clientTasks;

    mapping(uint96 => address[]) public taskInvitations;

    struct BalanceLock {
        uint96 taskId;
        uint32 unlockTs;
        uint128 amount;
    }
    mapping(address => uint128) public balances;
    mapping(address => BalanceLock[]) public balanceLocks;

    mapping(address => ActMarketLib.Agent) public agents;
    mapping(address => mapping(bytes32 => ActMarketLib.AgentTopic))
        public agentTopics;

    mapping(address => ActMarketLib.Validator) public validators;
    mapping(address => mapping(bytes32 => ActMarketLib.ValidatorTopic))
        public validatorTopics;

    uint32 public serviceDelay; // duration of approve / disput
    uint32 public validationDelay; // duration of approve / disput
    uint16 public feeBasis;
    uint8 public serviceFee; // 100 = 10%

    uint32 validatorStakeDuration;
    uint128 validatorStakeAmount;

    RevenueToken public REVENUE_TOKEN;

    function initialize(
        address payable _revenueToken,
        uint8 _serviceFee,
        uint32 _serviceDelay,
        uint32 _validationDelay,
        uint32 _validatorStakeDuration,
        uint128 _validatorStakeAmount
    ) public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        REVENUE_TOKEN = RevenueToken(_revenueToken);

        feeBasis = 1000;

        setConfig(
            _serviceFee,
            _serviceDelay,
            _validationDelay,
            _validatorStakeDuration,
            _validatorStakeAmount
        );
    }

    // ---------------------------------- ADMIN ----------------------------------
    function setConfig(
        uint8 _serviceFee,
        uint32 _serviceDelay,
        uint32 _validationDelay,
        uint32 _validatorStakeDuration,
        uint128 _validatorStakeAmount
    ) public onlyOwner {
        serviceFee = _serviceFee;
        serviceDelay = _serviceDelay;
        validationDelay = _validationDelay;
        validatorStakeDuration = _validatorStakeDuration;
        validatorStakeAmount = _validatorStakeAmount;
        emit SetConfig();
    }
    event SetConfig();

    function setValidTopics(
        bytes32[] memory _topics,
        bool _state
    ) external onlyOwner {
        unchecked {
            uint256 len = _topics.length;

            if (_state) {
                bytes32[] storage validTopicList = validTopicsList; // Storage reference
                // Handle adding topics separately
                for (uint256 i = 0; i < len; ++i) {
                    bytes32 topic = _topics[i];
                    if (!validTopics[topic]) {
                        // Directly access mapping for gas savings
                        validTopics[topic] = true;
                        validTopicList.push(topic);
                        emit SetValidTopic(topic, true);
                    }
                }
            } else {
                // Handle removing topics separately
                for (uint256 i = 0; i < len; ++i) {
                    bytes32 topic = _topics[i];
                    if (validTopics[topic]) {
                        // Directly access mapping for gas savings
                        validTopics[topic] = false;
                        _removeValidTopicFromList(topic);
                        emit SetValidTopic(topic, false);
                    }
                }
            }
        }
    }
    event SetValidTopic(bytes32 topic, bool state);

    function setAgentPaused(address _agent, bool state) external onlyOwner {
        _assertAgentRegistered(_agent);
        agents[_agent].paused = state;
        emit SetAgentPaused(_agent, state);
    }
    event SetAgentPaused(address indexed agent, bool state);

    // ---------------------------------- TOPICS ----------------------------------

    function _removeValidTopicFromList(bytes32 _topic) internal {
        uint256 len = validTopicsList.length;
        if (len == 0) return;

        unchecked {
            for (uint256 i = 0; i < len; ++i) {
                if (validTopicsList[i] == _topic) {
                    validTopicsList[i] = validTopicsList[len - 1];
                    validTopicsList.pop();
                    return;
                }
            }
        }
    }

    function _assertValidTopic(bytes32 _topic) internal view {
        require(validTopics[_topic], "Invalid topic");
    }

    function getValidTopics(
        uint256 start,
        uint256 count
    ) external view returns (bytes32[] memory) {
        uint256 total = validTopicsList.length;

        // If count is 0, return all topics
        if (count == 0 || start >= total) {
            count = total;
            start = 0; // Ensure full list is returned
        }

        uint256 end = start + count;
        if (end > total) end = total; // Ensure `end` is within bounds

        bytes32[] memory topics = new bytes32[](end - start);
        unchecked {
            for (uint256 i = start; i < end; ++i) {
                topics[i - start] = validTopicsList[i];
            }
        }
        return topics;
    }

    // ---------------------------------- AGENT ----------------------------------

    function registerAgent(
        string calldata _metadata,
        bytes32[] calldata _topics,
        ActMarketLib.AgentTopic[] calldata _topicsConfigs
    ) external whenNotPaused {
        address sender = msg.sender;
        ActMarketLib.Agent storage agent = agents[sender];

        require(agent.id == address(0), "Already registered");

        agent.id = sender;
        agent.metadata = _metadata;

        emit RegisterAgent(sender);
        _setAgentTopics(sender, _topics, _topicsConfigs);
    }
    event RegisterAgent(address indexed agent);

    function setAgentTopics(
        bytes32[] calldata _topics,
        ActMarketLib.AgentTopic[] calldata _topicsConfigs
    ) external {
        _setAgentTopics(msg.sender, _topics, _topicsConfigs);
    }
    event SetAgentTopic(
        address indexed agent,
        bytes32 indexed topic,
        bool state
    );

    function setAgentMetadata(string calldata _metadata) external {
        address sender = msg.sender;
        _assertAgentRegistered(sender);
        agents[sender].metadata = _metadata;
        emit SetAgentMetadata(sender);
    }
    event SetAgentMetadata(address indexed agent);

    function _assertAgentRegistered(address _agent) internal view {
        require(agents[_agent].id == _agent, "Agent not registered");
    }

    function _setAgentTopics(
        address _agent,
        bytes32[] memory _topics,
        ActMarketLib.AgentTopic[] memory _topicsConfigs
    ) internal {
        unchecked {
            uint256 len = _topics.length;

            mapping(bytes32 => ActMarketLib.AgentTopic)
                storage agentTopicMap = agentTopics[_agent]; // Storage reference
            ActMarketLib.Agent storage agent = agents[_agent]; // Storage reference

            for (uint256 i = 0; i < len; i++) {
                bytes32 _topic = _topics[i];

                //require(
                //    _topicsConfigs[i].fee >= feeBasis,
                //    "Reward fee too small"
                //);
                ActMarketLib.AgentTopic memory _topicConfig = _topicsConfigs[i];

                _assertValidTopic(_topic);

                // Only update if state is actually changing
                if (agentTopicMap[_topic].enabled != _topicConfig.enabled) {
                    agentTopicMap[_topic].enabled = _topicConfig.enabled;
                    if (agentTopicMap[_topic].enabled) {
                        // Add topic if enabling
                        agent.topics.push(_topic);
                    } else {
                        // Remove topic if disabling

                        uint256 lent = agent.topics.length;
                        if (lent == 0) continue; // Prevent errors if list is empty
                        uint256 b = 0;
                        while (b < lent) {
                            if (agent.topics[b] == _topic) {
                                // Swap with last element & remove
                                agent.topics[b] = agent.topics[lent - 1];
                                agent.topics.pop();
                                return; // Exit loop after removal
                            }
                            b++;
                        }
                    }
                }

                agentTopicMap[_topic] = _topicConfig;
                emit SetAgentTopic(
                    _agent,
                    _topic,
                    agentTopicMap[_topic].enabled
                );
            }
        }
    }

    function getAgent(
        address _agent
    )
        external
        view
        returns (
            ActMarketLib.Agent memory agent,
            ActMarketLib.AgentTopic[] memory topics
        )
    {
        agent = agents[_agent];
        topics = new ActMarketLib.AgentTopic[](agent.topics.length);
        for (uint256 i = 0; i < agent.topics.length; i++) {
            topics[i] = agentTopics[_agent][agent.topics[i]];
        }
    }

    // ---------------------------------- VALIDATOR ----------------------------------
    function stakeValidator(
        string calldata _metadata
    ) external payable whenNotPaused nonReentrant {
        address sender = msg.sender;

        unlockBalance(sender); // unlock any prior user locks
        uint128 locked = lockedBalance(sender);
        uint128 availableBalance = balances[sender] - locked;

        ActMarketLib.Validator storage validator = validators[sender];

        require(validator.expireAtTs <= block.timestamp, "Already staked");

        validator.id = sender;
        validator.metadata = _metadata;
        validator.expireAtTs = uint32(block.timestamp) + validatorStakeDuration;

        idCounter++;

        // lock tokens for validatorStakeDuration
        _lockBalance(
            sender,
            idCounter,
            validatorStakeAmount,
            validator.expireAtTs
        );

        if (validatorStakeAmount > availableBalance) {
            uint128 deficit = validatorStakeAmount - availableBalance;
            balances[sender] += deficit;

            if (msg.value > 0) {
                require(msg.value >= deficit, "Wrong msg.value");
                REVENUE_TOKEN.deposit{value: deficit}();

                // Refund excess back to sender
                uint256 excess = msg.value - deficit;
                if (excess > 0) {
                    (bool success, ) = payable(msg.sender).call{value: excess}(
                        ""
                    );
                    require(success, "Refund failed");
                }
            } else {
                REVENUE_TOKEN.transferFrom(sender, address(this), deficit);
            }
        }

        emit StakeValidator(sender, validator.expireAtTs);
    }
    event StakeValidator(address indexed agent, uint32 expireAtTs);

    // ---------------------------------- CLIENT ----------------------------------

    struct AggregateData {
        uint128 balance;
        uint128 locked;
        uint256 nativeBalance;
        uint256 rvTokenBalance;
    }

    function aggregate(
        address account
    ) public view returns (AggregateData memory data) {
        data.nativeBalance = account.balance;
        data.rvTokenBalance = REVENUE_TOKEN.balanceOf(account);
        data.balance = balances[account];
        data.locked = lockedBalance(account);
    }

    struct NewTask {
        ActMarketLib.TaskState state;
        uint128 reward;
        uint32 submissionDuration;
        uint32 executionDuration;
        bytes32 topic;
        string payload;
        address[] agents;
        bytes agentSignature;
        uint32 agentSignatureExpire;
        uint128 validationReward;
    }

    function createTasks(
        NewTask[] calldata _tasks
    ) external payable whenNotPaused nonReentrant {
        address sender = msg.sender;

        ActMarketLib.Client storage client = clients[sender];
        unlockBalance(sender); // unlock any prior user locks
        uint128 locked = lockedBalance(sender);
        uint128 availableBalance = balances[sender] - locked;

        uint128 tokensAmount = 0;
        uint256 len = _tasks.length;

        uint96 taskId = idCounter;

        for (uint256 i = 0; i < len; ) {
            taskId++;
            NewTask calldata _task = _tasks[i];
            ActMarketLib.Task storage task = tasks[taskId];

            _assertValidTopic(_task.topic);
            task.topic = _task.topic;
            task.id = taskId;
            task.createdAtTs = uint32(block.timestamp);
            task.submissionDuration = _task.submissionDuration;
            task.executionDuration = _task.executionDuration;

            task.payload = _task.payload;
            task.owner = sender;
            task.reward = _task.reward;
            task.validationReward = _task.validationReward;

            tokensAmount += _task.reward + _task.validationReward;

            client.tasksCreated++;
            client.lastActivityTs = uint32(block.timestamp);

            require(task.reward > 0, "Reward not provided");

            emit CreateTask(sender, taskId);

            // Manual assign of client to agent
            if (_task.state == ActMarketLib.TaskState.ASSIGNED) {
                require(_task.agents.length == 1, "Agent not provided");
                address agent = _task.agents[0];
                _assignTaskByClient(
                    taskId,
                    agent,
                    _task.agentSignature,
                    _task.agentSignatureExpire
                );

                // lock tokens for executionDuration
                _lockBalance(
                    sender,
                    taskId,
                    _task.reward + _task.validationReward,
                    task.createdAtTs + task.executionDuration
                );
            }
            // Invite agents
            else if (_task.state == ActMarketLib.TaskState.INVITED) {
                require(_task.agents.length >= 1, "Agents not provided");

                task.state = ActMarketLib.TaskState.INVITED;

                uint256 agentCount = _task.agents.length;
                for (uint256 a = 0; a < agentCount; ) {
                    address agent = _task.agents[a];
                    _assertAgentRegistered(agent);

                    require(sender != agent, "Self assign not allowed");
                    require(
                        agentTopics[agent][_task.topic].enabled,
                        "Topic not enabled"
                    );
                    require(!agents[agent].paused, "Agent paused");

                    taskInvitations[taskId].push(agent);

                    emit AgentInvite(agent, taskId);

                    unchecked {
                        ++a;
                    }
                }

                // lock tokens for submissionDuration duration
                _lockBalance(
                    sender,
                    taskId,
                    _task.reward + _task.validationReward,
                    task.createdAtTs + task.submissionDuration
                );
            } else {
                // Invite public
                task.state = ActMarketLib.TaskState.PENDING;

                // lock tokens for submissionDuration duration
                _lockBalance(
                    sender,
                    taskId,
                    _task.reward + _task.validationReward,
                    task.createdAtTs + task.submissionDuration
                );
            }

            clientTasks[sender][taskId] = true;
            clientTasksList[sender].push(taskId);

            unchecked {
                ++i;
            }
        }

        idCounter = taskId;

        if (tokensAmount > availableBalance) {
            uint128 deficit = tokensAmount - availableBalance;
            balances[sender] += deficit;

            if (msg.value > 0) {
                require(msg.value >= deficit, "Wrong msg.value");
                REVENUE_TOKEN.deposit{value: deficit}();

                // Refund excess back to sender
                uint256 excess = msg.value - deficit;
                if (excess > 0) {
                    (bool success, ) = payable(msg.sender).call{value: excess}(
                        ""
                    );
                    require(success, "Refund failed");
                }
            } else {
                REVENUE_TOKEN.transferFrom(sender, address(this), deficit);
            }
        }
    }
    event CreateTask(address indexed client, uint256 indexed taskId);
    event AgentInvite(address indexed agent, uint256 indexed taskId);

    function getClienTasks(
        address owner,
        uint256 start,
        uint256 count
    ) external view returns (uint96[] memory) {
        uint96[] storage tasksList = clientTasksList[owner];
        uint256 total = tasksList.length;

        // If count is 0, return all topics
        if (count == 0 || start >= total) {
            count = total;
            start = 0; // Ensure full list is returned
        }

        uint256 end = start + count;
        if (end > total) end = total; // Ensure `end` is within bounds

        uint96[] memory _tasks = new uint96[](end - start);
        unchecked {
            for (uint256 i = start; i < end; ++i) {
                _tasks[i - start] = tasksList[i];
            }
        }
        return _tasks;
    }

    function assignTaskByClient(
        uint96 _taskId,
        address _agent,
        uint128 _reward,
        uint32 _executionDuration,
        bytes memory _agentSignature,
        uint32 _agentSignatureExpire,
        uint128 _validationReward
    ) public {
        address sender = msg.sender;
        ActMarketLib.Task storage task = tasks[_taskId];
        require(sender == task.owner, "Not owner of task");
        require(_reward > 0, "No rewards provided");
        require(
            task.state == ActMarketLib.TaskState.PENDING ||
                task.state == ActMarketLib.TaskState.INVITED,
            "Not allowed"
        );

        unlockBalance(sender);
        _unlockBalanceById(sender, _taskId);
        uint128 availableBalance = balances[sender] - lockedBalance(sender);
        uint128 totalAmount = _reward + task.validationReward;

        _lockBalance(
            sender,
            _taskId,
            totalAmount,
            uint32(block.timestamp) + _executionDuration
        );

        if (totalAmount > availableBalance) {
            uint128 deficit = totalAmount - availableBalance;
            balances[sender] += deficit;
            REVENUE_TOKEN.transferFrom(sender, address(this), deficit);
        }

        task.reward = _reward;
        task.validationReward = _validationReward;
        task.executionDuration = _executionDuration;
        _assignTaskByClient(
            _taskId,
            _agent,
            _agentSignature,
            _agentSignatureExpire
        );
    }

    function _assignTaskByClient(
        uint96 _taskId,
        address _agent,
        bytes memory agentSignature,
        uint32 agentSignatureExpire
    ) internal {
        ActMarketLib.Task storage task = tasks[_taskId];
        ActMarketLib.Agent storage agent = agents[_agent];

        if (agentSignature.length > 0) {
            require(
                SignatureChecker.isValidSignatureNow(
                    _agent,
                    keccak256(
                        abi.encodePacked(
                            "\x19Ethereum Signed Message:\n32",
                            keccak256(
                                abi.encode(
                                    task.reward,
                                    task.payload,
                                    task.executionDuration,
                                    agentSignatureExpire
                                )
                            )
                        )
                    ),
                    agentSignature
                ),
                "Bad agent signature"
            );
            require(
                agentSignatureExpire >= block.timestamp,
                "Signature expired"
            ); //
        } else {
            ActMarketLib.AgentTopic memory agentTopic = agentTopics[_agent][
                task.topic
            ];
            require(agentTopic.autoAssign, "No autoAssign"); //
            require(agentTopic.fee <= task.reward, "Reward not match"); //
            require(
                agentTopic.executionDuration <= task.executionDuration,
                "Execution duration not match"
            ); //
        }

        _assignTask(_taskId, _agent);

        emit AssignTaskByClient(_taskId, _agent);
    }
    event AssignTaskByClient(uint256 indexed taskId, address indexed agent);

    function assignTaskByAgent(
        uint96 _taskId,
        uint128 _reward, // deprecated
        uint32 _executionDuration
    ) external {
        address sender = msg.sender;
        ActMarketLib.Task storage task = tasks[_taskId];

        require(task.state == ActMarketLib.TaskState.INVITED, "Not allowed");
        //require(task.reward == _reward, "Reward not match");
        require(
            task.executionDuration == _executionDuration,
            "Deadline not match"
        );
        require(
            task.createdAtTs + task.submissionDuration > block.timestamp,
            "Deadline is reached"
        );

        bool agentInvited;
        address[] storage invitations = taskInvitations[_taskId];

        unchecked {
            for (uint256 i = 0; i < invitations.length; ++i) {
                if (invitations[i] == sender) {
                    agentInvited = true;
                    break;
                }
            }
        }

        require(agentInvited, "Not invited");

        _assignTask(_taskId, sender);

        emit AssignTaskByAgent(_taskId, sender);
    }
    event AssignTaskByAgent(uint256 indexed taskId, address indexed agent);

    function _assignTask(uint96 _taskId, address _agent) internal {
        _assertAgentRegistered(_agent);
        ActMarketLib.Task storage task = tasks[_taskId];

        require(_agent != task.owner, "Self assign not allowed");
        require(
            agentTopics[_agent][task.topic].enabled,
            "Agent topic not enabled"
        );
        require(!agents[_agent].paused, "Agent paused");

        task.updatedAtTs = uint32(block.timestamp);
        task.assignedAgent = _agent;
        task.state = ActMarketLib.TaskState.ASSIGNED;
    }

    function submitTask(uint96 _taskId, string calldata _result) external {
        address sender = msg.sender;
        ActMarketLib.Task storage task = tasks[_taskId];
        require(task.assignedAgent == sender, "Not assigned to this agent");

        require(
            task.state == ActMarketLib.TaskState.ASSIGNED,
            "Invalid task state"
        );
        require(
            task.updatedAtTs + task.executionDuration >= block.timestamp,
            "Deadline is reached"
        );

        task.updatedAtTs = uint32(block.timestamp);
        task.state = ActMarketLib.TaskState.SUBMITTED;
        _unlockBalanceById(task.owner, _taskId);
        balances[task.owner] -= task.reward;

        if (task.validationReward > 0) {
            _lockBalance(
                task.owner,
                _taskId,
                task.validationReward,
                task.updatedAtTs + serviceDelay
            );
        }

        _lockBalance(
            task.assignedAgent,
            _taskId,
            task.reward,
            task.updatedAtTs + serviceDelay
        );
        balances[task.assignedAgent] += task.reward;

        emit SubmitTask(_taskId, _result);
    }
    event SubmitTask(uint256 indexed taskId, string result);

    function validateTask(
        uint96 _taskId,
        bool _approved,
        string calldata _result
    ) external payable nonReentrant {
        address sender = msg.sender;
        ActMarketLib.Task storage task = tasks[_taskId];

        require(
            task.state == ActMarketLib.TaskState.SUBMITTED,
            "Invalid task state"
        );
        require(
            task.updatedAtTs + serviceDelay >= block.timestamp,
            "Deadline is reached"
        );

        uint32 endTs = task.updatedAtTs + serviceDelay;

        if (sender == task.owner) {
            _unlockBalanceById(task.owner, _taskId);
            task.validationReward = 0; // since validation reward unlocked for owner we reset it to 0
        } else {
            require(task.validator == address(0), "Already validated");
            require(task.validationReward > 0, "Validation not required");
            require(
                task.updatedAtTs + validationDelay <= block.timestamp,
                "Validation not started"
            );
            ActMarketLib.Validator storage validator = validators[sender];
            require(validator.expireAtTs > block.timestamp, "Not validator");

            unlockBalance(sender); // unlock any prior user locks
            uint128 locked = lockedBalance(sender);
            uint128 availableBalance = balances[sender] - locked;

            task.validator = sender;
            _unlockBalanceById(task.owner, _taskId);

            if (task.reward > availableBalance) {
                uint128 deficit = task.reward - availableBalance;
                balances[sender] += deficit;
                if (msg.value > 0) {
                    require(msg.value >= deficit, "Wrong msg.value");
                    REVENUE_TOKEN.deposit{value: deficit}();

                    // Refund excess back to sender
                    uint256 excess = msg.value - deficit;
                    if (excess > 0) {
                        (bool success, ) = payable(msg.sender).call{
                            value: excess
                        }("");
                        require(success, "Refund failed");
                    }
                } else {
                    REVENUE_TOKEN.transferFrom(sender, address(this), deficit);
                }
            }

            balances[task.owner] -= task.validationReward;
            balances[sender] += task.validationReward;

            // validator guarantee for owner or agent
            _lockBalance(
                sender,
                _taskId,
                task.reward + task.validationReward,
                endTs
            );
        }

        _unlockBalanceById(task.assignedAgent, _taskId);

        if (_approved) {
            if (sender == task.owner) {
                task.state = ActMarketLib.TaskState.COMPLETED;
                emit CompleteTask(_taskId);
            } else {
                task.state = ActMarketLib.TaskState.VALIDATED;
                emit ValidateTask(_taskId);
            }
        } else {
            if (sender == task.owner) {
                task.state = ActMarketLib.TaskState.DECLINED_BY_OWNER;
            } else {
                task.state = ActMarketLib.TaskState.DECLINED_BY_VALIDATOR;
            }
            _lockBalance(task.owner, _taskId, task.reward, endTs);
            balances[task.owner] += task.reward;
            balances[task.assignedAgent] -= task.reward;
            emit DeclineTask(_taskId);
        }

        task.updatedAtTs = uint32(block.timestamp);
    }
    event CompleteTask(uint256 indexed taskId);
    event ValidateTask(uint256 indexed taskId);
    event DeclineTask(uint256 indexed taskId);

    function disputeTask(uint96 _taskId, string calldata _reason) external {
        address sender = msg.sender;
        ActMarketLib.Task storage task = tasks[_taskId];

        require(
            task.updatedAtTs + serviceDelay >= block.timestamp,
            "Deadline is reached"
        );

        uint128 amount;
        if (sender == task.owner) {
            require(
                task.state == ActMarketLib.TaskState.VALIDATED,
                "Invalid task state"
            );

            _unlockBalanceById(task.validator, _taskId);

            amount = task.validationReward + task.reward;
            balances[task.validator] -= amount;
            task.state = ActMarketLib.TaskState.DISPUTED_BY_OWNER;
        } else {
            require(sender == task.assignedAgent, "Not agent");
            require(
                task.state == ActMarketLib.TaskState.DECLINED_BY_OWNER ||
                    task.state == ActMarketLib.TaskState.DECLINED_BY_VALIDATOR,
                "Invalid task state"
            );

            if (task.validator == address(0)) {
                _unlockBalanceById(task.owner, _taskId);
                amount = task.reward;
                balances[task.owner] -= amount;
            } else {
                _unlockBalanceById(task.validator, _taskId);
                amount = task.validationReward + task.reward;
                balances[task.validator] -= amount;
            }
            task.state = ActMarketLib.TaskState.DISPUTED_BY_AGENT;
        }

        balances[owner()] += amount;
        task.updatedAtTs = uint32(block.timestamp);

        emit DisputeTask(_taskId, _reason);
    }
    event DisputeTask(uint256 indexed taskId, string reason);

    function resolveTask(
        uint96 _taskId,
        uint128 _clientAmount,
        uint128 _agentAmount,
        uint128 _validatorAmount,
        string memory _results
    ) external {
        address sender = msg.sender;
        ActMarketLib.Task storage task = tasks[_taskId];

        require(
            task.state == ActMarketLib.TaskState.DISPUTED_BY_OWNER ||
                task.state == ActMarketLib.TaskState.DISPUTED_BY_AGENT,
            "Invalid task state"
        );

        if (sender == task.owner) {
            _clientAmount = 0;

            if (task.validationReward > 0) {
                if (task.validator != address(0)) {
                    _validatorAmount = task.reward + task.validationReward;
                } else {
                    _clientAmount = task.validationReward;
                    _agentAmount = task.reward;
                }
            } else {
                _agentAmount = task.reward;
            }
        } else {
            require(sender == owner(), "Not allowed");

            if (task.validationReward > 0) {
                if (task.validator != address(0)) {
                    if (
                        task.state == ActMarketLib.TaskState.DISPUTED_BY_OWNER
                    ) {
                        require(_agentAmount == 0, "Agent already received");
                    }
                } else {
                    require(_validatorAmount == 0, "Validation not performed");
                }
            } else {
                require(_validatorAmount == 0, "Validation not set");
            }

            require(
                task.reward + task.validationReward ==
                    _clientAmount + _agentAmount + _validatorAmount,
                "Amount not match"
            );
        }

        task.updatedAtTs = uint32(block.timestamp);
        task.state = ActMarketLib.TaskState.RESOLVED;

        if (_clientAmount > 0) {
            balances[owner()] -= _clientAmount;
            balances[task.owner] += _clientAmount;
        }

        if (_agentAmount > 0) {
            balances[owner()] -= _agentAmount;
            balances[task.assignedAgent] += _agentAmount;
        }

        if (_validatorAmount > 0) {
            balances[owner()] -= _validatorAmount;
            balances[task.validator] += _validatorAmount;
        }

        emit ResolveTask(
            _taskId,
            _clientAmount,
            _agentAmount,
            _validatorAmount
        );
    }
    event ResolveTask(
        uint256 indexed taskId,
        uint128 _clientAmount,
        uint128 _agentAmount,
        uint128 _validatorAmount
    );

    function deleteTasks(
        uint96[] calldata _tasks,
        bool _withdrawFunds
    ) external {
        address sender = msg.sender;

        unlockBalance(sender);

        uint128 withdrawAmount = 0;
        uint256 len = _tasks.length;

        for (uint256 i = 0; i < len; ) {
            uint96 _taskId = _tasks[i];
            ActMarketLib.Task storage task = tasks[_taskId];

            require(
                task.state == ActMarketLib.TaskState.PENDING ||
                    task.state == ActMarketLib.TaskState.INVITED,
                "Not allowed"
            );

            task.state = ActMarketLib.TaskState.DELETED;

            _unlockBalanceById(sender, _taskId);

            emit DeleteTask(_taskId);

            unchecked {
                withdrawAmount += task.reward + task.validationReward;
                ++i;
            }
        }

        if (_withdrawFunds && withdrawAmount > 0) {
            uint128 balance = balances[sender];
            uint128 availableBalance = balance - lockedBalance(sender);

            if (withdrawAmount > availableBalance)
                withdrawAmount = availableBalance;

            balances[sender] = balance - withdrawAmount;
            _withdraw(sender, withdrawAmount);
        }
    }
    event DeleteTask(uint256 indexed taskId);

    function getTask(
        uint96 id
    ) external view returns (ActMarketLib.Task memory) {
        return tasks[id];
    }

    // ------------------------------- FUNDS WITHDRAW -------------------------------

    function withdraw(uint128 _amount) external nonReentrant {
        address sender = msg.sender;
        unlockBalance(sender);
        uint128 balance = balances[sender];
        uint128 availableBalance = balance - lockedBalance(sender);

        if (_amount == 0) {
            _amount = availableBalance;
        }

        require(_amount <= availableBalance, "Not enough funds");
        balances[sender] = balance - _amount;

        _withdraw(sender, _amount);
    }

    function _withdraw(address account_, uint128 amount_) internal {
        require(amount_ > 0, "Zero amount");
        uint128 fee = 0;
        if (serviceFee > 0) {
            fee = (amount_ * serviceFee) / feeBasis;
            if (fee > 0) {
                amount_ -= fee;
                REVENUE_TOKEN.transfer(owner(), fee);
            }
        }
        REVENUE_TOKEN.transfer(account_, amount_);

        emit Withdraw(account_, amount_, fee);
    }
    event Withdraw(address indexed client, uint256 amount, uint256 feeAmount);

    // ------------------------------- BALANCE LOCKS -------------------------------

    function _lockBalance(
        address account_,
        uint96 taskId_,
        uint128 amount_,
        uint32 unlockTs_
    ) internal {
        require(unlockTs_ > block.timestamp, "Wrong unlock timestamp");
        require(amount_ > 0, "Zero lock amount");
        require(taskId_ > 0, "No ref provided");

        BalanceLock[] storage locks = balanceLocks[account_];
        uint256 length = locks.length;

        uint256 i = 0;
        bool refFound = false;

        while (i < length) {
            BalanceLock storage lock = locks[i];
            if (lock.taskId == taskId_) {
                refFound = true;
                lock.amount += amount_;
                break;
            }
            unchecked {
                i++;
            }
        }

        if (!refFound) {
            require(length < 256, "Max tasks reached");
            locks.push(
                BalanceLock({
                    taskId: taskId_,
                    unlockTs: unlockTs_,
                    amount: amount_
                })
            );
        }
    }

    function lockedBalanceByTask(
        address account_,
        uint256 taskId_
    ) public view returns (uint128 locked) {
        BalanceLock[] storage locks = balanceLocks[account_];
        uint256 length = locks.length;

        uint256 i = 0;
        while (i < length) {
            BalanceLock storage lock = locks[i];
            if (lock.taskId == taskId_) {
                return lock.amount;
            }
            unchecked {
                i++;
            }
        }
    }

    function _unlockBalanceById(
        address account_,
        uint256 taskId_
    ) internal returns (uint128 unlocked) {
        BalanceLock[] storage locks = balanceLocks[account_]; // Cache storage reference
        uint256 length = locks.length; // Cache array length

        uint256 i = 0;
        while (i < length) {
            BalanceLock storage lock = locks[i]; // Use `storage` pointer to reduce `SLOAD`
            if (lock.taskId == taskId_) {
                unlocked = lock.amount;

                // If it's not the last element, swap & pop
                if (i != length - 1) {
                    locks[i] = locks[length - 1];
                }

                locks.pop(); // Remove last element (cheaper than shifting array)
                return unlocked; // Direct return to save gas
            }
            unchecked {
                i++;
            } // Gas-efficient increment
        }
    }

    function unlockBalance(address account_) public returns (uint128 unlocked) {
        BalanceLock[] storage locks = balanceLocks[account_]; // Cache storage reference
        uint256 length = locks.length; // Cache storage length in memory
        uint256 idx = 0; // Use uint256 (default for storage loops)

        while (idx < length) {
            BalanceLock storage cLock = locks[idx]; // Use storage reference (avoids extra `SLOAD`)

            if (cLock.unlockTs <= block.timestamp) {
                unlocked += cLock.amount; // Add the amount of the unlocked lock to the total unlocked amount

                // Swap with the last element and remove it
                if (idx != length - 1) {
                    // Only swap if needed (avoid unnecessary writes)
                    locks[idx] = locks[length - 1];
                }
                locks.pop();
                // Decrease the length as one lock is removed
                unchecked {
                    length--;
                } // Reduce array length safely
            } else {
                // Move to the next lock if the current one is not ready to be unlocked
                unchecked {
                    idx++;
                } // Safe increment
            }
        }
    }

    function lockedBalance(
        address account_
    ) public view returns (uint128 locked) {
        BalanceLock[] storage locks = balanceLocks[account_];
        uint256 len = locks.length;
        uint256 i;
        while (i < len) {
            BalanceLock storage lock = locks[i];
            if (lock.unlockTs > block.timestamp) {
                locked += lock.amount;
            }
            unchecked {
                i++;
            }
        }
    }
}
