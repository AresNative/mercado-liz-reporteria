export default function Footer() {
    const date = new Date().getFullYear();
    return (
        <footer className=" w-full h-16 block bottom-0 border-t px-6 py-3 sm:px-8 bg-white/70 backdrop-blur-lg">
            <div className="flex items-center justify-between flex-wrap gap-y-2 max-w-7xl mx-auto">
                {/* Logo y Derechos */}
                <div className="flex items-center gap-x-2">
                    <img
                        alt="Logo"
                        src="logo.png"
                        className="h-8 w-auto"
                    />
                    <span className="text-sm text-gray-500">
                        © {date} Mercado Liz. Todos los derechos reservados.
                    </span>
                </div>

                {/* Enlaces */}
                <div className="flex items-center gap-x-4">
                    <a href="#" className="text-sm text-gray-500 hover:text-purple-600 transition-colors">
                        Privacy
                    </a>
                    <a href="#" className="text-sm text-gray-500 hover:text-purple-600 transition-colors">
                        Terms
                    </a>
                </div>
            </div>
        </footer>
    );
}