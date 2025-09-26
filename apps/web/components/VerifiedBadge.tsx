"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import {
  VerificationStatus,
  formatVerificationDate,
  isVerificationRecent,
} from "../lib/verification";

interface VerifiedBadgeProps {
  verificationStatus: VerificationStatus;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export function VerifiedBadge({
  verificationStatus,
  size = "sm",
  showTooltip = true,
  className = "",
}: VerifiedBadgeProps) {
  if (!verificationStatus.isVerified) return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSize = sizeClasses[size];
  const isRecent = verificationStatus.verificationTimestamp
    ? isVerificationRecent(verificationStatus.verificationTimestamp)
    : true;

  const badgeColor = isRecent ? "text-green-600" : "text-yellow-600";

  const tooltipContent = verificationStatus.verificationTimestamp
    ? `Verified on ${formatVerificationDate(verificationStatus.verificationTimestamp)}`
    : "Identity verified";

  const badge = (
    <ShieldCheck
      className={`${iconSize} ${badgeColor} ${className}`}
      aria-label="Verified user"
    />
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <div className="relative group">
      {badge}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {tooltipContent}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
      </div>
    </div>
  );
}

interface VerifiedProfileBadgeProps {
  verificationStatus: VerificationStatus;
  username?: string;
}

// Specialized component for profile display with username and badge
export function VerifiedProfileBadge({
  verificationStatus,
  username = "User",
}: VerifiedProfileBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium text-gray-900">{username}</span>
      <VerifiedBadge
        verificationStatus={verificationStatus}
        size="sm"
        showTooltip={true}
      />
    </div>
  );
}

// Component for navbar display
export function NavbarVerifiedBadge({
  verificationStatus,
}: {
  verificationStatus: VerificationStatus;
}) {
  if (!verificationStatus.isVerified) return null;

  return (
    <div className="flex items-center">
      <VerifiedBadge
        verificationStatus={verificationStatus}
        size="sm"
        showTooltip={true}
        className="ml-1"
      />
    </div>
  );
}
