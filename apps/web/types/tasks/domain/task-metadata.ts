export interface ServiceAddOn {
  name: string;
  price: string;
}

export interface TaskMetadata {
  serviceName: string;
  prompt: string;
  deliveryTime: string;
  features: string[];
  customFeatures?: string[];
  pricingModel: string;
  basePrice: string;
  addOns: ServiceAddOn[];
  listingType: string;
  externalMetadataUri?: string;
  isPlatformManaged: boolean;
  isValid: boolean;
}
