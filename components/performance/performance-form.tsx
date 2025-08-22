"use client"
import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPerformanceRecord, type PerformanceRecord } from "@/lib/features/performance/performanceSlice"
import type { AppDispatch, RootState } from "@/lib/store"

interface PerformanceFormProps {
  onClose: () => void
  onSuccess?: () => void
}

interface PerformanceFormData {
  memberId: string
  weight: number
  bodyFat?: number
  muscleMass?: number
  chest?: number
  waist?: number
  hips?: number
  arms?: number
  thighs?: number
  neck?: number
  duration: number
  caloriesBurned: number
  exercisesCompleted: number
  averageHeartRate?: number
  notes?: string
}

export function PerformanceForm({ onClose, onSuccess }: PerformanceFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { members } = useSelector((state: RootState) => state.members)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PerformanceFormData>()

  const onSubmit = async (data: PerformanceFormData) => {
    try {
      const selectedMember = members.find((m) => m.id === data.memberId)

      const recordData: Omit<PerformanceRecord, "id"> = {
        memberId: data.memberId,
        memberName: selectedMember?.name || "",
        date: new Date().toISOString(),
        weight: data.weight,
        bodyFat: data.bodyFat,
        muscleMass: data.muscleMass,
        measurements: {
          chest: data.chest,
          waist: data.waist,
          hips: data.hips,
          arms: data.arms,
          thighs: data.thighs,
          neck: data.neck,
        },
        workoutData: {
          duration: data.duration,
          caloriesBurned: data.caloriesBurned,
          exercisesCompleted: data.exercisesCompleted,
          averageHeartRate: data.averageHeartRate,
        },
        notes: data.notes,
      }

      await dispatch(createPerformanceRecord(recordData))
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Error saving performance record:", error)
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
              <CardTitle>Nuevo Registro de Rendimiento</CardTitle>
              <CardDescription>Registra las métricas de progreso del miembro</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Member Selection */}
            <div className="space-y-2">
              <Label htmlFor="memberId">Miembro *</Label>
              <Select onValueChange={(value) => setValue("memberId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un miembro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.memberId && <p className="text-sm text-destructive">Debes seleccionar un miembro</p>}
            </div>

            {/* Body Composition */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Composición Corporal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    {...register("weight", { required: "El peso es requerido", min: 0 })}
                    className={errors.weight ? "border-destructive" : ""}
                  />
                  {errors.weight && <p className="text-sm text-destructive">{errors.weight.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyFat">Grasa Corporal (%)</Label>
                  <Input id="bodyFat" type="number" step="0.1" min="0" max="100" {...register("bodyFat")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="muscleMass">Masa Muscular (kg)</Label>
                  <Input id="muscleMass" type="number" step="0.1" min="0" {...register("muscleMass")} />
                </div>
              </div>
            </div>

            {/* Body Measurements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Medidas Corporales (cm)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chest">Pecho</Label>
                  <Input id="chest" type="number" step="0.1" min="0" {...register("chest")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waist">Cintura</Label>
                  <Input id="waist" type="number" step="0.1" min="0" {...register("waist")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hips">Caderas</Label>
                  <Input id="hips" type="number" step="0.1" min="0" {...register("hips")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arms">Brazos</Label>
                  <Input id="arms" type="number" step="0.1" min="0" {...register("arms")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thighs">Muslos</Label>
                  <Input id="thighs" type="number" step="0.1" min="0" {...register("thighs")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neck">Cuello</Label>
                  <Input id="neck" type="number" step="0.1" min="0" {...register("neck")} />
                </div>
              </div>
            </div>

            {/* Workout Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datos del Entrenamiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (min) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    {...register("duration", { required: "La duración es requerida", min: 0 })}
                    className={errors.duration ? "border-destructive" : ""}
                  />
                  {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caloriesBurned">Calorías Quemadas *</Label>
                  <Input
                    id="caloriesBurned"
                    type="number"
                    min="0"
                    {...register("caloriesBurned", { required: "Las calorías son requeridas", min: 0 })}
                    className={errors.caloriesBurned ? "border-destructive" : ""}
                  />
                  {errors.caloriesBurned && <p className="text-sm text-destructive">{errors.caloriesBurned.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercisesCompleted">Ejercicios Completados *</Label>
                  <Input
                    id="exercisesCompleted"
                    type="number"
                    min="0"
                    {...register("exercisesCompleted", { required: "Los ejercicios son requeridos", min: 0 })}
                    className={errors.exercisesCompleted ? "border-destructive" : ""}
                  />
                  {errors.exercisesCompleted && (
                    <p className="text-sm text-destructive">{errors.exercisesCompleted.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="averageHeartRate">Frecuencia Cardíaca Promedio</Label>
                  <Input id="averageHeartRate" type="number" min="0" max="220" {...register("averageHeartRate")} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Observaciones, sensaciones, objetivos alcanzados..."
                rows={3}
              />
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
                Guardar Registro
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
