"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Save, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Exercise } from "@/lib/features/routines/routinesSlice"
import { exercisesLibrary } from "@/lib/data/exercises-library"

interface ExerciseFormProps {
  exercise?: Exercise
  onSave: (exercise: Exercise) => void
  onClose: () => void
}

interface ExerciseFormData {
  name: string
  sets: number
  reps: number
  weight?: number
  duration?: number
  restTime: number
  notes?: string
  category: "strength" | "cardio" | "flexibility" | "functional"
}

export function ExerciseForm({ exercise, onSave, onClose }: ExerciseFormProps) {
  const [selectedFromLibrary, setSelectedFromLibrary] = useState<string>("")
  const [muscleGroups, setMuscleGroups] = useState<string[]>(exercise?.muscleGroups || [])
  const [newMuscleGroup, setNewMuscleGroup] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormData>({
    defaultValues: exercise
      ? {
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          duration: exercise.duration,
          restTime: exercise.restTime,
          notes: exercise.notes || "",
          category: exercise.category,
        }
      : {
          sets: 3,
          reps: 10,
          restTime: 60,
          category: "strength",
        },
  })

  const category = watch("category")

  const handleLibrarySelection = (exerciseName: string) => {
    const libraryExercise = exercisesLibrary.find((e) => e.name === exerciseName)
    if (libraryExercise) {
      setValue("name", libraryExercise.name)
      setValue("category", libraryExercise.category)
      setMuscleGroups(libraryExercise.muscleGroups)
    }
  }

  const addMuscleGroup = () => {
    if (newMuscleGroup && !muscleGroups.includes(newMuscleGroup)) {
      setMuscleGroups([...muscleGroups, newMuscleGroup])
      setNewMuscleGroup("")
    }
  }

  const removeMuscleGroup = (group: string) => {
    setMuscleGroups(muscleGroups.filter((g) => g !== group))
  }

  const onSubmit = (data: ExerciseFormData) => {
    const exerciseData: Exercise = {
      id: exercise?.id || Date.now().toString(),
      name: data.name,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      duration: data.duration,
      restTime: data.restTime,
      notes: data.notes,
      category: data.category,
      muscleGroups,
    }

    onSave(exerciseData)
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
              <CardTitle>{exercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}</CardTitle>
              <CardDescription>
                {exercise ? "Modifica los detalles del ejercicio" : "Agrega un nuevo ejercicio a la rutina"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Exercise Library Selection */}
            {!exercise && (
              <div className="space-y-2">
                <Label>Seleccionar de la Biblioteca</Label>
                <Select
                  value={selectedFromLibrary}
                  onValueChange={(value) => {
                    setSelectedFromLibrary(value)
                    handleLibrarySelection(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un ejercicio predefinido (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercisesLibrary.map((ex) => (
                      <SelectItem key={ex.name} value={ex.name}>
                        {ex.name} - {ex.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Ejercicio *</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "El nombre es requerido" })}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select onValueChange={(value) => setValue("category", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Fuerza</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibility">Flexibilidad</SelectItem>
                      <SelectItem value="functional">Funcional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Exercise Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parámetros del Ejercicio</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">Series *</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    {...register("sets", { required: "Las series son requeridas", min: 1 })}
                    className={errors.sets ? "border-destructive" : ""}
                  />
                  {errors.sets && <p className="text-sm text-destructive">{errors.sets.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reps">Repeticiones *</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    {...register("reps", { required: "Las repeticiones son requeridas", min: 1 })}
                    className={errors.reps ? "border-destructive" : ""}
                  />
                  {errors.reps && <p className="text-sm text-destructive">{errors.reps.message}</p>}
                </div>

                {category === "strength" && (
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input id="weight" type="number" min="0" step="0.5" {...register("weight")} />
                  </div>
                )}

                {category === "cardio" && (
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (min)</Label>
                    <Input id="duration" type="number" min="1" {...register("duration")} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="restTime">Descanso (seg)</Label>
                  <Input
                    id="restTime"
                    type="number"
                    min="0"
                    {...register("restTime", { required: "El tiempo de descanso es requerido" })}
                    className={errors.restTime ? "border-destructive" : ""}
                  />
                  {errors.restTime && <p className="text-sm text-destructive">{errors.restTime.message}</p>}
                </div>
              </div>
            </div>

            {/* Muscle Groups */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Grupos Musculares</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {muscleGroups.map((group) => (
                  <Badge
                    key={group}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeMuscleGroup(group)}
                  >
                    {group} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar grupo muscular"
                  value={newMuscleGroup}
                  onChange={(e) => setNewMuscleGroup(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMuscleGroup())}
                />
                <Button type="button" variant="outline" onClick={addMuscleGroup}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Instrucciones especiales, técnica, etc."
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
                {exercise ? "Actualizar" : "Agregar"} Ejercicio
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
