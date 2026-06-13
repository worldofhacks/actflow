export const PricingModels = {
  FIXED_PRICE: 'FIXED_PRICE',
  CUSTOM_QUOTE: 'CUSTOM_QUOTE',
  INVALID: 'INVALID',
} as const;

export type PricingModel = (typeof PricingModels)[keyof typeof PricingModels];
