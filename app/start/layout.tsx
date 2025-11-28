import { Metadata } from 'next';

// Force dynamic rendering to prevent SSG issues with Supabase
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Get Feedback - Submit Your Request",
  description: "Submit your question or decision and get honest feedback from 10 real people in just minutes. Career advice, relationship guidance, appearance feedback, and more.",
  openGraph: {
    title: "Get Feedback - Submit Your Request | AskVerdict",
    description: "Submit your question or decision and get honest feedback from 10 real people in just minutes.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Feedback - Submit Your Request | AskVerdict",
    description: "Submit your question or decision and get honest feedback from 10 real people in just minutes.",
  },
};

export default function StartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
