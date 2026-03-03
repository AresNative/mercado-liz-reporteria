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

// Datos completos de artículos sobre actualizaciones de APKs
const blogPosts = [
    // Lanzamiento
    {
        id: 1,
        title: "Pickup v1.0.0 – La nueva forma de comprar",
        excerpt: "Después de meses de desarrollo, lanzamos Pickup, una app ligera y segura para comprar productos en línea.",
        category: "Lanzamiento",
        readTime: "5 min",
        date: "03 Marzo, 2026",
        image: "/pickup-v1.0.0.png",
        author: "Equipo Pickup",
        authorAvatar: "/avatars/team-pickup.jpg",
        appId: "pickup",
        version: "1.0.0",
        tags: ["Lanzamiento"],
    },
    // Actualización
    {
        id: 2,
        title: "Mi App 1 v2.5 – Soporte para Android 15 y modo oscuro mejorado",
        excerpt: "La nueva versión de Mi App 1 incluye optimizaciones para Android 15, un modo oscuro renovado y correcciones de rendimiento.",
        category: "Actualización",
        readTime: "4 min",
        date: "28 Febrero, 2026",
        image: "/miapp1-update.jpg",
        author: "María González",
        authorAvatar: "/avatars/maria.jpg",
        appId: "mi-app-1",
        version: "2.5",
        tags: ["Android 15", "UI/UX"],
    },
    // Novedad
    {
        id: 3,
        title: "Otra App ahora se sincroniza con Google Drive",
        excerpt: "Integramos Google Drive para que puedas respaldar y acceder a tus datos desde cualquier lugar. Actívalo en ajustes.",
        category: "Novedad",
        readTime: "3 min",
        date: "20 Febrero, 2026",
        image: "/otra-app-drive.jpg",
        author: "Carlos Ruiz",
        authorAvatar: "/avatars/carlos.jpg",
        appId: "otra-app",
        version: "3.2",
        tags: ["Nube", "Sincronización"],
    },
    // Parche
    {
        id: 4,
        title: "Corrección de errores en Flashlight Plus (v1.2.1)",
        excerpt: "Solucionamos un problema que causaba cierres inesperados en algunos dispositivos Samsung. Recomendamos actualizar.",
        category: "Parche",
        readTime: "2 min",
        date: "15 Febrero, 2026",
        image: "/flashlight-patch.jpg",
        author: "Equipo de Soporte",
        authorAvatar: "/avatars/support.jpg",
        appId: "flashlight-plus",
        version: "1.2.1",
        tags: ["Bug fix", "Estabilidad"],
    },
    // Seguridad
    {
        id: 5,
        title: "Actualización de seguridad crítica para todas las apps",
        excerpt: "Hemos parcheado una vulnerabilidad en la biblioteca de autenticación. Actualiza tus apps a las últimas versiones.",
        category: "Seguridad",
        readTime: "6 min",
        date: "10 Febrero, 2026",
        image: "/security-update.jpg",
        author: "Equipo de Seguridad",
        authorAvatar: "/avatars/security.jpg",
        appId: null,
        version: "múltiple",
        tags: ["Parche de seguridad", "Crítico"],
    },
    // Logro
    {
        id: 6,
        title: "¡Mi App 1 supera las 50.000 descargas!",
        excerpt: "Gracias a la comunidad por confiar en nosotros. Seguiremos mejorando cada día.",
        category: "Logro",
        readTime: "2 min",
        date: "5 Febrero, 2026",
        image: "/miapp1-milestone.jpg",
        author: "Equipo Mi App 1",
        authorAvatar: "/avatars/team-miapp1.jpg",
        appId: "mi-app-1",
        version: "2.4",
        tags: ["Hito", "Comunidad"],
    },
];

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
    ...new Set(blogPosts.map(post => post.category))
];

export default function BlogPage() {
    const [selectedCategory, setSelectedCategory] = useState("Todos");

    // Filtrar posts según categoría seleccionada
    const filteredPosts = useMemo(() => {
        if (selectedCategory === "Todos") return blogPosts;
        return blogPosts.filter(post => post.category === selectedCategory);
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
                                    title={post.title}
                                    description={post.excerpt}
                                    icon={<BookOpen className="size-6 text-primary dark:text-gray-600" />}
                                    className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow"
                                >
                                    <div className="space-y-4">
                                        <div className="relative h-48 w-full overflow-hidden rounded-lg mb-4">
                                            <img
                                                src={post.image}
                                                alt={post.title}
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
                                            <ShareButton url={`${process.env.NEXT_DOMINIO_URL}/informacion/${post.id}`} title={post.title} />
                                        </div>

                                        {/* Etiquetas de versión y app */}
                                        <div className="flex gap-2 flex-wrap">
                                            {post.appId && (
                                                <Badge color="blue" text={`App: ${post.appId}`} />
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