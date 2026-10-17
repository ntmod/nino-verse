
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/account-auth";
import { needsOnboarding } from "@/lib/onboarding";
import NoriNavBar from "@/components/NoriNavBar";
import { Chakra_Petch } from "next/font/google";

const chakraPetch = Chakra_Petch({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
});

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
    <div className={`relative min-h-screen ${chakraPetch.className}`}>
      <NoriNavBar />
      <div className="pt-16 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
    </div>
  );
}
