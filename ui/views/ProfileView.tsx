"use client";

import React from 'react';
import { useParams } from 'react-router-dom';
import ProfileClientView from '@/components/ProfileClientView';

export default function ProfileView() {
  const { address } = useParams<{ address: string }>();
  
  if (!address) return <div>No address provided</div>;
  
  const ogImageUrl = `/api/og/${address.toLowerCase()}`;
  
  return (
    <ProfileClientView address={address.toLowerCase()} ogImageUrl={ogImageUrl} />
  );
}
