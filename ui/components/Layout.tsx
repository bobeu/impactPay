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

      {/* Content area — offset by sidebar on desktop */}
      <div className="lg:pl-72 xl:pl-80">
        <Header />

        {/* Main content
            Mobile:  narrow centered column (max 450px)
            Desktop: full-width of the area right of sidebar, max 1100px centered within that area, comfortable horizontal padding
        */}
        <main className="
          pt-20 md:pt-4 pb-24
          px-3 sm:px-4
          w-full min-w-[360px] max-w-[450px] mx-auto
          lg:max-w-5xl lg:mx-auto lg:pb-10 lg:px-10
          xl:max-w-6xl xl:px-14
        ">
          {children}
        </main>

        {/* Footer — desktop only */}
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