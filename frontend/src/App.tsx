import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSessionContext } from "@/lib/session-context";
import { Header } from "@/components/layout/header";
import { Banner } from "@/components/layout/banner";
import { FolderRail, MobileStageIndicator, type StageStatus } from "@/components/layout/folder-rail";
import { StartPage } from "@/pages/StartPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { UnderstandPage } from "@/pages/UnderstandPage";
import { PreparePage } from "@/pages/PreparePage";
import { DiscoverPage } from "@/pages/DiscoverPage";

const STAGE_PATHS = ["/profile", "/understand", "/prepare", "/discover"];

function AppShell() {
  const { token, fields, allConfirmed, deleteSession, calcResult } = useSessionContext();
  const location = useLocation();

  if (!token) {
    return <StartPage />;
  }

  const currentStageId = STAGE_PATHS.indexOf(location.pathname) + 1;

  const stageStatuses: Record<number, StageStatus> = {
    1: fields.length > 0 && allConfirmed ? "confirmed" : fields.length > 0 ? "in-progress" : "not-started",
    2: calcResult ? "confirmed" : fields.length > 0 ? "in-progress" : "not-started",
    3: "not-started",
    4: "not-started",
  };

  const canAccessStage = (stageId: number): boolean => {
    switch (stageId) {
      case 1: return true;
      case 2: return allConfirmed;
      case 3: return allConfirmed;
      case 4: return allConfirmed;
      default: return false;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-brass focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to main content
      </a>

      <Header onDelete={deleteSession} />
      <Banner />
      <MobileStageIndicator currentPath={location.pathname} stageStatuses={stageStatuses} />

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-line pt-4 md:block">
          <FolderRail stageStatuses={stageStatuses} canAccessStage={canAccessStage} />
        </aside>
        <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Routes>
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/understand"
                element={canAccessStage(2) ? <UnderstandPage /> : <Navigate to="/profile" replace />}
              />
              <Route
                path="/prepare"
                element={canAccessStage(3) ? <PreparePage /> : <Navigate to="/profile" replace />}
              />
              <Route
                path="/discover"
                element={canAccessStage(4) ? <DiscoverPage /> : <Navigate to="/profile" replace />}
              />
              <Route path="*" element={<Navigate to="/profile" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return <AppShell />;
}
