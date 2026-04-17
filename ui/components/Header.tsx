"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Menu, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hideConnectBtn, setHideConnectBtn] = useState(false);

  useEffect(() => {
    if (window.ethereum && window.ethereum.isMiniPay) {
      setHideConnectBtn(true);
      connect({ connector: injected({ target: "metaMask" }) });
    }
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-primary p-1.5 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-accent" />
        </div>
        <span className="text-xl font-bold tracking-tight text-primary">
          ImpactPay
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isConnected && address && hideConnectBtn ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-primary">
              {shortenAddress(address)}
            </span>
          </div>
        ) : (
          !hideConnectBtn && <ConnectButton 
            showBalance={{
              smallScreen: true,
              largeScreen: true,
            }}
            chainStatus={{
              smallScreen: 'icon',
              largeScreen: 'full',
            }}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
          // <button
          //   onClick={async() => await connectAsync({ connector: injected() })}
          //   className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-opacity-90 transition-all"
          //   disabled={isPending}
          // >
          //   <Wallet className="w-3.5 h-3.5" />
          //   {isPending ? "..." : "Connect"}
          // </button>
        )}
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 bg-white border-b border-slate-100 p-4 flex flex-col gap-2 shadow-xl"
          >
            <a href="/" className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Impact Dashboard</a>
            <a href="/leaderboard" className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Global Leaderboard</a>
            <a href="/docs" className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Public API Docs</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}























// import { Disclosure } from "@headlessui/react";
// import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
// import Image from "next/image";
// import { useEffect, useState } from "react";
// import { useConnect } from "wagmi";
// import { injected } from "wagmi/connectors";

// export default function Header() {
//   const [hideConnectBtn, setHideConnectBtn] = useState(false);
//   const { connect } = useConnect();

//   useEffect(() => {
//     if (window.ethereum && window.ethereum.isMiniPay) {
//       setHideConnectBtn(true);
//       connect({ connector: injected({ target: "metaMask" }) });
//     }
//   }, []);

//   return (
//     <Disclosure as="nav" className="bg-colors-primary border-b border-black">
//       {({ open }) => (
//         <>
//           <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
//             <div className="relative flex h-16 justify-between">
//               <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
//                 {/* Mobile menu button */}
//                 <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-black focus:outline-none focus:ring-1 focus:ring-inset focus:rounded-none focus:ring-black">
//                   <span className="sr-only">Open main menu</span>
//                   {open ? (
//                     <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
//                   ) : (
//                     <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
//                   )}
//                 </Disclosure.Button>
//               </div>
//               <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
//                 <div className="flex flex-shrink-0 items-center">
//                   <Image
//                     className="block h-8 w-auto sm:block lg:block"
//                     src="/logo.svg"
//                     width="24"
//                     height="24"
//                     alt="Celo Logo"
//                   />
//                 </div>
//                 <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
//                   <a
//                     href="#"
//                     className="inline-flex items-center border-b-2 border-black px-1 pt-1 text-sm font-medium text-gray-900"
//                   >
//                     Home
//                   </a>
//                 </div>
//               </div>
//               <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
//                 {!hideConnectBtn && (
//                   <ConnectButton
//                     showBalance={{
//                       smallScreen: true,
//                       largeScreen: false,
//                     }}
//                   />
//                 )}
//               </div>
//             </div>
//           </div>

//           <Disclosure.Panel className="sm:hidden">
//             <div className="space-y-1 pt-2 pb-4">
//               <Disclosure.Button
//                 as="a"
//                 href="#"
//                 className="block border-l-4 border-black py-2 pl-3 pr-4 text-base font-medium text-black"
//               >
//                 Home
//               </Disclosure.Button>
//               {/* Add here your custom menu elements */}
//             </div>
//           </Disclosure.Panel>
//         </>
//       )}
//     </Disclosure>
//   );
// }