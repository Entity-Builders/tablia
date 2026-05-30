import type { CustomerMemorySummary } from '../types';

export interface CustomerMemoryMessage {
  title: string;
  body: string;
  meta?: string;
}

export function getCustomerMemoryMessage(
  summary: CustomerMemorySummary | null | undefined,
): CustomerMemoryMessage | null {
  if (!summary) return null;

  if (summary.reward) {
    return {
      title: 'Beneficio listo',
      body: summary.reward.rewardLabel,
      meta: 'Mostralo en el local cuando pidas.',
    };
  }

  if (summary.campaign) {
    return {
      title: summary.campaign.title,
      body: summary.campaign.body,
      meta: summary.campaign.ctaLabel,
    };
  }

  if (summary.loyalty && summary.visitCount > 1) {
    return {
      title: `Volviste: ${summary.loyalty.visitCount}/${summary.loyalty.visitsRequired} visitas`,
      body:
        summary.loyalty.visitsUntilReward > 0
          ? `Te faltan ${summary.loyalty.visitsUntilReward} para desbloquear ${summary.loyalty.rewardLabel}.`
          : `Ya podés desbloquear ${summary.loyalty.rewardLabel}.`,
      meta: summary.loyalty.name,
    };
  }

  return null;
}
