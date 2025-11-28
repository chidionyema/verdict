// Force dynamic rendering to prevent SSG issues with Supabase
export const dynamic = 'force-dynamic';

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}