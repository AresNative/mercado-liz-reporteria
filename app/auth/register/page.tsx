"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import Link from "next/link"
import { motion } from "framer-motion"
import { Activity } from "lucide-react"
import { RegisterForm } from "@/components/auth/register-form"
import { Button } from "@/components/ui/button"
import type { RootState } from "@/lib/store"

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">GymPro</h1>
          <p className="text-muted-foreground">Sistema de Gestión</p>
        </motion.div>

        <RegisterForm />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login">
              <Button variant="link" className="p-0 h-auto font-medium text-primary">
                Inicia sesión aquí
              </Button>
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
