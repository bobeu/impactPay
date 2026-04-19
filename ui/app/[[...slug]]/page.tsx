"use client";

import { useEffect, useState } from "react";
import { AppRouter } from "@/components/AppRouter";
import { TransactionModal } from "@/components/TransactionModal";
import { useImpactPay } from "@/contexts/ImpactPayContext";

export default function CatchAllPage() {
  const [mounted, setMounted] = useState(false);
  const { modal } = useImpactPay();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <AppRouter />
      
      {/* Global Overlays that persist across routes */}
      <TransactionModal 
          stage={modal.stage} 
          txHash={modal.txHash} 
          errorMessage={modal.error} 
      />
    </>
  );
}
