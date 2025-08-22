"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, CreditCard, Activity, Calendar, Clock, Scan } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { AuthGuard } from "@/components/auth/auth-guard"
import { LoginForm } from "@/components/auth/login-form"
import { checkAuthState } from "@/lib/features/auth/authSlice"
import type { AppDispatch } from "@/lib/store"

function DashboardContent() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">1,234</div>
              <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">$45,231</div>
              <p className="text-xs text-muted-foreground">+8% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrenamientos Hoy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">89</div>
              <p className="text-xs text-muted-foreground">+5% desde ayer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En el Gimnasio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">23</div>
              <p className="text-xs text-muted-foreground">Miembros actualmente</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/members")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Gestión de Miembros
              </CardTitle>
              <CardDescription>Administrar miembros, planes y pagos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Acceder</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/routines")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-secondary" />
                Rutinas y Entrenamientos
              </CardTitle>
              <CardDescription>Crear y asignar rutinas personalizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">
                Acceder
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/performance")}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-chart-3" />
                Dashboard de Rendimiento
              </CardTitle>
              <CardDescription>Análisis y seguimiento de progreso</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-transparent" variant="outline">
                Acceder
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/plans")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-chart-4" />
                Planes de Membresía
              </CardTitle>
              <CardDescription>Gestionar planes y precios</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">
                Acceder
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/access")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scan className="w-5 h-5 mr-2 text-accent" />
                Control de Acceso
              </CardTitle>
              <CardDescription>Check-in/out y monitoreo en tiempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-transparent" variant="outline">
                Acceder
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/reports")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-warning" />
                Reportes y Analytics
              </CardTitle>
              <CardDescription>Informes detallados y estadísticas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-transparent" variant="outline">
                Acceder
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo miembro registrado</p>
                  <p className="text-xs text-muted-foreground">María García se unió al Plan Premium</p>
                </div>
                <p className="text-xs text-muted-foreground">Hace 5 min</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pago procesado</p>
                  <p className="text-xs text-muted-foreground">Juan Pérez - Plan Básico renovado</p>
                </div>
                <p className="text-xs text-muted-foreground">Hace 12 min</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Rutina asignada</p>
                  <p className="text-xs text-muted-foreground">Nueva rutina para Ana López</p>
                </div>
                <p className="text-xs text-muted-foreground">Hace 25 min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function AuthFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">GymPro</h1>
          <p className="text-muted-foreground">Sistema de Gestión</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>()

  /* useEffect(() => {
    dispatch(checkAuthState())
  }, [dispatch]) */

  return (
    <AuthGuard fallback={<AuthFallback />}>
      <DashboardContent />
    </AuthGuard>
  )
}
