"use client";

import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connectAsync, isPending } = useConnect();
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMiniPay(Boolean(window.ethereum?.isMiniPay));
    }
  }, []);

  return (
    <Disclosure as="nav" className="bg-colors-primary border-b border-black">
      {({ open }) => (
        <>
          <div className="mx-auto w-full max-w-[450px] px-2 sm:px-3">
            <div className="relative flex h-14 justify-between items-center">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-black focus:outline-none focus:ring-1 focus:ring-inset focus:rounded-none focus:ring-black">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Image
                    className="block h-8 w-auto"
                    src="/logo.svg"
                    width={24}
                    height={24}
                    alt="ImpactPay"
                  />
                  <span className="hidden sm:inline text-sm font-semibold text-gray-900">
                    ImpactPay
                  </span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <a
                    href="#"
                    className="inline-flex items-center border-b-2 border-black px-1 pt-1 text-sm font-medium text-gray-900"
                  >
                    Home
                  </a>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                {isConnected && address ? (
                  <span
                    className="rounded-md bg-black/10 px-2 py-1 font-mono text-xs text-gray-900"
                    title={address}
                  >
                    {shortenAddress(address)}
                  </span>
                ) : !isMiniPay ? (
                  <button
                    type="button"
                    onClick={() => connectAsync({ connector: injected({ target: "metaMask" }) })}
                    className="h-10 px-3 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700"
                    disabled={isPending}
                  >
                    {isPending ? "Connecting..." : "Connect (Dev)"}
                  </button>
                ) : (
                  <span className="text-xs text-gray-800">Connecting…</span>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pt-2 pb-4 max-w-[450px] mx-auto">
              <Disclosure.Button
                as="a"
                href="#"
                className="block border-l-4 border-black py-2 pl-3 pr-4 text-base font-medium text-black"
              >
                Home
              </Disclosure.Button>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
