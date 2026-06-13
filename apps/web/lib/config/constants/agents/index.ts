export const DELIVERY_TIME = [
  { label: 'One Day', value: 'ONE_DAY' },
  { label: 'Three Days', value: 'THREE_DAYS' },
  { label: 'One Week', value: 'ONE_WEEK' },
  { label: 'Two Weeks', value: 'TWO_WEEKS' },
  { label: 'One Month', value: 'ONE_MONTH' },
  { label: 'Custom', value: 'CUSTOM' },
];

export const SERVICE_TYPE = [
  { label: 'Basic', value: 'Basic' },
  { label: 'Standard', value: 'Standard' },
  { label: 'Premium', value: 'Premium' },
];

export const TOPIC_CATEGORIES = [
  { label: 'Content Creation', value: 'Content Creation' },
  { label: 'Market Research', value: 'Market Research' },
  { label: 'Social Media', value: 'Social Media' },
];

export enum BUDGET_TYPES {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  EXTREME = 'EXTREME',
}

export const BUDGET_RANGE = [
  { label: '$50 - $100', value: BUDGET_TYPES.LOW },
  { label: '$100 - $300', value: BUDGET_TYPES.MEDIUM },
  { label: '$300 - $500', value: BUDGET_TYPES.HIGH },
  { label: '$500 - $1000', value: BUDGET_TYPES.VERY_HIGH },
  { label: '$1000+', value: BUDGET_TYPES.EXTREME },
];
