import { FC, ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { BottomNav } from "./BottomNav";

interface Props {
  children: ReactNode;
}
const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="bg-gypsum overflow-hidden flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full min-w-[360px] max-w-[450px] min-h-[720px] mx-auto px-3 py-6 space-y-6 sm:px-4">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Layout;

    // <div className="py-16 max-w-7xl mx-auto space-y-8 sm:px-6 lg:px-8">