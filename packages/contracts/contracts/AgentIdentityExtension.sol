// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentIdentityExtension
/// @notice Standalone registry that links an ActFlow agent address to its
///         off-chain/cross-protocol identity references: an ENS node
///         (ENSIP-25 / ENSIP-26 subname, e.g. `agent1.actflow.eth`) and an
///         ERC-8004 agent id.
/// @dev    This contract is intentionally SEPARATE from the core
///         ACTMarketplaceEVM marketplace. The marketplace `Agent` struct
///         (see ACTLib.sol) is NOT modified; this extension augments it.
///
///         By design this contract hard-codes NO ENS name, NO contract
///         address, and NO chain id. All identity values (`ensNode`,
///         `erc8004Id`, `ensName`) are supplied by the caller at runtime.
///         The ENS node passed in MUST be computed off-chain as
///         `namehash(normalize(name))` per the ens-agents skill (ENSIP-15
///         normalize first, then namehash) — the contract treats it as an
///         opaque key. Likewise `erc8004Id` is the registry-defined agent
///         identifier; this contract makes no assumption about which
///         ERC-8004 registry / chain it came from.
contract AgentIdentityExtension is Ownable {
    /// @notice Identity references for a single agent.
    /// @param ensNode    ENS namehash of the agent's (sub)name, or bytes32(0) if unset.
    /// @param erc8004Id  Agent id in the ERC-8004 Identity Registry (0 if unset).
    /// @param ensName    Human-readable ENS name (normalized off-chain), informational only.
    struct Identity {
        bytes32 ensNode;
        uint256 erc8004Id;
        string ensName;
    }

    /// @dev agent address => identity record.
    mapping(address => Identity) private _identities;

    /// @dev ENS node => agent address that claimed it (reverse lookup / uniqueness guard).
    mapping(bytes32 => address) private _agentByNode;

    /// @notice Emitted whenever an identity record is created or updated.
    /// @param agent     The agent whose record changed.
    /// @param ensNode   The ENS node now bound to the agent (indexed for reverse lookup in logs).
    /// @param erc8004Id The ERC-8004 agent id now bound to the agent.
    event IdentitySet(
        address indexed agent,
        bytes32 indexed ensNode,
        uint256 erc8004Id
    );

    /// @param initialOwner Owner allowed to call {setIdentityFor} (admin/backend wiring).
    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Set (or update) the caller's OWN identity record (agent self-links).
    /// @param ensNode   ENS namehash for the agent's name (bytes32(0) allowed to clear ENS link).
    /// @param erc8004Id ERC-8004 agent id (0 allowed).
    /// @param ensName   Human-readable, off-chain-normalized ENS name (may be empty).
    function setIdentity(
        bytes32 ensNode,
        uint256 erc8004Id,
        string calldata ensName
    ) external {
        _setIdentity(msg.sender, ensNode, erc8004Id, ensName);
    }

    /// @notice Owner-only: set (or update) an identity record on behalf of an agent.
    /// @dev    For admin / backend wiring where the agent cannot self-call.
    /// @param agent     The agent whose record is being set (non-zero).
    /// @param ensNode   ENS namehash for the agent's name (bytes32(0) allowed to clear ENS link).
    /// @param erc8004Id ERC-8004 agent id (0 allowed).
    /// @param ensName   Human-readable, off-chain-normalized ENS name (may be empty).
    function setIdentityFor(
        address agent,
        bytes32 ensNode,
        uint256 erc8004Id,
        string calldata ensName
    ) external onlyOwner {
        require(agent != address(0), "AgentIdentity: zero agent");
        _setIdentity(agent, ensNode, erc8004Id, ensName);
    }

    /// @notice Read an agent's full identity record.
    /// @param agent The agent to look up.
    /// @return The {Identity} struct (zero-valued fields if never set).
    function getIdentity(address agent) external view returns (Identity memory) {
        return _identities[agent];
    }

    /// @notice Reverse lookup: which agent claimed a given ENS node.
    /// @param ensNode The ENS namehash to look up.
    /// @return The agent address bound to the node, or address(0) if none.
    function getAgentByNode(bytes32 ensNode) external view returns (address) {
        return _agentByNode[ensNode];
    }

    /// @dev Core write path shared by {setIdentity} and {setIdentityFor}.
    ///      Enforces that a non-zero ENS node cannot be claimed by two
    ///      different agents, and maintains the reverse mapping so an agent
    ///      changing its node frees the old one.
    function _setIdentity(
        address agent,
        bytes32 ensNode,
        uint256 erc8004Id,
        string calldata ensName
    ) internal {
        // Guard: a non-zero ENS node may only belong to one agent.
        if (ensNode != bytes32(0)) {
            address claimedBy = _agentByNode[ensNode];
            require(
                claimedBy == address(0) || claimedBy == agent,
                "AgentIdentity: node already claimed"
            );
        }

        // Free the agent's previously-bound node (if changing/clearing it).
        bytes32 oldNode = _identities[agent].ensNode;
        if (oldNode != ensNode && oldNode != bytes32(0)) {
            delete _agentByNode[oldNode];
        }

        _identities[agent] = Identity({
            ensNode: ensNode,
            erc8004Id: erc8004Id,
            ensName: ensName
        });

        if (ensNode != bytes32(0)) {
            _agentByNode[ensNode] = agent;
        }

        emit IdentitySet(agent, ensNode, erc8004Id);
    }
}
