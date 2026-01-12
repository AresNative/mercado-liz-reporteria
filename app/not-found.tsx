"use client"
import Link from "next/link";
import { getLocalStorageItem } from '@/utils/functions/local-storage';
import { useState, useEffect } from "react";

export default function NotFound() {
    const [user, setuser] = useState(null)
    useEffect(() => {
        const user = getLocalStorageItem('userData');
        setuser(user);
    }, []);

    return (
        <>
            <section className="flex flex-col items-center justify-center h-screen text-center">
                <h1 className="text-7xl font-bold">404</h1>
                <h2 className="text-xl font-semibold">Contenido no encontrado</h2>
                <p className="text-lg text-gray-600 dark:text-gray-100">
                    No se pudo encontrar el recurso solicitado <Link href={user ? "/reporteria" : "/"} className="underline text-green-700">Regresar al inicio</Link>
                </p>
            </section>
        </>
    );
}