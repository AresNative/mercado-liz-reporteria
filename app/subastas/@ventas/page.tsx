"use client";

import Segment from "@/components/segment";

// Tamaño de página para datos importados
const IMPORT_PAGE_SIZE = 10;


export default function User() {

  return (
    <main className="flex flex-col items-center m-auto px-4 py-8">
      <section>
        <Segment
          items={[
            { value: "listas", label: "Listas" },
            { value: "subastas", label: "Subastas" },
          ]}
          defaultValue="listas"
          size="sm"
          accent="rose"
        />
      </section>
    </main >
  );
}
