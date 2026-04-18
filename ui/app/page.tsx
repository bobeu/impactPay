"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import { CreateGoalCard } from "@/components/CreateGoalCard";
import { DevSubscriptionCard } from "@/components/DevSubscriptionCard";
import { FeaturedGoalsCarousel } from "@/components/FeaturedGoalsCarousel";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import { IdentityVerificationCard } from "@/components/IdentityVerificationCard";
import { PhoneLookupCard } from "@/components/PhoneLookupCard";
import { SponsorDashboard } from "@/components/SponsorDashboard";
import { VirtualCardPortal } from "@/components/VirtualCardPortal";
import { useReputation } from "@/hooks/useReputation";
import { useWeb3 } from "@/contexts/useWeb3";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { TransactionModal } from "@/components/TransactionModal";
import { useImpactPay } from "@/contexts/ImpactPayContext";

export default function Home() {
    const { getUserAddress } = useWeb3();
    const { modal } = useImpactPay();
    const { address, isConnected } = useAccount();
    const { data: reputationData } = useReputation(address ?? undefined);

    useEffect(() => {
        getUserAddress();
    }, []);

    return (
        <div className="flex flex-col gap-5">
            {(!isConnected && !address) && (
                <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3">
                    <div className="space-y-1">
                        <h1 className="text-base font-semibold text-slate-800">
                            Welcome to ImpactPay
                        </h1>
                        <p className="text-sm text-slate-600">
                            Open this app in MiniPay (or a browser with an injected wallet).
                            Wallet auto-connect runs in MiniPay. For desktop development, use the dev connect button in the top-right.
                        </p>
                    </div>
                </section>
            )}

            {(isConnected && address) && (
                <>
                    <ImpactDashboard
                        totalFundedUsd={reputationData.score * 10} // Approximation for UI
                        reputationScore={reputationData.score}
                        className="mb-8"
                    />
                    <div className="space-y-12 pb-24">
                        <section>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Explore Opportunities</h3>
                            <FeaturedGoalsCarousel />
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <IdentityVerificationCard address={address} />
                            <div className="space-y-6">
                                <PhoneLookupCard />
                                <CreateGoalCard />
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <VirtualCardPortal address={address} />
                            <SponsorDashboard />
                        </section>
                        
                        <DevSubscriptionCard />
                    </div>
                </>
            )}

            {/* Global Overlays */}
            <TransactionModal 
                stage={modal.stage} 
                txHash={modal.txHash} 
                errorMessage={modal.error} 
            />
        </div>
    );
}
