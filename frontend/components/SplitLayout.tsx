'use client';

import React from 'react';

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftBg?: string;
  rightBg?: string;
}

export default function SplitLayout({
  left,
  right,
  leftBg = '#080808',
  rightBg = '#0D0D0D',
}: SplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div
        className="w-full md:w-1/2 flex items-center justify-center p-10 md:p-20"
        style={{ background: leftBg }}
      >
        <div className="w-full max-w-md">{left}</div>
      </div>
      <div
        className="w-full md:w-1/2 flex items-center justify-center p-10 md:p-20"
        style={{ background: rightBg }}
      >
        <div className="w-full max-w-md">{right}</div>
      </div>
    </div>
  );
}
