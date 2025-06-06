export default function Background({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="relative min-h-screen flex flex-col isolate overflow-hidden bg-white">
            {/* Fondo radial sutil */}
            <div className="absolute inset-0 -z-20 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.purple.100),white)] opacity-20" />

            {/* Figura diagonal responsiva */}
            <div className="absolute inset-y-0 right-1/2 -z-10 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-purple-600/10 ring-1 ring-purple-50 
          sm:right-1/3 md:right-1/4 lg:right-1/3 xl:right-1/2
          sm:origin-bottom-left xl:origin-center 
          transition-all duration-300" />

            {/* Contenido principal */}
            <div className="flex-grow z-10">
                {children}
            </div>
        </main>
    );
}
