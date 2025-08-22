"use client"

import { Navbar } from "@/components/layout/navbar"
import { AuthGuard } from "@/components/auth/auth-guard"
import { RoutinesList } from "@/components/routines/routines-list"

export default function RoutinesPage() {
  return (
    <AuthGuard requiredRole="trainer">
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <RoutinesList />
        </main>
      </div>
    </AuthGuard>
  )
}
