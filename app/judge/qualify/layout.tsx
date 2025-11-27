import { Metadata } from 'next';
import { VERDICT_TIER_PRICING } from '@/lib/validations';

const JUDGE_PAYOUT_VALUES = Object.values(VERDICT_TIER_PRICING).map((t) => t.judgePayout);
const MIN_JUDGE_PAYOUT = Math.min(...JUDGE_PAYOUT_VALUES);
const MAX_JUDGE_PAYOUT = Math.max(...JUDGE_PAYOUT_VALUES);
const RANGE_TEXT = `$${MIN_JUDGE_PAYOUT.toFixed(2)}-${MAX_JUDGE_PAYOUT.toFixed(2)}`;

export const metadata: Metadata = {
  title: "Become a Judge - Earn Money Sharing Your Opinion",
  description: `Use your life experience to help others and earn ${RANGE_TEXT} per response. Flexible, remote work sharing honest advice on real-life decisions.`,
  keywords: ["earn money online", "remote work", "side hustle", "share opinions", "get paid for advice", "flexible work"],
  openGraph: {
    title: "Become a Judge - Earn Money Sharing Your Opinion | Verdict",
    description: `Use your life experience to help others and earn ${RANGE_TEXT} per response. Flexible, remote work sharing honest advice.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Become a Judge - Earn Money Sharing Your Opinion | Verdict",
    description: `Use your life experience to help others and earn ${RANGE_TEXT} per response.`,
  },
};

export default function QualifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
