"use client"

import { Navbar } from "@/components/layout/navbar"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PlansManagement } from "@/components/plans/plans-management"

export default function PlansPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <PlansManagement />
        </main>
      </div>
    </AuthGuard>
  )
}
