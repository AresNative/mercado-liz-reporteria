"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import Card from "@/components/card";
import Details from "@/components/details";
import Badge from "@/components/badge";
import AvatarGroup from "@/components/avatar-group";
import appsData from "../data/apps.json";
import { Download, Calendar, Users, Tag } from "lucide-react";
import Link from "next/link";
import { CountdownTimer } from "@/components/counter-down";
import Header from "@/template/header";
import Footer from "@/template/footer";

export default function PageID() {
    const params = useParams();
    const id = params.id as string;
    const app = appsData.find((a) => a.id === id);
    if (!app) notFound();

    // Fecha de expiración de ejemplo para CountdownTimer (opcional)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    return (
        <>

            <Header />
            <main className="container min-h-svh mx-auto px-4 py-8">
                <Link href="/informacion" className="text-blue-600 hover:underline mb-6 inline-block">
                    ← Volver al listado
                </Link>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Columna izquierda: icono y acciones */}
                    <div className="md:col-span-1">

                        <a
                            href={app.fileUrl}
                            download
                            type="button"
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-lg font-semibold"
                        >
                            <Download className="w-5 h-5" />
                            Descargar APK
                        </a>

                        {/* Contador de oferta (opcional) */}
                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-200 rounded-lg text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-800">Oferta termina en:</p>
                            <CountdownTimer endDate={expiryDate} refrech={() => console.log("Oferta expirada")} />
                        </div>
                    </div>

                    {/* Columna derecha: detalles */}
                    <div className="md:col-span-2 space-y-6">
                        <h1 className="text-4xl font-bold dark:text-white">{app.nombre}</h1>
                        <Badge color="blue" text={app.category} />

                        {/* Tarjetas de resumen con componente Card */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card
                                title="Versión"
                                value={app.version}
                                icon={<Tag className="text-white" />}
                            />
                            {/* <Card
                                title="Tamaño"
                                value={app.tamaño}
                                icon={<HardDrive className="text-white" />}
                            /> */}
                            <Card
                                title="Fecha"
                                value={new Date(app.date).toLocaleDateString()}
                                icon={<Calendar className="text-white" />}
                            />
                        </div>

                        {/* Descripción con componente Details */}
                        <Details title="Descripción completa" type="form">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                {app.descripcion}
                            </p>
                        </Details>

                        {/* Autores con AvatarGroup */}
                        {app.autores && (
                            <div className="flex gap-2 items-center mt-4">
                                <Users className="w-5 h-5 text-gray-500" />
                                <AvatarGroup data={app.autores} />
                            </div>
                        )}

                        {/* Más detalles con componente Details tipo form (si aplica) */}
                        <Details title="Información adicional" type="form">
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Requiere Android 5.0+</li>
                                <li>Idiomas: Español, Inglés</li>
                                <li>Licencia: Gratuita</li>
                            </ul>
                        </Details>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}