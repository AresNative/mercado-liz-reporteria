"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { Scan, UserCheck, UserX, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { checkIn, checkOut, clearError } from "@/lib/features/access/accessSlice"
import type { RootState } from "@/lib/store"

export default function MemberScanner() {
  const [scannedCode, setScannedCode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const dispatch = useDispatch()
  const { loading, error, currentlyInGym } = useSelector((state: RootState) => state.access)
  const { members } = useSelector((state: RootState) => state.members)

  const handleScan = async () => {
    if (!scannedCode.trim()) return

    setIsScanning(true)
    dispatch(clearError())

    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const member = members.find((m) => m.id === scannedCode || m.membershipNumber === scannedCode)

    if (!member) {
      dispatch({ type: "access/setError", payload: "Miembro no encontrado" })
      setIsScanning(false)
      return
    }

    const isCurrentlyInGym = currentlyInGym.some((record) => record.memberId === member.id)

    if (isCurrentlyInGym) {
      // Check out
      dispatch(checkOut(member.id))
    } else {
      // Check in
      dispatch(
        checkIn({
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          membershipStatus: member.status,
          accessMethod: "qr",
        }),
      )
    }

    setScannedCode("")
    setIsScanning(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Control de Acceso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Input
            placeholder="Escanear código QR o ingresar ID"
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleScan()}
          />
          <Button onClick={handleScan} disabled={!scannedCode.trim() || isScanning} className="w-full">
            {isScanning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Scan className="h-4 w-4 mr-2" />
              </motion.div>
            ) : (
              <Scan className="h-4 w-4 mr-2" />
            )}
            {isScanning ? "Procesando..." : "Escanear"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <UserCheck className="h-4 w-4" />
            <span>Check-in</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <UserX className="h-4 w-4" />
            <span>Check-out</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
