import PrototypeHome from './PrototypeHome';

export default async function PreviewPage({ searchParams }: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  return <PrototypeHome variant={variant === 'B' || variant === 'C' || variant === 'D' || variant === 'E' ? variant : 'A'} />;
}
