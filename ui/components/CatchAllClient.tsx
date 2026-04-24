"use client";

import { useEffect, useState } from "react";
import { AppRouter } from "@/components/AppRouter";
import { TransactionModal } from "@/components/TransactionModal";
import { useImpactPay } from "@/contexts/ImpactPayContext";

export default function CatchAllClient() {
  const [mounted, setMounted] = useState(false);
  const { modal } = useImpactPay();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AppRouter />
      
      {/* Global Overlays that persist across routes */}
      <TransactionModal 
          stage={modal.stage} 
          txHash={modal.txHash} 
          errorMessage={modal.error} 
          fee={modal.fee}
          onClose={() => modal.setStage('idle')}
      />
    </>
  );
}
