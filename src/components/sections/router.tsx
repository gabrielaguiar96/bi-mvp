"use client";

import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SectionId } from "@/lib/nav";

const VisaoGeralSection = lazy(() => import("./01-visao-geral").then((m) => ({ default: m.VisaoGeralSection })));
const GeralSection = lazy(() => import("./02-geral").then((m) => ({ default: m.GeralSection })));
const GeralFunilSection = lazy(() => import("./03-geral-funil").then((m) => ({ default: m.GeralFunilSection })));
const IndicacaoSection = lazy(() => import("./04-indicacao").then((m) => ({ default: m.IndicacaoSection })));
const NutrologiaSection = lazy(() => import("./05-nutrologia").then((m) => ({ default: m.NutrologiaSection })));
const PediatriaSection = lazy(() => import("./06-pediatria").then((m) => ({ default: m.PediatriaSection })));
const DermatologiaSection = lazy(() => import("./07-dermatologia").then((m) => ({ default: m.DermatologiaSection })));
const MetasSection = lazy(() => import("./08-metas").then((m) => ({ default: m.MetasSection })));
const ResumoAnualSection = lazy(() => import("./09-resumo-anual").then((m) => ({ default: m.ResumoAnualSection })));

export function SectionRouter({ active }: { active: SectionId }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Suspense fallback={<SectionSkeleton />}>
          {renderSection(active)}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-4 w-96 rounded bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

function renderSection(id: SectionId) {
  switch (id) {
    case "visao-geral":
      return <VisaoGeralSection />;
    case "geral":
      return <GeralSection />;
    case "geral-funil":
      return <GeralFunilSection />;
    case "indicacao":
      return <IndicacaoSection />;
    case "nutrologia":
      return <NutrologiaSection />;
    case "pediatria":
      return <PediatriaSection />;
    case "dermatologia":
      return <DermatologiaSection />;
    case "metas":
      return <MetasSection />;
    case "resumo-anual":
      return <ResumoAnualSection />;
  }
}
