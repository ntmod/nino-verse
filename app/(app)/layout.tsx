
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/account-auth";
import { needsOnboarding } from "@/lib/onboarding";
import NoriNavBar from "@/components/NoriNavBar";
export default async function NoriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const incoming = await headers();
  const session = await (await getAuth()).api.getSession({ headers: incoming });
  if (!session?.user.emailVerified) redirect("/login");
  if (await needsOnboarding(session.user)) redirect("/onboarding");

  return (
    <div className="relative min-h-screen">
      <NoriNavBar />
      <div className="pt-16 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
