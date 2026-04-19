// components/utilities/AddressFormatter/Blockie.tsx

import BlockieSVG from "blockies-react-svg";
import { zeroAddress } from "viem";

interface BlockieProp {
  account: string;
  size?: number;
}

export const Blockie = (props: BlockieProp) => {
  const { account, size } = props;
  return (
    <span title={account}>
      <BlockieSVG
        address={account?.toLowerCase() || zeroAddress}
        size={size || 4}
        scale={3}
        className='classname'
        style={{ borderRadius: '50%' }}
      />
    </span>
  );
}
