"use client"

import { Navbar } from "@/components/layout/navbar"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PerformanceDashboard } from "@/components/performance/performance-dashboard"

export default function PerformancePage() {
  return (
    <AuthGuard requiredRole="trainer">
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <PerformanceDashboard />
        </main>
      </div>
    </AuthGuard>
  )
}
