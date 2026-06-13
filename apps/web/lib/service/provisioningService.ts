'use server';

/**
 * Server action for agent identity provisioning.
 *
 * Wraps `POST /agents/provision` (apps/api). After the wizard creates an agent
 * we call this to provision its ENS + ERC-8004 identity. The API owns ALL of the
 * provisioning logic (ENS subname mint, ERC-8004 register, optional on-chain
 * AgentIdentityExtension binding) and is FULLY dry-run/mock-safe with no
 * funds/creds: it returns a labeled identity PREVIEW (identityStatus:'dry-run')
 * and sends no on-chain tx unless an admin signer + extension contract are
 * configured server-side.
 *
 * RULES: this client embeds NO registry addresses / chain ids — it forwards the
 * agent identifier and surfaces whatever identity the API returns (registry
 * address + chain id included), which the API resolves from @actflow/agents'
 * cited registry map (erc8004-bigquery skill). ZERO hard-coded secrets.
 */

import { GeneralApiResponse, createErrorResponse } from '../../types/api-response';
import { ProvisionAgentRequest, ProvisionResult } from '../../types/provisioning';
import { fetchWithAuth } from './index';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const PROVISION_ENDPOINT = `${API_BASE}/agents/provision`;

/**
 * Provision (or dry-run preview) an agent's ENS + ERC-8004 identity.
 *
 * Returns a GeneralApiResponse. NOTE: the API returns the bare ProvisionResultView
 * (not wrapped in { success, data }), so we adapt the raw shape into the app's
 * GeneralApiResponse envelope here. Never throws — callers can render explicit
 * loading / error states from the returned envelope.
 */
export async function provisionAgentIdentity(
  request: ProvisionAgentRequest,
): Promise<GeneralApiResponse<ProvisionResult>> {
  if (!API_BASE) {
    return createErrorResponse('NEXT_PUBLIC_API_URL is not configured', 500);
  }
  if (!request.agentId?.trim()) {
    return createErrorResponse('agentId (wallet 0x... or mongo id) is required', 400);
  }

  try {
    // The API returns the raw ProvisionResultView. fetchWithAuth parses JSON and
    // types it as GeneralApiResponse<T>; we detect whether the body is already an
    // envelope (has `success`) or the bare result and normalize accordingly.
    const raw = (await fetchWithAuth<ProvisionResult>(PROVISION_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(request),
    })) as GeneralApiResponse<ProvisionResult> & Partial<ProvisionResult>;

    // Already a GeneralApiResponse envelope (e.g. an error from the gateway).
    if (typeof raw?.success === 'boolean') {
      return raw;
    }

    // Bare ProvisionResultView -> wrap as success when it has the identity fields.
    if (raw && typeof raw.agentAddress === 'string' && typeof raw.ensName === 'string') {
      return {
        success: true,
        message: 'Agent identity provisioned',
        data: raw as unknown as ProvisionResult,
        statusCode: 200,
      };
    }

    // Nest-style error body ({ message, statusCode }) without a `success` flag.
    const message =
      (raw as { message?: string })?.message || 'Provisioning failed (unexpected response)';
    const statusCode = (raw as { statusCode?: number })?.statusCode ?? 502;
    return createErrorResponse(message, statusCode);
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to provision agent identity',
      502,
    );
  }
}
