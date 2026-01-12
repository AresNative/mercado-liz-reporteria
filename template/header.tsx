"use client";
import { cn } from '@/utils/functions/cn';
import AppMenu from './menu';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HeaderProps {
    showMenuButton?: boolean;
    showBackButton?: boolean;
    className?: string;
    defaultBack?: string;
}

const Header: React.FC<HeaderProps> = ({
    showMenuButton = true,
    showBackButton = false,
    className = '',
    defaultBack = '/'
}) => {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false); // Estado interno

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        // Solo añade el event listener en el cliente
        window.addEventListener('scroll', handleScroll);

        // Comprueba el scroll inicial
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <header
            className={cn(
                `sticky top-0 z-40 transition-all duration-300 safe-area-top flex items-center justify-between`,
                showBackButton || isScrolled
                    ? 'bg-(--background)/80 border-b border-gray-200 dark:border-gray-700'
                    : 'bg-linear-to-r from-green-800 to-green-600 ',
                className
            )}
            aria-label="Cabecera principal"
        >
            <section className="p-2 flex items-center justify-between w-full backdrop-blur-xs">
                <ul className="flex items-center gap-2  backdrop-blur-lg">
                    {showBackButton && (
                        <button
                            onClick={() => router.push(defaultBack)}
                            className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                            aria-label="Volver atrás"
                        >
                            <ArrowLeft
                                className={cn(
                                    "h-6 w-6",
                                    isScrolled ? "text-green-700" : "text-white"
                                )}
                            />
                        </button>
                    )}

                    <span
                        className={cn(
                            "font-light tracking-tight truncate pb-2 pt-0 flex flex-col",
                            showBackButton ?? "text-center m-auto", isScrolled ? "text-green-700" : "text-white",
                        )}
                        aria-level={1}
                    >
                        <a href='/' className={cn('flex items-center gap-2 font-bold', !isScrolled && 'text-2xl')}>
                            <BrainCircuit className={cn(isScrolled ? 'size-4' : 'size-6')} /> Solucion integral
                        </a>
                        <label className={cn(!isScrolled ? 'text-gray-300 dark:text-white text-md' : 'text-gray-600 dark:text-white text-xs')}>
                            {process.env.NEXT_CLIENT_NAME}
                        </label>
                    </span>
                </ul>
            </section>
            {showMenuButton && <AppMenu isScrolled={isScrolled} />}
        </header >
    );
};

export default Header;