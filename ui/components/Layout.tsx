import { FC, ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="bg-[var(--background)] overflow-x-hidden min-h-screen">
      {/* Desktop sidebar — visible lg+ */}
      <DesktopSidebar />

      {/* Header — full-width on mobile, offset on desktop */}
      <div className="lg:pl-72 xl:pl-80">
        <Header />

        {/* Main content */}
        <main className="
          pt-20 pb-24
          px-3 sm:px-4
          w-full min-w-[360px] max-w-[450px] mx-auto
          lg:max-w-none lg:mx-0 lg:pb-8 lg:px-8 xl:px-12
        ">
          {children}
        </main>

        {/* Footer — desktop only (mobile uses BottomNav) */}
        <div className="hidden lg:block">
          <Footer />
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
};

export default Layout;