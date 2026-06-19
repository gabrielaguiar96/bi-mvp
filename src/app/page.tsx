"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SectionRouter } from "@/components/sections/router";
import type { SectionId } from "@/lib/nav";

export default function Page() {
  const [active, setActive] = useState<SectionId>("visao-geral");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar active={active} onNavigate={setActive} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
            <SectionRouter active={active} />
          </div>
        </main>
      </div>
    </div>
  );
}
