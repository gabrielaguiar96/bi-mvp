"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SectionRouter } from "@/components/sections/router";
import type { SectionId } from "@/lib/nav";
import { NAV_ITEMS } from "@/lib/nav";

const VALID_IDS = new Set(NAV_ITEMS.map((n) => n.id));

function getInitialSection(): SectionId {
  if (typeof window === "undefined") return "visao-geral";
  const hash = window.location.hash.replace("#", "");
  return VALID_IDS.has(hash as SectionId) ? (hash as SectionId) : "visao-geral";
}

export default function Page() {
  const [active, setActive] = useState<SectionId>(getInitialSection);

  // Sync state → URL hash
  useEffect(() => {
    window.location.hash = active;
  }, [active]);

  // Listen for browser back/forward
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (VALID_IDS.has(hash as SectionId)) {
        setActive(hash as SectionId);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleNavigate = useCallback((id: SectionId) => {
    setActive(id);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar active={active} onNavigate={handleNavigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar active={active} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
            <SectionRouter active={active} />
          </div>
        </main>
      </div>
    </div>
  );
}
