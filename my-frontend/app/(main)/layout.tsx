import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/layout/CookieConsent";
import PendingPaymentAlert from "@/components/checkout/PendingPaymentAlert";

export default function MainLayout({ children }: any) {
  return (
    <>
      <Header />
      {children}
      <PendingPaymentAlert />
      <Footer />
      <CookieConsent />
    </>
  );
}
