"use client"

import { Navbar } from "@/components/layout/navbar"
import { AuthGuard } from "@/components/auth/auth-guard"
import { MembersList } from "@/components/members/members-list"

export default function MembersPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <MembersList />
        </main>
      </div>
    </AuthGuard>
  )
}
