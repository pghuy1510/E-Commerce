import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/layout/CookieConsent";

export default function MainLayout({ children }: any) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <CookieConsent />
    </>
  );
}
