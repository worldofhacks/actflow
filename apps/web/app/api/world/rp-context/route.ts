import { NextResponse } from 'next/server';
import { signRequest } from '@worldcoin/idkit/signing';

/**
 * Server-side generation of the World ID 4.0 RP context (signed proof request).
 *
 * The IDKit v4 `IDKitRequestWidget` requires an `rp_context` that is signed with
 * the Relying Party's signing key. That key (`WORLD_SIGNER_KEY`) is a server-only
 * secret and MUST NOT reach the browser, so the signature is produced here and
 * only the resulting `RpContext` (public, single-use, short-lived) is returned to
 * the client.
 *
 * The action is bound into the signed message for uniqueness proofs, so it must
 * match the action passed to the widget / used by the backend verify endpoint.
 *
 * NOTE: proof VERIFICATION is never done here — it happens in apps/api
 * (`POST /world/verify`). This route only signs the outbound request.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const signingKeyHex = process.env.WORLD_SIGNER_KEY;
  const rpId = process.env.WORLD_RP_ID;
  // The action the proof is bound to. Public mirror is used by the widget; the
  // server secret env (WORLD_ACTION_ID) is the source of truth, falling back to
  // the public mirror so a single value can configure both.
  const action =
    process.env.WORLD_ACTION_ID ?? process.env.NEXT_PUBLIC_WORLD_ACTION_ID ?? 'free-trial';

  if (!signingKeyHex || !rpId) {
    return NextResponse.json(
      {
        message: 'World ID is not configured on this server.',
        code: 'world_not_configured',
      },
      { status: 503 },
    );
  }

  try {
    // signRequest -> { sig, nonce, createdAt, expiresAt }. Map onto RpContext.
    const signed = signRequest({ signingKeyHex, action });

    return NextResponse.json(
      {
        rp_id: rpId,
        nonce: signed.nonce,
        created_at: signed.createdAt,
        expires_at: signed.expiresAt,
        signature: signed.sig,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('[world/rp-context] failed to sign request', err);
    return NextResponse.json(
      { message: 'Could not initialize World ID verification.', code: 'sign_failed' },
      { status: 500 },
    );
  }
}
