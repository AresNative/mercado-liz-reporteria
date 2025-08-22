"use client"

import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import { motion } from "framer-motion"
import { Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createMember, updateMemberData, type Member } from "@/lib/features/members/membersSlice"
import type { AppDispatch } from "@/lib/store"

interface MemberFormProps {
  member?: Member
  onClose: () => void
  onSuccess?: () => void
}

interface MemberFormData {
  name: string
  email: string
  phone: string
  membershipType: string
  status: "active" | "inactive" | "suspended"
  emergencyContactName: string
  emergencyContactPhone: string
  medicalInfo?: string
  birthDate?: string
  address?: string
}

export function MemberForm({ member, onClose, onSuccess }: MemberFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const isEditing = !!member

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    defaultValues: member
      ? {
          name: member.name,
          email: member.email,
          phone: member.phone,
          membershipType: member.membershipType,
          status: member.status,
          emergencyContactName: member.emergencyContact.name,
          emergencyContactPhone: member.emergencyContact.phone,
          medicalInfo: member.medicalInfo || "",
          birthDate: member.birthDate || "",
          address: member.address || "",
        }
      : {
          status: "active",
          membershipType: "basic",
        },
  })

  const onSubmit = async (data: MemberFormData) => {
    try {
      const memberData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        membershipType: data.membershipType,
        status: data.status,
        emergencyContact: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
        },
        medicalInfo: data.medicalInfo,
        birthDate: data.birthDate,
        address: data.address,
        joinDate: member?.joinDate || new Date().toISOString(),
        paymentStatus: member?.paymentStatus || ("paid" as const),
        nextPaymentDate: member?.nextPaymentDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      if (isEditing) {
        await dispatch(updateMemberData({ ...memberData, id: member.id }))
      } else {
        await dispatch(createMember(memberData))
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Error saving member:", error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{isEditing ? "Editar Miembro" : "Nuevo Miembro"}</CardTitle>
              <CardDescription>
                {isEditing ? "Actualiza la información del miembro" : "Agrega un nuevo miembro al gimnasio"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "El nombre es requerido" })}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "El email es requerido",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email inválido",
                      },
                    })}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    {...register("phone", { required: "El teléfono es requerido" })}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input id="birthDate" type="date" {...register("birthDate")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" {...register("address")} />
              </div>
            </div>

            {/* Membership Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información de Membresía</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="membershipType">Tipo de Membresía</Label>
                  <Select onValueChange={(value) => setValue("membershipType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Plan Básico</SelectItem>
                      <SelectItem value="premium">Plan Premium</SelectItem>
                      <SelectItem value="vip">Plan VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select onValueChange={(value) => setValue("status", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="suspended">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Nombre *</Label>
                  <Input
                    id="emergencyContactName"
                    {...register("emergencyContactName", { required: "El contacto de emergencia es requerido" })}
                    className={errors.emergencyContactName ? "border-destructive" : ""}
                  />
                  {errors.emergencyContactName && (
                    <p className="text-sm text-destructive">{errors.emergencyContactName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Teléfono *</Label>
                  <Input
                    id="emergencyContactPhone"
                    {...register("emergencyContactPhone", { required: "El teléfono de emergencia es requerido" })}
                    className={errors.emergencyContactPhone ? "border-destructive" : ""}
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-sm text-destructive">{errors.emergencyContactPhone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Médica</h3>
              <div className="space-y-2">
                <Label htmlFor="medicalInfo">Condiciones médicas, alergias, medicamentos, etc.</Label>
                <Textarea
                  id="medicalInfo"
                  {...register("medicalInfo")}
                  placeholder="Información médica relevante..."
                  rows={3}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEditing ? "Actualizar" : "Crear"} Miembro
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
