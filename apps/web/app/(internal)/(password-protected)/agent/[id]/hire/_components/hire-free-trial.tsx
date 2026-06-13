'use client';

import { WorldIdVerify } from '@/components/world/world-id-verify';
import { isWorldConfigured } from '@/lib/world/config';

/**
 * Client island for the hire flow's free-trial CTA.
 *
 * Renders the World ID verify widget. On verification it shows the trial counter;
 * when trials are exhausted the widget itself surfaces a "Continue with paid task"
 * handoff back to the existing paid flow (the task form on this page is the pay
 * path). The hiring user's wallet address is read from wagmi inside WorldIdVerify
 * and bound into the proof as the signal.
 */
export function HireFreeTrial() {
  // Hide the whole island when World ID isn't configured so the hire flow still
  // works (paid path only) without a broken/empty card.
  if (!isWorldConfigured()) return null;

  return (
    <WorldIdVerify
      onExhausted={() => {
        // Scroll the user to the task form (the paid path) when trials run out.
        document
          .getElementById('hire-task-form')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}
    />
  );
}
