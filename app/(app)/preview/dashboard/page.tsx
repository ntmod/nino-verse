import PrototypeDashboard from './PrototypeDashboard';

export default async function DashboardPreviewPage({ searchParams }: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  return <PrototypeDashboard variant={variant === 'B' || variant === 'C' ? variant : 'A'} />;
}
