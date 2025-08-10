import Link from "next/link";
export default function NotFound() {
    return (
        <>
            <section className="flex flex-col items-center justify-center h-screen text-center">
                <h1 className="text-7xl font-bold">404</h1>
                <h2 className="text-xl font-semibold">Not Found</h2>
                <p className="text-lg text-gray-600 dark:text-gray-100">
                    Could not find requested resource <Link href="/" className="underline text-green-700">Return to Home</Link>
                </p>
            </section>
        </>
    );
}