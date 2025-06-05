"use client";
import { cn } from '@/utils/functions/cn';
import AppMenu from './menu';
import { ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HeaderProps {
    title: string;
    showMenuButton?: boolean;
    showBackButton?: boolean;
    className?: string;
    defaultBack?: string;
}

const Header: React.FC<HeaderProps> = ({
    title,
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
                `sticky top-0 z-10 transition-all duration-300 safe-area-top`,
                showBackButton || isScrolled
                    ? 'bg-white/70 border-b border-gray-200 backdrop-blur-sm'
                    : 'bg-gradient-to-r from-purple-600 to-purple-800',
                className
            )}
            aria-label="Cabecera principal"
        >
            <section className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {showBackButton && (
                        <button
                            onClick={() => router.push(defaultBack)}
                            className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                            aria-label="Volver atrás"
                        >
                            <ArrowLeft
                                className={cn(
                                    "h-6 w-6",
                                    isScrolled ? "text-purple-700" : "text-white"
                                )}
                            />
                        </button>
                    )}

                    <h1
                        className={cn(
                            "font-light tracking-tight truncate max-w-[60vw] text-2xl font-[Lobster]",
                            showBackButton || isScrolled ? "text-purple-700" : "text-white",
                        )}
                        aria-level={1}
                    >
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {showMenuButton && <AppMenu />}
                </div>
            </section>
        </header >
    );
};

export default Header;