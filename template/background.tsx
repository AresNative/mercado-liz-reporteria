export default function Background({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <main className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]" > <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_300px_at_100%_100px,#C9FFC5,transparent)]"></div>
            </main>{/* Contenido principal */}
            <div className="z-50">
                {children}
            </div>
        </>
    );
}
