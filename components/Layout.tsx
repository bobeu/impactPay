import { FC, ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";

interface Props {
  children: ReactNode;
}
const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="bg-gypsum overflow-hidden flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-[450px] mx-auto px-3 py-8 space-y-6 sm:px-4">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
