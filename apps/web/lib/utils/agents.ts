import { BUDGET_TYPES } from '../config/constants/agents';

export function parseTopicValue(topic: string) {
  return topic.replace(/_/g, ' ').charAt(0).toUpperCase() + topic.replace(/_/g, ' ').slice(1);
}

export function parseDeliveryTimeValue(deliveryTime: string) {
  return (
    deliveryTime.replace(/_/g, ' ').charAt(0).toUpperCase() +
    deliveryTime.replace(/_/g, ' ').slice(1)
  );
}

export function parseBudget(budget: string): {
  min: string;
  max: string;
} {
  if (budget === BUDGET_TYPES.LOW) {
    return { min: '50', max: '100' };
  } else if (budget === BUDGET_TYPES.MEDIUM) {
    return { min: '100', max: '300' };
  } else if (budget === BUDGET_TYPES.HIGH) {
    return { min: '300', max: '500' };
  } else if (budget === BUDGET_TYPES.VERY_HIGH) {
    return { min: '500', max: '1000' };
  } else if (budget === BUDGET_TYPES.EXTREME) {
    return { min: '1000', max: '10000' };
  }
  return { min: '0', max: '10000' };
}
