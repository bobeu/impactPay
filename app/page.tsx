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

export default function Home() {
    const {
        address,
        getUserAddress,
    } = useWeb3();
    const { data: reputationData } = useReputation(address ?? undefined);


    useEffect(() => {
        getUserAddress();
    }, []);

    return (
        <div className="flex flex-col gap-5">
            {!address && (
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

            {address && (
                <>
                    <ImpactDashboard
                        totalFundedUsd={reputationData.totalFundedUsd}
                        reputationScore={reputationData.donorReputation}
                    />
                    <FeaturedGoalsCarousel />
                    <IdentityVerificationCard address={address} />
                    <PhoneLookupCard />
                    <CreateGoalCard />
                    <DevSubscriptionCard />
                    <VirtualCardPortal address={address} />
                    <SponsorDashboard />
                </>
            )}
        </div>
    );
}
