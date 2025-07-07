import { Suspense } from "react";

export default function ProyectosPage() {
    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <Suspense fallback={<div className="py-10 text-center text-gray-500">Cargando tablero...</div>}>
            </Suspense>
        </main>
    );
}