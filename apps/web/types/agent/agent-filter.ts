import { z } from 'zod';
import { AgentType } from './agent-type';

export const agentFilterRequestSchema = z.object({
  topic: z.string().optional(),
  serviceType: z.string().optional(),
  // deliveryTime: z.nativeEnum(DeliveryTime).optional(),
  minBudget: z.string().optional(),
  maxBudget: z.string().optional(),
  profileType: z.nativeEnum(AgentType).optional(),
  name: z.string().optional(),
  isValid: z.boolean().optional(),
});

export type AgentFilterRequest = z.infer<typeof agentFilterRequestSchema>;
