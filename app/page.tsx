"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "@/components/ui/button";
import { CreateGoalCard } from "@/components/CreateGoalCard";
import { DevSubscriptionCard } from "@/components/DevSubscriptionCard";
import { Input } from "@/components/ui/input";
import { FeaturedGoalsCarousel } from "@/components/FeaturedGoalsCarousel";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import { IdentityVerificationCard } from "@/components/IdentityVerificationCard";
import { PhoneLookupCard } from "@/components/PhoneLookupCard";
import { SponsorDashboard } from "@/components/SponsorDashboard";
import { VirtualCardPortal } from "@/components/VirtualCardPortal";
import { useReputation } from "@/hooks/useReputation";
import { useWeb3 } from "@/contexts/useWeb3";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
    const {
        address,
        getUserAddress,
        sendCUSD,
        mintMinipayNFT,
        getNFTs,
        signTransaction,
    } = useWeb3();

    const [cUSDLoading, setCUSDLoading] = useState(false);
    const [nftLoading, setNFTLoading] = useState(false);
    const [signingLoading, setSigningLoading] = useState(false);
    const [userOwnedNFTs, setUserOwnedNFTs] = useState<string[]>([]);
    const [tx, setTx] = useState<any>(undefined);
    const [amountToSend, setAmountToSend] = useState<string>("0.1");
    const [messageSigned, setMessageSigned] = useState<boolean>(false); // State to track if a message was signed
    const { data: reputationData } = useReputation(address ?? undefined);


    useEffect(() => {
        getUserAddress();
    }, []);

    useEffect(() => {
        const getData = async () => {
            const tokenURIs = await getNFTs();
            setUserOwnedNFTs(tokenURIs);
        };
        if (address) {
            getData();
        }
    }, [address]);

    async function sendingCUSD() {
        if (address) {
            setSigningLoading(true);
            try {
                const tx = await sendCUSD(address, amountToSend);
                setTx(tx);
            } catch (error) {
                console.log(error);
            } finally {
                setSigningLoading(false);
            }
        }
    }

    async function signMessage() {
        setCUSDLoading(true);
        try {
            await signTransaction();
            setMessageSigned(true);
        } catch (error) {
            console.log(error);
        } finally {
            setCUSDLoading(false);
        }
    }


    async function mintNFT() {
        setNFTLoading(true);
        try {
            const tx = await mintMinipayNFT();
            const tokenURIs = await getNFTs();
            setUserOwnedNFTs(tokenURIs);
            setTx(tx);
        } catch (error) {
            console.log(error);
        } finally {
            setNFTLoading(false);
        }
    }



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
                            Your wallet connects automatically—there is no connect button.
                        </p>
                    </div>
                    <a
                        href="https://faucet.celo.org/alfajores"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm active:scale-[0.98]"
                    >
                        Get test tokens on Alfajores
                    </a>
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

                    <section className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-800">
                                Try a test transaction
                            </h2>
                            <span className="text-[11px] text-slate-500">
                                Address ending in{" "}
                                <span className="font-mono">
                                    {address.slice(0, 6)}…{address.slice(-4)}
                                </span>
                            </span>
                        </div>

                        {tx && (
                            <p className="text-xs font-medium text-emerald-700">
                                Tx completed:{" "}
                                <a
                                    href={`https://alfajores.celoscan.io/tx/${tx.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    {tx.transactionHash.substring(0, 6)}...
                                    {tx.transactionHash.substring(tx.transactionHash.length - 6)}
                                </a>
                            </p>
                        )}

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-slate-600">
                                    Send test cUSD to yourself
                                </label>
                                <Input
                                    type="number"
                                    value={amountToSend}
                                    onChange={(e) => setAmountToSend(e.target.value)}
                                    placeholder="Enter amount to send"
                                    className="border rounded-md px-3 py-2 w-full"
                                />
                                <Button
                                    loading={signingLoading}
                                    onClick={sendingCUSD}
                                    title={`Send ${amountToSend} cUSD`}
                                    widthFull
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-slate-600">
                                    Sign a message
                                </label>
                                <Button
                                    loading={cUSDLoading}
                                    onClick={signMessage}
                                    title="Sign a message"
                                    widthFull
                                />
                                {messageSigned && (
                                    <div className="text-xs font-medium text-emerald-700">
                                        Message signed successfully.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                        <h2 className="text-sm font-semibold text-slate-800 mb-2">
                            Demo NFTs
                        </h2>
                        {userOwnedNFTs.length > 0 ? (
                            <div className="flex flex-col items-center justify-center w-full mt-2">
                                <div className="w-full grid grid-cols-2 gap-3 px-2">
                                    {userOwnedNFTs.map((tokenURI, index) => (
                                        <div
                                            key={index}
                                            className="p-2 border border-slate-200 rounded-xl shadow-sm"
                                        >
                                            <Image
                                                alt="MINIPAY NFT"
                                                src={tokenURI}
                                                className="w-full h-[160px] object-cover rounded-md"
                                                width={160}
                                                height={160}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-600">
                                    You do not have any NFTs yet. Mint one to test the
                                    MiniPay flow.
                                </p>
                                <Button
                                    loading={nftLoading}
                                    onClick={mintNFT}
                                    title="Mint demo NFT"
                                    widthFull
                                />
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
