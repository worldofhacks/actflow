import { IsObject, IsOptional, IsString } from 'class-validator';

/**
 * POST /world/verify body.
 *
 * The IDKit result payload is forwarded to the World cloud verify endpoint AS-IS (no field
 * remapping — mutating it breaks proof verification). It can be one of several oneOf shapes
 * (v2 legacy: { proof, merkle_root, nullifier_hash, verification_level } | v4 uniqueness:
 * { protocol_version, nonce, responses: [...] } | v4 session), so we accept it as an opaque
 * object and validate server-side at the World API.
 *
 * Two accepted forms:
 *   1) the IDKit payload fields at the top level (e.g. v2 widget output), optionally with
 *      an `action` field; OR
 *   2) { payload: <idkit result>, action?: "free-trial" } when the client wraps it.
 */
export class VerifyWorldDto {
  /** Optional wrapper: the raw IDKit result. If absent, the whole body is the payload. */
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  /** Action id; defaults to WORLD_ACTION_ID server-side when omitted. */
  @IsOptional()
  @IsString()
  action?: string;

  // The validator is intentionally permissive: any other keys (proof, merkle_root,
  // nullifier_hash, verification_level, protocol_version, nonce, responses, ...) are
  // captured by the controller from the raw body and forwarded untouched.
}
