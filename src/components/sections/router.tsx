"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SectionId } from "@/lib/nav";
import { VisaoGeralSection } from "./01-visao-geral";
import { GeralSection } from "./02-geral";
import { GeralFunilSection } from "./03-geral-funil";
import { IndicacaoSection } from "./04-indicacao";
import { NutrologiaSection } from "./05-nutrologia";
import { PediatriaSection } from "./06-pediatria";
import { DermatologiaSection } from "./07-dermatologia";
import { MetasSection } from "./08-metas";
import { ResumoAnualSection } from "./09-resumo-anual";

export function SectionRouter({ active }: { active: SectionId }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {renderSection(active)}
      </motion.div>
    </AnimatePresence>
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
