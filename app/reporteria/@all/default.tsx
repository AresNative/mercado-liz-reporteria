export default function DashboardDefault() {
    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm">
            <div className="max-w-md mx-auto text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Selecciona una opción
                </h2>
                <p className="text-gray-600 mb-6">
                    Elige una sección del dashboard para comenzar
                </p>
                <div className="space-y-3">
                    {['Analítica', 'Usuarios', 'Configuración'].map((item) => (
                        <div
                            key={item}
                            className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-not-allowed opacity-60"
                        >
                            <div className="font-medium text-gray-700">{item}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}