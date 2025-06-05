// components/Header.tsx
import { cn } from '@/utils/functions/cn';
interface HeaderProps {
    title: string;
    showMenuButton?: boolean;
    showSearchButton?: boolean;
    showBackButton?: boolean;
    className?: string;
    isScrolled?: boolean;
    defaultBack?: string;
}

const Header: React.FC<HeaderProps> = ({
    title,
    isScrolled = false,
    showMenuButton = true,
    showSearchButton = false,
    showBackButton = false,
    className = '',
    defaultBack
}) => {

    return (
        <>
            <header
                className={cn(
                    `transition-all duration-300 safe-area-top`,
                    showBackButton || isScrolled
                        ? 'bg-white/70 border-b backdrop-blur-sm'
                        : 'bg-transparent',
                    className
                )}
            >
                <section className='p-2 flex items-center '>
                    {/* {showBackButton && (
                        <IonButtons slot="start">
                            <IonBackButton defaultHref={defaultBack ?? "/"} className={'text-purple-700'} text="Atras" />
                        </IonButtons>)} */}

                    <h2
                        className={cn(
                            "text-xl font-light tracking-tight",
                            showBackButton || isScrolled ? "text-purple-700" : "text-white",
                            showSearchButton ? "text-left" : "",
                        )}
                    >
                        {title}
                    </h2>

                    {/*  {showMenuButton && (
                        <IonButtons slot="end">
                            <IonMenuButton className={cn(showBackButton || isScrolled ? 'text-purple-700' : 'text-white')} />
                        </IonButtons>
                    )} */}
                </section>
            </header>
        </>
    );
};

export default Header;