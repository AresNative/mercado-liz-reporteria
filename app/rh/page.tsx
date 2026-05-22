"use client";

import { useState } from "react";

import Header from "@/template/header";
import Footer from "@/template/footer";

import { Users, LayoutList, Clapperboard, BookOpenText } from "lucide-react";
import AreasManager from "./components/admin/areas-manager";
import PageQuizzes from "./components/admin/quizzes-manager";
import PageVideos from "./components/admin/videos-manager";
import PageEmployees from "./components/admin/employees-manager";

/* IMPORTS DE TUS PÁGINAS */

const PageAreas = () => {

    const [areaSeleccionada, setAreaSeleccionada] = useState<number | null>(null);

    /* ÁREAS */
    const areas = [
        {
            id: 1,
            nombre: "Areas",
            icon: <LayoutList className="w-4 h-4" />,
        },
        {
            id: 2,
            nombre: "Empleados",
            icon: <Users className="w-4 h-4" />,
        },
        {
            id: 3,
            nombre: "Videos",
            icon: <Clapperboard className="w-4 h-4" />,
        },
        {
            id: 4,
            nombre: "Cuestionarios",
            icon: <BookOpenText className="w-4 h-4" />,
        },
    ];

    /* COMPONENTES */
    const componentes: any = {
        1: <AreasManager />,
        2: <PageEmployees />,
        3: <PageVideos />,
        4: <PageQuizzes />,
    };

    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[80vh]">
                {/* HEADER */}
                <ul className="hidden md:flex justify-between items-center mb-4">
                    <li className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            Gestión de Áreas
                        </h1>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Selecciona un área para visualizar su información
                        </span>
                    </li>
                </ul>

                {/* CARD */}
                <article className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">

                    {/* BOTONES */}
                    <div className="flex gap-2 flex-wrap mb-6">
                        {areas.map((area) => (
                            <button
                                key={area.id}
                                onClick={() => setAreaSeleccionada(area.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-all

                                    ${areaSeleccionada === area.id
                                        ? "bg-purple-300  border-purple-100"
                                        : "bg-gray-100 hover:bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                                    }
                                `}
                            >
                                {area.icon}
                                {area.nombre}
                            </button>
                        ))}
                    </div>

                    {/* CONTENIDO */}
                    <div className="mt-4">

                        {!areaSeleccionada && (
                            <div className="p-6 text-center text-gray-500">
                                Selecciona un área
                            </div>
                        )}

                        {areaSeleccionada !== null &&
                            componentes[areaSeleccionada]
                        }

                    </div>

                </article>
            </section>
            <Footer />
        </>
    );
};

export default PageAreas;