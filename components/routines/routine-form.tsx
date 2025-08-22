"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useSelector, useDispatch } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { Save, X, Plus, Edit, Trash2, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ExerciseForm } from "./exercise-form"
import { fetchMembers } from "@/lib/features/members/membersSlice"
import { createRoutine, updateRoutineData, type Routine, type Exercise } from "@/lib/features/routines/routinesSlice"
import type { AppDispatch, RootState } from "@/lib/store"

interface RoutineFormProps {
  routine?: Routine
  onClose: () => void
  onSuccess?: () => void
}

interface RoutineFormData {
  name: string
  description: string
  memberId: string
  difficulty: "beginner" | "intermediate" | "advanced"
  tags: string
}

export function RoutineForm({ routine, onClose, onSuccess }: RoutineFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { members } = useSelector((state: RootState) => state.members)
  const { user } = useSelector((state: RootState) => state.auth)
  const [exercises, setExercises] = useState<Exercise[]>(routine?.exercises || [])
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RoutineFormData>({
    defaultValues: routine
      ? {
          name: routine.name,
          description: routine.description,
          memberId: routine.memberId,
          difficulty: routine.difficulty,
          tags: routine.tags.join(", "),
        }
      : {
          difficulty: "beginner",
        },
  })

  useEffect(() => {
    dispatch(fetchMembers())
  }, [dispatch])

  const calculateEstimatedDuration = () => {
    return exercises.reduce((total, exercise) => {
      const exerciseTime = exercise.sets * (exercise.reps * 3 + exercise.restTime) // 3 seconds per rep estimate
      const cardioTime = exercise.duration || 0
      return total + Math.max(exerciseTime / 60, cardioTime) // convert to minutes
    }, 0)
  }

  const handleAddExercise = () => {
    setEditingExercise(null)
    setShowExerciseForm(true)
  }

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setShowExerciseForm(true)
  }

  const handleSaveExercise = (exercise: Exercise) => {
    if (editingExercise) {
      setExercises(exercises.map((e) => (e.id === exercise.id ? exercise : e)))
    } else {
      setExercises([...exercises, exercise])
    }
    setShowExerciseForm(false)
    setEditingExercise(null)
  }

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter((e) => e.id !== exerciseId))
  }

  const onSubmit = async (data: RoutineFormData) => {
    try {
      const selectedMember = members.find((m) => m.id === data.memberId)
      const tags = data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const routineData = {
        name: data.name,
        description: data.description,
        memberId: data.memberId,
        memberName: selectedMember?.name || "",
        trainerId: user?.uid || "",
        trainerName: user?.email || "",
        exercises,
        difficulty: data.difficulty,
        estimatedDuration: Math.round(calculateEstimatedDuration()),
        tags,
        isActive: routine?.isActive ?? true,
        createdAt: routine?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (routine) {
        await dispatch(updateRoutineData({ ...routineData, id: routine.id }))
      } else {
        await dispatch(createRoutine(routineData))
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Error saving routine:", error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "strength":
        return "bg-blue-100 text-blue-800"
      case "cardio":
        return "bg-red-100 text-red-800"
      case "flexibility":
        return "bg-purple-100 text-purple-800"
      case "functional":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
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
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{routine ? "Editar Rutina" : "Nueva Rutina"}</CardTitle>
              <CardDescription>
                {routine ? "Modifica la rutina existente" : "Crea una nueva rutina personalizada"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Rutina *</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "El nombre es requerido" })}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberId">Asignar a Miembro *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Dificultad</Label>
                  <Select onValueChange={(value) => setValue("difficulty", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Principiante</SelectItem>
                      <SelectItem value="intermediate">Intermedio</SelectItem>
                      <SelectItem value="advanced">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Etiquetas</Label>
                  <Input
                    id="tags"
                    {...register("tags")}
                    placeholder="fuerza, cardio, pérdida de peso (separadas por comas)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe los objetivos y características de esta rutina..."
                  rows={3}
                />
              </div>
            </div>

            {/* Exercises Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ejercicios ({exercises.length})</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />~{Math.round(calculateEstimatedDuration())} min
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddExercise}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Ejercicio
                  </Button>
                </div>
              </div>

              {exercises.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Target className="w-12 h-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No hay ejercicios</h4>
                    <p className="text-muted-foreground text-center mb-4">
                      Agrega ejercicios para crear una rutina completa
                    </p>
                    <Button type="button" onClick={handleAddExercise}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Primer Ejercicio
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {exercises.map((exercise, index) => (
                      <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                  <h4 className="font-semibold">{exercise.name}</h4>
                                  <Badge className={getCategoryColor(exercise.category)}>{exercise.category}</Badge>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Series:</span>
                                    <span className="ml-1 font-medium">{exercise.sets}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Reps:</span>
                                    <span className="ml-1 font-medium">{exercise.reps}</span>
                                  </div>
                                  {exercise.weight && (
                                    <div>
                                      <span className="text-muted-foreground">Peso:</span>
                                      <span className="ml-1 font-medium">{exercise.weight}kg</span>
                                    </div>
                                  )}
                                  {exercise.duration && (
                                    <div>
                                      <span className="text-muted-foreground">Duración:</span>
                                      <span className="ml-1 font-medium">{exercise.duration}min</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground">Descanso:</span>
                                    <span className="ml-1 font-medium">{exercise.restTime}s</span>
                                  </div>
                                </div>

                                {exercise.muscleGroups.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {exercise.muscleGroups.map((group) => (
                                      <Badge key={group} variant="outline" className="text-xs">
                                        {group}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {exercise.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">{exercise.notes}</p>
                                )}
                              </div>

                              <div className="flex space-x-1 ml-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditExercise(exercise)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteExercise(exercise.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || exercises.length === 0}>
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {routine ? "Actualizar" : "Crear"} Rutina
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Exercise Form Modal */}
      <AnimatePresence>
        {showExerciseForm && (
          <ExerciseForm
            exercise={editingExercise || undefined}
            onSave={handleSaveExercise}
            onClose={() => {
              setShowExerciseForm(false)
              setEditingExercise(null)
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
