import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MainLayout({ children }: any) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
