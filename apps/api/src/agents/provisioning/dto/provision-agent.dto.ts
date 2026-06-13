import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** POST /agents/provision body. */
export class ProvisionAgentRequestDto {
  /** Existing agent identifier: wallet address (0x...) OR mongo id. */
  @IsString()
  @IsNotEmpty()
  agentId: string;

  /** Optional explicit ENS subname label (kebab); defaults from the agent's metadata name. */
  @IsString()
  @IsOptional()
  slug?: string;

  /** Optional agent endpoint URL (ENSIP-26 + ERC-8004 agentURI default). */
  @IsString()
  @IsOptional()
  endpoint?: string;

  /** Optional ERC-8004 registration metadata URI; defaults to endpoint. */
  @IsString()
  @IsOptional()
  agentURI?: string;

  /** Whether the agent accepts x402 USDC payments (written as an ENS record). */
  @IsBoolean()
  @IsOptional()
  x402?: boolean;
}
