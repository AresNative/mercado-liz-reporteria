import { Suspense } from "react"
import AccessDashboard from "@/components/access/access-dashboard"
import MemberScanner from "@/components/access/member-scanner"

export default function AccessPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Control de Acceso</h1>
        <p className="text-muted-foreground">Gestiona las entradas y salidas del gimnasio en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Suspense fallback={<div>Cargando scanner...</div>}>
            <MemberScanner />
          </Suspense>
        </div>

        <div className="lg:col-span-2">
          <Suspense fallback={<div>Cargando dashboard...</div>}>
            <AccessDashboard />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
