// app/page.jsx
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Footer from "@/template/footer";
import {
  HistoryIcon,
  ArrowRightIcon,
  ShoppingCart,
  Tag,
  Gavel,
  CalendarCheck,
  Users,
  Wallet,
  Lock,
  ChartCandlestick,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <header className="text-center bg-[url(/merc1.jpg)] bg-cover text-green-800 dark:text-green-200 bg-no-repeat bg-center relative">
        <div className="py-40 px-4 bg-gradient-to-b from-gray-50/60 to-[var(--background)]">
          <section className="max-w-6xl mx-auto ">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Gestión Empresarial Integral</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              La solución todo en uno para gestionar compras, ventas, subastas, proyectos, empleados y nómina
            </p>
            {/* <ul className="flex flex-col sm:flex-row relative justify-center gap-4 z-10">
              <button className="bg-white cursor-pointer text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105">
                Solicitar Demo
              </button>
              <button className="bg-white/70 cursor-pointer border-2 border-green-800 hover:bg-white/90 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300">
                Conocer más
              </button>
            </ul> */}
          </section>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <label className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">Sistema de Gestión Completo</h2>
            <p className="text-gray-600 dark:text-gray-100 max-w-2xl mx-auto">
              Nuestra plataforma integra todas las áreas de tu negocio en una sola solución, optimizando procesos y aumentando la productividad.
            </p>
          </label>

          <BentoGrid cols={{ md: 3, lg: 4 }} rows={{ md: 4, lg: 4 }}>
            {/* Historia */}
            <BentoItem
              colSpan={{ sm: 1, md: 3, lg: 3 }}
              rowSpan={{ sm: 1, md: 2, lg: 3 }}
              title="Ahorra tiempo y dinero con nuestra solución integral"
              description="Desde pequeñas empresas hasta grandes corporaciones, nuestro sistema está diseñado para adaptarse a tus necesidades y crecer contigo."
              icon={<HistoryIcon className="size-6 text-primary dark:text-gray-600" />}
              className="bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 px-0 pl-4"
            >
              <article className="float-right -right-4 h-[34dvh] md:w-[70%] rounded-s-full inset-0 bg-[#f2f2f7]">
                <img
                  src="/example.png"
                  className="h-full w-full object-cover rounded-s-lg shadow-md"
                />
              </article>
            </BentoItem>

            {/* Gestión de Compras */}
            <BentoItem
              title="Gestión de Compras"
              description="Controla todo el proceso de compras, desde solicitudes hasta recepción de productos."
              icon={<ShoppingCart className="size-6 text-blue-600" />}
              className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
            >
              <div className="absolute bottom-1 right-4">
                <a href="/proyectos" className="inline-flex hover:underline items-center text-blue-600">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Gestión de Ventas */}
            <BentoItem
              title="Gestión de Ventas"
              description="Optimiza tu proceso de ventas con seguimiento de clientes y análisis de rendimiento."
              icon={<Tag className="size-6 text-green-600" />}
              className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
            >
              <div className="absolute bottom-1 right-4">
                <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Sistema de Subastas */}
            <BentoItem
              title="Sistema de Subastas"
              description="Plataforma completa para gestionar subastas de productos y servicios."
              icon={<Gavel className="size-6 text-yellow-600" />}
              className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
            >
              <div className="absolute bottom-1 right-4">
                <a href="/proyectos" className="inline-flex hover:underline items-center text-yellow-600">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Gestión de Proyectos */}
            <BentoItem
              title="Gestión de Proyectos"
              description="Planifica, ejecuta y monitorea todos tus proyectos en una sola plataforma."
              icon={<CalendarCheck className="size-6 text-purple-600" />}
              className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800"
            >
              <div className="absolute bottom-1 right-4">
                <a href="/proyectos" className="inline-flex hover:underline items-center text-purple-600">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Gestión de Empleados */}
            <BentoItem
              title="Gestión de Empleados"
              description="Administra toda la información de tus colaboradores de forma centralizada."
              icon={<Users className="size-6 text-red-600" />}
              className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
            >
              <div className="absolute bottom-1 right-4">
                <a href="/proyectos" className="inline-flex hover:underline items-center text-red-600">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Gestión de Nómina */}
            <BentoItem
              title="Gestión de Nómina"
              description="Calcula y gestiona nóminas de forma automatizada y precisa."
              icon={<Wallet className="size-6 text-cyan-600" />}
              className="bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800"
            >
              <div className="absolute bottom-1 right-4">
                <a href="/proyectos" className="inline-flex hover:underline items-center text-cyan-600">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>
          </BentoGrid>

        </div>
      </section >
      {/* Benefits Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto" >
        <label className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">Beneficios Clave</h2>
          <p className="text-gray-600 dark:text-gray-100 max-w-2xl mx-auto">
            Descubre cómo nuestro sistema puede transformar la gestión de tu empresa
          </p>
        </label>
        <BentoGrid cols={{ sm: 1, md: 1, lg: 3 }} rows={{ sm: 1, md: 1, lg: 1 }}>
          <BentoItem
            title="Eficiencia Operativa"
            description="Automatiza procesos manuales y reduce tiempos de ejecución en todas las áreas de tu negocio."
            icon={<Zap className="size-6 text-blue-600" />}
            className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
          />

          <BentoItem
            title="Toma de Decisiones"
            description="Accede a reportes en tiempo real y dashboards personalizados para una mejor toma de decisiones."
            icon={<ChartCandlestick className="size-6 text-emerald-600" />}
            className="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"
          />
          <BentoItem
            title="Seguridad de Datos"
            description="Protege la información de tu empresa con nuestro sistema de seguridad de última generación."
            icon={<Lock className="size-6 text-indigo-600" />}
            className="bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800"
          />
        </BentoGrid>
      </section >

      {/* CTA Section */}
      {/* <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para transformar tu empresa?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Descubre cómo nuestro sistema integral puede optimizar todos los procesos de tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105">
              Solicitar Demo Gratis
            </button>
            <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300">
              Ver Planes y Precios
            </button>
          </div>
        </div>
      </section> */}
      <Footer />
    </>
  );
}