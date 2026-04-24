// components/utilities/AddressFormatter/AddressWrapper.tsx

"use client"

import { useState } from "react";
import { getEllipsisTxt } from "./stringFormatter";
import { Blockie } from "./Blockie";
import { zeroAddress } from "viem";

const wrapToText = (arg: string | undefined) => String(arg);

const AddressWrapper = (props: AddressProps ) => {
  const [isClicked, setIsClicked] = useState(false);
  const { account, display, size, copyIconSize, overrideClassName } = props;

  const Copy = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`w-${copyIconSize || 6} h-${copyIconSize || 6} cursor-pointer text-cyan-700`}
      viewBox="0 0 24 24"
      strokeWidth="3"
      stroke="orange"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      onClick={() => {
        navigator.clipboard.writeText(wrapToText(account));
        setIsClicked(true);
        setTimeout(() => { setIsClicked(false)}, 6000);
      }}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M15 3v4a1 1 0 0 0 1 1h4" />
      <path d="M18 17h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h4l5 5v7a2 2 0 0 1 -2 2z" />
      <path d="M16 17v2a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h2" />
      <title id="copy-address">Copy Address</title>
    </svg>
  );

  return (
    <div className={`flex justify-center items-center gap-1 ${overrideClassName}`}>
      <span ><Blockie account={wrapToText(account || zeroAddress)} size={size} /></span> 
      <a href={`https://testnet.bscscan.com/address/${account}`} rel="noreferrer" target="_blank">{size ? getEllipsisTxt(wrapToText(account || zeroAddress), size) : account || zeroAddress}</a>
      <span className="" >{(isClicked ? display && <Check /> : display && <Copy />)}</span>
    </div>
  );
}

export default AddressWrapper;

const Check = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    strokeWidth="3"
    stroke="#21BF96"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    // className="text-white"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 12l5 5l10 -10" />
    <title id="copied-address">Copied!</title>
  </svg>
);

interface AddressProps {
  account?: string;
  display: boolean;
  size?: number;
  copyIconSize?: string;
  overrideClassName?: string;
}