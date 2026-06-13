export const formatReward = (reward: string) => {
  if (!reward) return '0';
  const ethValue = parseFloat(reward) / 10 ** 18;
  return ethValue.toFixed(2);
};
