import React from 'react';
import { Metadata } from 'next';
import ProfileClientView from '@/components/ProfileClientView';
import { getEllipsisTxt } from '@/components/AddressFormatter/stringFormatter';

export const runtime = 'edge';

type Props = {
  params: Promise<{ address: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address: paramAddress } = await params;
  const address = paramAddress.toLowerCase();
  
  const ogImageUrl = `/api/og/${address}`;

  return {
    title: `ImpactPay Profile - ${getEllipsisTxt(address, 6)}`,
    description: 'View my verifiable impact and reputation on ImpactPay Celo.',
    openGraph: {
      type: 'profile',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `ImpactPay Trust Profile for ${getEllipsisTxt(address, 6)}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `ImpactPay Profile - ${getEllipsisTxt(address, 6)}`,
      description: 'View my verifiable impact and reputation on ImpactPay Celo.',
      images: [ogImageUrl],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { address: paramAddress } = await params;
  const address = paramAddress.toLowerCase();
  const ogImageUrl = `/api/og/${address}`;
  
  return (
    <ProfileClientView address={address} ogImageUrl={ogImageUrl} />
  );
}
