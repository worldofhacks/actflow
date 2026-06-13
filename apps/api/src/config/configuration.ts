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
  };
});
