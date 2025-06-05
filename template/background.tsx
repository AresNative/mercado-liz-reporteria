export default function Background({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="min-h-screen h-full flex flex-col isolate overflow-hidden bg-white ">

            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.purple.100),white] opacity-20" />

            <div className="absolute inset-y-0 right-1/2 -z-10 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-purple-600/10 ring-1 ring-purple-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center transition-colors duration-300" />

            <div className="flex-grow">
                {children}
            </div>
        </main>
    );
}