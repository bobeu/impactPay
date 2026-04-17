import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';

type Props = {
  params: Promise<{ address: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address: paramAddress } = await params;
  const address = paramAddress.toLowerCase();
  
  // URL pointing to our dynamic OG image generator route
  const ogImageUrl = `/api/og/${address}`;

  return {
    title: `ImpactPay Profile - ${address}`,
    description: 'View my verifiable impact and reputation on ImpactPay Celo.',
    openGraph: {
      type: 'profile',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `ImpactPay Trust Profile for ${address}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `ImpactPay Profile - ${address}`,
      description: 'View my verifiable impact and reputation on ImpactPay Celo.',
      images: [ogImageUrl],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { address: paramAddress } = await params;
  const address = paramAddress.toLowerCase();

  // URL pointing to our dynamic OG image for UI rendering
  const ogImageUrl = `/api/og/${address}`;
  
  // This will be absolute on production, but for edge runtime sharing:
  const canonicalUrl = `https://impactpay.example.com/profile/${address}`;
  const shareText = encodeURIComponent(`Check out my verified impact on ImpactPay! 🌍💚\n${canonicalUrl}`);
  const xShareLink = `https://twitter.com/intent/tweet?text=${shareText}`;
  const verifyLink = `/verify/${address}`; // Assuming handle if linked, mapping address directly

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-xl w-full bg-white shadow-sm border border-slate-200 rounded-xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">My Profile</h1>
        <p className="text-slate-500 mb-8 break-all font-mono text-sm">{address}</p>

        <div className="mb-8 border border-slate-200 rounded-lg overflow-hidden relative shadow-sm">
          <img src={ogImageUrl} alt="Social Card" className="w-full h-auto object-cover" />
        </div>

        <div className="flex flex-col gap-4">
          <a
            href={xShareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#1DA1F2] text-white font-bold py-3 px-4 rounded-lg text-center hover:bg-[#1A91DA] transition"
          >
            Share to X
          </a>
          
          <Link href={verifyLink} className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-lg text-center hover:border-slate-300 transition">
            View Public Trust Report
          </Link>
        </div>
      </div>
      
      {/* SocialConnect Info Block */}
      <div className="max-w-xl w-full bg-white shadow-sm border border-[#35D07F] p-6 rounded-xl flex gap-4 mt-8 items-start">
        <div className="bg-[#35D07F] text-white p-3 rounded-full shrink-0 flex items-center justify-center font-bold">
          !
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Make your reputation portable</h3>
          <p className="text-sm text-slate-600 mb-4">
            Link your X or Instagram handle via SocialConnect to display your reputation across Web3 dApps.
          </p>
          <button className="bg-slate-800 text-white font-bold text-sm py-2 px-4 rounded hover:bg-slate-700 transition">
            Link with SocialConnect
          </button>
        </div>
      </div>
    </div>
  );
}
