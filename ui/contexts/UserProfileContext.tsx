"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type VerificationLevel = 0 | 1 | 2 | 3;
export type GoalCategory = "Bill" | "Scholarship";

export type UserProfileState = {
  phoneNumber?: string;
  phoneVerified: boolean;
  xHandle?: string;
  instagramHandle?: string;
  socialsLinked: boolean;
  humanVerified: boolean;
  verificationLevel: VerificationLevel;
};

type UserProfileContextType = {
  profile: UserProfileState;
  setPhoneVerified: (phoneNumber: string) => void;
  setSocialsLinked: (xHandle: string, instagramHandle: string) => void;
  setHumanVerified: () => void;
  canCreateScholarship: boolean;
};

const UserProfileContext = createContext<UserProfileContextType | null>(null);

const INITIAL_STATE: UserProfileState = {
  phoneNumber: undefined,
  phoneVerified: false,
  xHandle: undefined,
  instagramHandle: undefined,
  socialsLinked: false,
  humanVerified: false,
  verificationLevel: 0,
};

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfileState>(INITIAL_STATE);

  const setPhoneVerified = (phoneNumber: string) => {
    setProfile((prev) => ({
      ...prev,
      phoneNumber,
      phoneVerified: true,
      verificationLevel: Math.max(prev.verificationLevel, 1) as VerificationLevel,
    }));
  };

  const setSocialsLinked = (xHandle: string, instagramHandle: string) => {
    setProfile((prev) => ({
      ...prev,
      xHandle,
      instagramHandle,
      socialsLinked: true,
      verificationLevel: Math.max(prev.verificationLevel, 2) as VerificationLevel,
    }));
  };

  const setHumanVerified = () => {
    setProfile((prev) => ({
      ...prev,
      humanVerified: true,
      verificationLevel: 3,
    }));
  };

  const value = useMemo<UserProfileContextType>(
    () => ({
      profile,
      setPhoneVerified,
      setSocialsLinked,
      setHumanVerified,
      canCreateScholarship: profile.verificationLevel >= 3,
    }),
    [profile],
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}

