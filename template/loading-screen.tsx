import { Loader2 } from 'lucide-react';

export const LoadingScreen = () => (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4">
        <div
            role="status"
            aria-label="Cargando contenido"
            className="flex flex-col items-center justify-center space-y-4"
        >
            <Loader2
                className="h-12 w-12 text-green-600 animate-spin"
                aria-hidden="true"
            />
            <p className="text-lg text-gray-600 dark:text-gray-100 font-medium">Cargando pantalla...</p>
        </div>
    </main>
);
interface LoadingSectionProps {
    message?: string;
}

export const LoadingSection = ({ message }: LoadingSectionProps) => (
    <section className="w-full flex flex-col items-center justify-center p-4">
        <div
            role="status"
            aria-label="Cargando contenido"
            className="flex flex-col items-center justify-center space-y-4"
        >
            <Loader2
                className="h-12 w-12 text-green-600 animate-spin"
                aria-hidden="true"
            />
            <p className="text-lg text-gray-600 dark:text-gray-100 font-medium">{message ? message : "Cargando pantalla"}...</p>
        </div>
    </section>
);