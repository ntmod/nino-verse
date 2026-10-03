import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/account-auth';
import { needsOnboarding } from '@/lib/onboarding';
import Onboarding from './Onboarding';

export default async function OnboardingPage() {
  const incoming = await headers();
  const session = await (await getAuth()).api.getSession({ headers: incoming });
  if (!session?.user.emailVerified) redirect('/login');
  if (!await needsOnboarding(session.user)) redirect('/dashboard');
  return <Onboarding name={session.user.name} />;
}
