"use client"

import { useState } from "react"
import Barcode from "react-barcode"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, QrCode } from "lucide-react"
import type { Member } from "@/lib/features/members/membersSlice"

interface MemberQRCardProps {
  member: Member
}

export default function MemberQRCard({ member }: MemberQRCardProps) {
  const [showQR, setShowQR] = useState(false)

  const downloadQR = () => {
    const canvas = document.querySelector("canvas")
    if (canvas) {
      const link = document.createElement("a")
      link.download = `${member.firstName}-${member.lastName}-qr.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">
          {member.firstName} {member.lastName}
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground">ID: {member.membershipNumber}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {showQR ? (
            <div className="bg-white p-4 rounded-lg">
              <Barcode
                value={member.id}
                width={2}
                height={100}
                fontSize={14}
                background="#ffffff"
                lineColor="#000000"
              />
            </div>
          ) : (
            <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
              <QrCode className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowQR(!showQR)} className="flex-1">
            {showQR ? "Ocultar" : "Mostrar"} QR
          </Button>
          {showQR && (
            <Button variant="outline" size="icon" onClick={downloadQR}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
