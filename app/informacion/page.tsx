"use client";

import { useState, useMemo } from "react";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Footer from "@/template/footer";
import Header from "@/template/header";
import Badge from "@/components/badge";
import {
    Calendar,
    User,
    Tag,
    TrendingUp,
    MessageSquare,
    BookOpen,
    Lightbulb,
    Clock,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Segment from "@/components/segment";
import ShareButton from "@/components/share-button";
import appsData from "./data/apps.json";

// Artículos recientes (pueden ser algunos de los mismos o diferentes)
const recentPosts = [
    {
        id: 7,
        title: "Pickup v1.0.1 – Pequeñas mejoras de rendimiento",
        category: "Actualización",
        date: "1 Marzo, 2026",
        appId: "pickup",
    },
    {
        id: 8,
        title: "Otra App añade soporte para tablets",
        category: "Novedad",
        date: "25 Febrero, 2026",
        appId: "otra-app",
    },
    {
        id: 9,
        title: "Corrección en Flashlight Plus (v1.2.2)",
        category: "Parche",
        date: "18 Febrero, 2026",
        appId: "flashlight-plus",
    },
    {
        id: 10,
        title: "Recomendaciones de seguridad para usuarios",
        category: "Seguridad",
        date: "12 Febrero, 2026",
        appId: null,
    },
    {
        id: 11,
        title: "Mi App 1 nominada a mejor app del año",
        category: "Logro",
        date: "8 Febrero, 2026",
        appId: "mi-app-1",
    },
    {
        id: 12,
        title: "Pickup: Beta cerrada para nuevas funciones",
        category: "Novedad",
        date: "2 Febrero, 2026",
        appId: "pickup",
    },
];

// Categorías únicas (aseguramos que estén todas)
const allCategories = [
    "Todos",
    ...new Set(appsData.map(post => post.category))
];

export default function BlogPage() {
    const [selectedCategory, setSelectedCategory] = useState("Todos");

    // Filtrar posts según categoría seleccionada
    const filteredPosts = useMemo(() => {
        if (selectedCategory === "Todos") return appsData;
        return appsData.filter(post => post.category === selectedCategory);
    }, [selectedCategory]);

    // También podemos filtrar los destacados (primeros 2 del filtrado, o mantener lógica aparte)
    const featuredPosts = filteredPosts.slice(0, 2);

    return (
        <>
            <Header />

            {/* Hero Section del Blog */}
            <header className="text-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-green-800 dark:text-green-200">
                <div className="py-20 px-4">
                    <section className="max-w-6xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Novedades y Actualizaciones
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                            Entérate de los últimos cambios, mejoras y lanzamientos de nuestras apps
                        </p>
                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar artículos..."
                                    className="w-full px-6 py-4 rounded-full border-2 border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
                                />
                                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors">
                                    <ArrowRight className="size-5" />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </header>

            {/* Categorías con Segment */}
            <section className="py-8 px-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Segment
                            items={allCategories.map(cat => ({ value: cat, label: cat }))}
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                            className="mb-8"
                        />
                    </div>
                </div>
            </section>

            {/* Artículos Destacados */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <label className="mb-12">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <Lightbulb className="size-8 text-yellow-500" />
                            Actualizaciones Destacadas
                        </h2>
                        <p className="text-gray-600 dark:text-gray-100 max-w-2xl">
                            Las novedades más importantes de nuestras aplicaciones
                        </p>
                    </label>

                    <BentoGrid cols={2} rows={1} className="mb-16 dark:text-white">
                        {featuredPosts.length > 0 ? (
                            featuredPosts.map((post) => (
                                <BentoItem
                                    key={post.id}
                                    rowSpan={1}
                                    colSpan={1}
                                    title={post.nombre}
                                    description={post.excerpt}
                                    icon={<BookOpen className="size-6 text-primary dark:text-gray-600" />}
                                    className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow"
                                >
                                    <div className="space-y-4">
                                        <div className="relative h-48 w-full overflow-hidden rounded-lg mb-4">
                                            <img
                                                src={post.image}
                                                alt={post.nombre}
                                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <Badge color="green" text={post.category} />
                                            </div>
                                        </div>

                                        <div className="flex items-baseline-last md:items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex md:items-center gap-4 md:flex-row flex-col">
                                                <span className="flex items-center gap-1">
                                                    <User className="size-4" />
                                                    {post.author}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-4" />
                                                    {post.date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-4" />
                                                    {post.readTime} lectura
                                                </span>
                                            </div>
                                            <ShareButton url={`${process.env.NEXT_DOMINIO_URL}/informacion/${post.id}`} title={post.nombre} />
                                        </div>

                                        {/* Etiquetas de versión y app */}
                                        <div className="flex gap-2 flex-wrap">
                                            {post.appId && (
                                                <Badge color="blue" text={`${post.appId}`} />
                                            )}
                                            {post.version && (
                                                <Badge color="purple" text={`v${post.version}`} />
                                            )}
                                            {post.tags?.map(tag => (
                                                <Badge key={tag} color="gray" text={tag} />
                                            ))}
                                        </div>

                                        <Link
                                            href={`/informacion/${post.id}`}
                                            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                                        >
                                            Leer artículo completo
                                            <ArrowRight className="ml-2 size-4" />
                                        </Link>
                                    </div>
                                </BentoItem>
                            ))
                        ) : (
                            <p className="col-span-2 text-center text-gray-500">No hay artículos en esta categoría.</p>
                        )}
                    </BentoGrid>

                    {/* Artículos Recientes */}
                    <label className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <TrendingUp className="size-7 text-blue-500" />
                            Últimas Novedades
                        </h2>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recentPosts.map((post) => (
                            <article
                                key={post.id}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Tag className="size-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                        {post.category}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 hover:text-green-600 transition-colors">
                                    <Link href={`/informacion/${post.id}`}>
                                        {post.title}
                                    </Link>
                                </h3>

                                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="size-4" />
                                        {post.date}
                                    </span>
                                    {post.appId && (
                                        <Badge color="gray" text={post.appId} />
                                    )}
                                    <Link
                                        href={`/informacion/${post.id}`}
                                        className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                                    >
                                        Leer más
                                        <ArrowRight className="ml-1 size-4" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Newsletter */}
                    <div className="mt-20 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 md:p-12">
                        <div className="max-w-2xl mx-auto text-center">
                            <MessageSquare className="size-12 text-green-600 mx-auto mb-4" />
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                                Suscríbete a nuestras novedades
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-8">
                                Recibe actualizaciones de apps, nuevos lanzamientos y parches directamente en tu correo
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="flex-1 px-6 py-3 rounded-full border-2 border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
                                />
                                <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold transition-colors">
                                    Suscribirse
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                                Sin spam. Puedes cancelar en cualquier momento.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}