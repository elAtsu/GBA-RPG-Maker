
'use client';

import React from 'react';
import {
  SidebarHeader,
  SidebarContent,
} from '@/components/ui/sidebar';
import { ObjectInteractionPanel } from './object-interaction-panel';
import { OnStartInteractionPanel } from './on-start-interaction-panel';
import { TriggerInteractionPanel } from './trigger-interaction-panel';
import { AssetsPanel } from './assets-panel';
import { CombatPanel } from './combat-panel';
import { useAppContext } from '@/context/app-context';

export function AppSidebar() {
  const { state } = useAppContext();

  const renderPanel = () => {
    if (state.editMode === 'assets') {
        return <AssetsPanel />;
    }
    if (state.editMode === 'combat') {
        return <CombatPanel />;
    }
    if (state.selectedObject) {
        return <ObjectInteractionPanel />;
    }
    if (state.selectedTrigger) {
        return <TriggerInteractionPanel />;
    }
    return <OnStartInteractionPanel />;
  }

  return (
    <>
      <SidebarHeader>
        {/* The sidebar header is intentionally left blank */}
      </SidebarHeader>
      <SidebarContent>
        {renderPanel()}
      </SidebarContent>
    </>
  );
}
