export default function Background({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className="absolute min-h-screen top-0 z-[-2] w-full bg-[var(--background)] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(201,255,197,0.3),rgba(255,255,255,0))]" >
                <main className="z-50">
                    {children}
                </main>
            </div>
        </>
    );
}
