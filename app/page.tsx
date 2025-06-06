// app/page.jsx
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import {
  HistoryIcon,
  ArrowRightIcon,
  ShoppingCart,
  Tag,
  Gavel,
  CalendarCheck,
  Users,
  Wallet,
} from "lucide-react";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <header className="text-center bg-[url(/merc1.jpg)] bg-cover text-green-800 bg-no-repeat bg-center relative">
        <div className="py-40 px-4 bg-gradient-to-b from-gray-50/45 to-white">
          <section className="max-w-6xl mx-auto ">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Gestión Empresarial Integral</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              La solución todo en uno para gestionar compras, ventas, subastas, proyectos, empleados y nómina
            </p>
            <ul className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <button className="bg-white cursor-pointer text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105">
                Solicitar Demo
              </button>
              <button className="bg-transparent cursor-pointer border-2 border-green-800 hover:bg-white/10 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300">
                Conocer más
              </button>
            </ul>
          </section>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Sistema de Gestión Completo</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nuestra plataforma integra todas las áreas de tu negocio en una sola solución, optimizando procesos y aumentando la productividad.
            </p>
          </div>

          <BentoGrid>
            {/* Historia - Ocupa 3 filas y 2 columnas */}
            <BentoItem
              rowSpan={3}
              colSpan={2}
              title="Nuestra historia"
              className="px-0 pl-4"
              description="Conoce cómo empezó nuestra historia y cómo hemos crecido para servirte mejor..."
              icon={<HistoryIcon className="h-6 w-6 text-primary" />}
            >
              <div className="relative h-[32vh]">
                <div className="float-right -right-4 h-[30vh] md:w-[70%] rounded-s-full inset-0 bg-[#f2f2f7]">
                  <img src="/historia.png" className="h-full w-full object-cover rounded-s-lg shadow-md" />
                </div>
                <a href="/historia" className="absolute bottom-0 m-4 inline-flex items-center text-purple-600">
                  Ver más <ArrowRightIcon />
                </a>
              </div>
            </BentoItem>

            {/* Gestión de Compras */}
            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Gestión de Compras"
              description="Controla todo el proceso de compras, desde solicitudes hasta recepción de productos."
              icon={<ShoppingCart className="h-6 w-6 text-blue-500" />}
              className="bg-blue-50"
            >
              <div className="absolute bottom-4 right-4">
                <a href="/compras" className="inline-flex items-center text-blue-600 font-medium">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Gestión de Ventas */}
            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Gestión de Ventas"
              description="Optimiza tu proceso de ventas con seguimiento de clientes y análisis de rendimiento."
              icon={<Tag className="h-6 w-6 text-green-500" />}
              className="bg-green-50"
            >
              <div className="absolute bottom-4 right-4">
                <a href="/ventas" className="inline-flex items-center text-green-600 font-medium">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Sistema de Subastas */}
            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Sistema de Subastas"
              description="Plataforma completa para gestionar subastas de productos y servicios."
              icon={<Gavel className="h-6 w-6 text-yellow-500" />}
              className="bg-yellow-50"
            >
              <div className="absolute bottom-4 right-4">
                <a href="/subastas" className="inline-flex items-center text-yellow-600 font-medium">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Gestión de Proyectos */}
            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Gestión de Proyectos"
              description="Planifica, ejecuta y monitorea todos tus proyectos en una sola plataforma."
              icon={<CalendarCheck className="h-6 w-6 text-purple-500" />}
              className="bg-purple-50"
            >
              <div className="absolute bottom-4 right-4">
                <a href="/proyectos" className="inline-flex items-center text-purple-600 font-medium">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Gestión de Empleados */}
            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Gestión de Empleados"
              description="Administra toda la información de tus colaboradores de forma centralizada."
              icon={<Users className="h-6 w-6 text-red-500" />}
              className="bg-red-50"
            >
              <div className="absolute bottom-4 right-4">
                <a href="/empleados" className="inline-flex items-center text-red-600 font-medium">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>

            {/* Gestión de Nómina */}
            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Gestión de Nómina"
              description="Calcula y gestiona nóminas de forma automatizada y precisa."
              icon={<Wallet className="h-6 w-6 text-cyan-500" />}
              className="bg-cyan-50"
            >
              <div className="absolute bottom-4 right-4">
                <a href="/nomina" className="inline-flex items-center text-cyan-600 font-medium">
                  Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </BentoItem>
          </BentoGrid>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Beneficios Clave</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descubre cómo nuestro sistema puede transformar la gestión de tu empresa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Eficiencia Operativa</h3>
              <p className="text-gray-600">
                Automatiza procesos manuales y reduce tiempos de ejecución en todas las áreas de tu negocio.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Toma de Decisiones</h3>
              <p className="text-gray-600">
                Accede a reportes en tiempo real y dashboards personalizados para una mejor toma de decisiones.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Seguridad de Datos</h3>
              <p className="text-gray-600">
                Protege la información de tu empresa con nuestro sistema de seguridad de última generación.
              </p>
            </div>
          </div>
        </div>
      </section>

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

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-800 text-gray-300">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Gestión Integral</h3>
              <p className="mb-4">
                Soluciones empresariales para optimizar todos los procesos de tu negocio.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Soluciones</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Gestión de Compras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gestión de Ventas</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sistema de Subastas</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gestión de Proyectos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gestión de Empleados</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gestión de Nómina</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guías</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Contacto</h3>
              <address className="not-italic">
                <p className="mb-2">Av. Principal 1234</p>
                <p className="mb-2">Ciudad, País</p>
                <p className="mb-2">info@empresa.com</p>
                <p>+1 (123) 456-7890</p>
              </address>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} Gestión Integral. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}