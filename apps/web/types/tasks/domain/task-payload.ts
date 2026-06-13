import { PricingModel } from '../../PricingModels';

export interface TaskPayload {
  serviceName: string;
  prompt: string;
  pricingModel: PricingModel;

  // //TODO: All of the
  // deliveryTime: DeliveryTime;
  // features: string[];
  // customFeatures?: string[];
  // pricingModel: PricingModel;
  // basePrice: string;
  // skills: Skill[]; //
  // addOns: ServiceAddOn[];
  // listingType: ListingType;
}
