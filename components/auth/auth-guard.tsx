"use client"

import type React from "react"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { checkAuthState } from "@/lib/features/auth/authSlice"
import type { AppDispatch, RootState } from "@/lib/store"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "trainer" | "member"
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { user, role, loading, isAuthenticated } = useSelector((state: RootState) => state.auth)

  /* useEffect(() => {
    dispatch(checkAuthState())
  }, [dispatch]) */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || <div>No autorizado</div>
  }

  if (requiredRole && role !== requiredRole && role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
