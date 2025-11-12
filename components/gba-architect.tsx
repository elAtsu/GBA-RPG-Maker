'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { LevelEditor } from '@/components/level-editor';
import { useAppContext } from '@/context/app-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditorToolbar } from './editor-toolbar';

export function GbaArchitect() {
    const { state } = useAppContext();
    const currentProject = state.projects.find(p => p.id === state.currentProjectId);

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-screen">
            <AppHeader />
            <main className="flex-1 flex flex-col overflow-auto relative">
                <div className="flex justify-center p-2">
                    <EditorToolbar />
                </div>
                {currentProject && currentProject.levels.length > 0 ? (
                    <ScrollArea className="flex-1">
                        <div className="flex flex-wrap justify-center gap-8 p-4">
                            {currentProject.levels.map(level => (
                                <LevelEditor key={level.id} level={level} />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <p className="text-muted-foreground">Add a level to start editing.</p>
                    </div>
                )}
            </main>
        </div>
        <div className="fixed bottom-4 right-4 z-10 flex flex-col items-end gap-2">
            <p className="text-xs text-muted-foreground">GBA RPG Maker v0.1.0-beta</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
