export default function Footer() {
    return (
        <footer className="py-12 px-4 bg-gray-800 text-gray-300">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Solucion Integral</h3>
                        <p className="mb-4">
                            Soluciones empresariales para optimizar todos los procesos de tu negocio.
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://www.facebook.com/MercadoLizGuardado/?locale=es_LA" target="_blank" className="text-gray-400 hover:text-white">
                                <span className="sr-only">Facebook</span>
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <a href="https://www.linkedin.com/company/mercado-liz/about/" target="_blank" className="text-gray-400 hover:text-white">
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
                            {/*  <li><a href="#" className="hover:text-white transition-colors">Gestión de Nómina</a></li> */}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Recursos</h3>
                        <ul className="space-y-2">
                            <li><a href="/informacion" className="hover:text-white transition-colors" target="_blank">Blog</a></li>
                            <li><a href="https://api.mercadosliz.com:5231" className="hover:text-white transition-colors" target="_blank">API</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Contacto</h3>
                        <address className="not-italic">
                            <p className="mb-2">Calle Principal 216, 22750</p>
                            <p className="mb-2">Francisco Zarco,B.C</p>
                            <p className="mb-2">ventas@mercadosliz.com</p>
                            <p>+52 (646) 155 2258</p>
                        </address>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-12 pt-8 text-center">
                    <p>&copy; {new Date().getFullYear()} {process.env.NEXT_CLIENT_NAME}. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}