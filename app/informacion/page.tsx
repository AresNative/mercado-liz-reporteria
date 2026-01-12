// app/blog/page.jsx
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Footer from "@/template/footer";
import Header from "@/template/header";
import {
    Calendar,
    User,
    Tag,
    TrendingUp,
    MessageSquare,
    BookOpen,
    Lightbulb,
    Share2,
    Clock,
    ArrowRight,
} from "lucide-react";

export default function BlogPage() {
    const featuredPosts = [
        {
            id: 1,
            title: "Cómo la automatización transforma la gestión empresarial moderna",
            excerpt: "Descubre las estrategias clave para implementar procesos automatizados que aumentan la productividad en un 40%.",
            category: "Automatización",
            readTime: "5 min",
            date: "15 Nov, 2024",
            image: "/blog/automatizacion.jpg",
            author: "María González",
        },
        {
            id: 2,
            title: "Gestión de nómina: Errores comunes y cómo evitarlos",
            excerpt: "Análisis de los 10 errores más frecuentes en la gestión de nómina y soluciones prácticas para cada uno.",
            category: "Recursos Humanos",
            readTime: "7 min",
            date: "10 Nov, 2024",
            image: "/blog/nomina.jpg",
            author: "Carlos Ruiz",
        },
    ];

    const recentPosts = [
        {
            id: 3,
            title: "Integración de sistemas: Clave para el crecimiento empresarial",
            category: "Tecnología",
            date: "8 Nov, 2024",
        },
        {
            id: 4,
            title: "Análisis de datos en tiempo real para la toma de decisiones",
            category: "Analítica",
            date: "5 Nov, 2024",
        },
        {
            id: 5,
            title: "Seguridad informática en plataformas de gestión empresarial",
            category: "Seguridad",
            date: "2 Nov, 2024",
        },
        {
            id: 6,
            title: "Optimización de procesos de compra con IA",
            category: "Compras",
            date: "28 Oct, 2024",
        },
    ];

    const categories = [
        "Todos",
        "Automatización",
        "Recursos Humanos",
        "Finanzas",
        "Ventas",
        "Tecnología",
        "Tutoriales"
    ];

    return (
        <>
            <Header />

            {/* Hero Section del Blog */}
            <header className="text-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-green-800 dark:text-green-200">
                <div className="py-20 px-4">
                    <section className="max-w-6xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog del Proyecto</h1>
                        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                            Descubre consejos, tendencias y mejores prácticas en gestión empresarial
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

            {/* Categorías */}
            <section className="py-8 px-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {categories.map((category, index) => (
                            <button
                                key={index}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${index === 0
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Artículos Destacados */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <label className="mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <Lightbulb className="size-8 text-yellow-500" />
                            Artículos Destacados
                        </h2>
                        <p className="text-gray-600 dark:text-gray-100 max-w-2xl">
                            Lo más leído y compartido por nuestra comunidad
                        </p>
                    </label>

                    <BentoGrid cols={2} rows={1} className="mb-16 dark:text-white">
                        {featuredPosts.map((post) => (
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
                                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-baseline-last md:items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex md:items-center gap-4 md:flex-row flex-col ">
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
                                        <button className="flex items-center gap-1 text-green-600 hover:text-green-700">
                                            <Share2 className="size-4" />
                                            Compartir
                                        </button>
                                    </div>

                                    <a
                                        href={`/blog/${post.id}`}
                                        className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                                    >
                                        Leer artículo completo
                                        <ArrowRight className="ml-2 size-4" />
                                    </a>
                                </div>
                            </BentoItem>
                        ))}
                    </BentoGrid>

                    {/* Artículos Recientes */}
                    <label className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <TrendingUp className="size-7 text-blue-500" />
                            Artículos Recientes
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
                                    <a href={`/blog/${post.id}`}>
                                        {post.title}
                                    </a>
                                </h3>

                                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="size-4" />
                                        {post.date}
                                    </span>
                                    <a
                                        href={`/blog/${post.id}`}
                                        className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                                    >
                                        Leer más
                                        <ArrowRight className="ml-1 size-4" />
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Newsletter */}
                    <div className="mt-20 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 md:p-12">
                        <div className="max-w-2xl mx-auto text-center">
                            <MessageSquare className="size-12 text-green-600 mx-auto mb-4" />
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                                Suscríbete a nuestro newsletter
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-8">
                                Recibe las últimas actualizaciones, consejos y recursos directamente en tu correo
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