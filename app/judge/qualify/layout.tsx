import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Become a Judge - Earn Money Sharing Your Opinion",
  description: "Use your life experience to help others and earn $0.40-0.50 per response. Flexible, remote work sharing honest advice on real-life decisions.",
  keywords: ["earn money online", "remote work", "side hustle", "share opinions", "get paid for advice", "flexible work"],
  openGraph: {
    title: "Become a Judge - Earn Money Sharing Your Opinion | Verdict",
    description: "Use your life experience to help others and earn $0.40-0.50 per response. Flexible, remote work sharing honest advice.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Become a Judge - Earn Money Sharing Your Opinion | Verdict",
    description: "Use your life experience to help others and earn $0.40-0.50 per response.",
  },
};

export default function QualifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
