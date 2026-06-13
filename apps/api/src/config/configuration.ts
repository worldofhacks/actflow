import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

// NOTE: despite the old "NOT USED" comment, this schema IS wired into
// ConfigModule.forRoot({ validationSchema }) in app.module.ts and DOES run at boot.
// The chain variables below are required even for DB-only work, so .env.example ships
// stub values (a local Hardhat node + zero-addresses are enough to boot).
export const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('production', 'test', 'local', 'development').default(''),
  // Monorepo port table: api = 3401 (API_PORT preferred, PORT kept for back-compat).
  API_PORT: Joi.number().default(3401),
  PORT: Joi.number().default(3401),
  MONGO_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('1d'),
  NETWORK_RPC_URL: Joi.string().required(),
  CHAIN_ID: Joi.string().required(),
  // Optional: only needed if explicit admin (contract-owner) operations are used.
  CONTRACT_OWNER_KEY: Joi.string().optional().allow(''),
  ACT_MARKET_ADDRESS: Joi.string().required(),
  REVENUE_TOKEN_ADDRESS: Joi.string().required(),
  WALLET_ENCRYPTION_KEY: Joi.string().required(),
  // --- World ID (proof-of-human free-trial gating; all OPTIONAL so DB-only boot works) ---
  // Verification is server-side: prefer v4 (WORLD_RP_ID), fall back to v2 (WORLD_APP_ID).
  WORLD_RP_ID: Joi.string().optional().allow(''),
  WORLD_APP_ID: Joi.string().optional().allow(''),
  WORLD_ACTION_ID: Joi.string().optional().allow('').default('free-trial'),
  WORLD_API_KEY: Joi.string().optional().allow(''),
  WORLD_SIGNER_KEY: Joi.string().optional().allow(''),
  WORLD_API_HOST: Joi.string().optional().allow(''),
  WORLD_FREE_TRIALS: Joi.number().optional(),
  // --- x402 / Arc USDC payments (all OPTIONAL; chain/USDC config comes from @actflow/sdk) ---
  // No funds/creds in this environment -> the x402 layer settles via its labeled MOCK path.
  PAYMENTS_ESCROW_ADDRESS: Joi.string().optional().allow(''),
  PAYMENTS_DEFAULT_PRICE: Joi.string().optional().allow(''),
  PAYMENTS_CHALLENGE_TTL: Joi.number().optional(),
  X402_FORCE_MOCK: Joi.string().optional().allow(''),
  ARC_TESTNET_RPC_URL: Joi.string().optional().allow(''),
  ARC_CHAIN_ID: Joi.string().optional().allow(''),
  ARC_USDC_ADDRESS: Joi.string().optional().allow(''),
}).unknown(true);

export default registerAs('app', () => {
  return {
    environment: process.env.NODE_ENV,
    port: parseInt(process.env.API_PORT ?? process.env.PORT, 10) || 3401,
    database: {
      uri: process.env.MONGO_URI,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRATION || '1d',
    },
    blockchain: {
      networkRpcUrl: process.env.NETWORK_RPC_URL,
      chainId: process.env.CHAIN_ID,
      contractOwnerKey: process.env.CONTRACT_OWNER_KEY,
      actMarketAddress: process.env.ACT_MARKET_ADDRESS,
      revenueTokenAddress: process.env.REVENUE_TOKEN_ADDRESS,
    },
    world: {
      rpId: process.env.WORLD_RP_ID,
      appId: process.env.WORLD_APP_ID,
      actionId: process.env.WORLD_ACTION_ID || 'free-trial',
      apiKey: process.env.WORLD_API_KEY,
      signerKey: process.env.WORLD_SIGNER_KEY,
      apiHost: process.env.WORLD_API_HOST,
    },
    payments: {
      // Chain id / USDC address / explorer all come from @actflow/sdk at runtime.
      escrowAddress: process.env.PAYMENTS_ESCROW_ADDRESS,
      defaultPrice: process.env.PAYMENTS_DEFAULT_PRICE,
      challengeTtl: process.env.PAYMENTS_CHALLENGE_TTL,
      forceMock: process.env.X402_FORCE_MOCK,
    },
  };
});
