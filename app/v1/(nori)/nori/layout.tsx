import BackComponent from "@/components/BackComponent";
import NoriNavBar from "@/components/NoriNavBar";
import { Chakra_Petch } from "next/font/google";

const chakraPetch = Chakra_Petch({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
});

export default function NoriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`relative ${chakraPetch.className}`}>
      <NoriNavBar />
      <BackComponent />
      {children}
    </div>
  );
}
