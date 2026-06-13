import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * World ID configuration, read from env via the existing @nestjs/config pattern.
 *
 * Env mapping (see /home/actlabs/actflow/.env and apps/api/.env.example):
 *   WORLD_RP_ID    - v4 verify path segment (preferred when set)
 *   WORLD_APP_ID   - IDKit widget app id; also v2 fallback verify path segment
 *   WORLD_ACTION_ID- the action id created in the Portal ("free-trial")
 *   WORLD_API_KEY  - server-only auth secret for the verify endpoint
 *
 * NOTHING here is hard-coded. Hosts are the documented World endpoints only.
 */
@Injectable()
export class WorldConfig {
  constructor(private readonly configService: ConfigService) {}

  /** Verify API host (documented primary host). Overridable for staging/testing. */
  get apiHost(): string {
    return this.configService.get<string>('WORLD_API_HOST') ?? 'https://developer.world.org';
  }

  /** v4 relying-party id. When set, the v4 verify endpoint is used. */
  get rpId(): string | undefined {
    const v = this.configService.get<string>('WORLD_RP_ID');
    return v && v.trim() ? v.trim() : undefined;
  }

  /** IDKit widget app id; doubles as the v2 fallback verify path segment. */
  get appId(): string | undefined {
    const v = this.configService.get<string>('WORLD_APP_ID');
    return v && v.trim() ? v.trim() : undefined;
  }

  /** Action id created in the Portal (default: free-trial). */
  get actionId(): string {
    return this.configService.get<string>('WORLD_ACTION_ID') ?? 'free-trial';
  }

  /** Server-only auth secret for the verify endpoint. */
  get apiKey(): string | undefined {
    const v = this.configService.get<string>('WORLD_API_KEY');
    return v && v.trim() ? v.trim() : undefined;
  }

  /** Free trials credited the first time a unique human (nullifier) is seen. */
  get freeTrialsPerHuman(): number {
    const raw = this.configService.get<string>('WORLD_FREE_TRIALS');
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 3;
  }
}
