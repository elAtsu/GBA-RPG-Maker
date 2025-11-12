'use client';

import { AppProvider } from '@/context/app-context';
import { GbaArchitect } from '@/components/gba-architect';

export default function Home() {
  return (
    <AppProvider>
      <GbaArchitect />
    </AppProvider>
  );
}
