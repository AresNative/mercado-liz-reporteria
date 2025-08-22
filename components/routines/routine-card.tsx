"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { motion } from "framer-motion"
import { Edit, Trash2, Clock, Target, User, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteRoutineData, type Routine } from "@/lib/features/routines/routinesSlice"
import type { AppDispatch } from "@/lib/store"

interface RoutineCardProps {
  routine: Routine
  onEdit: (routine: Routine) => void
}

export function RoutineCard({ routine, onEdit }: RoutineCardProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await dispatch(deleteRoutineData(routine.id))
    } catch (error) {
      console.error("Error deleting routine:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "Principiante"
      case "intermediate":
        return "Intermedio"
      case "advanced":
        return "Avanzado"
      default:
        return difficulty
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`hover:shadow-lg transition-shadow ${!routine.isActive ? "opacity-60" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{routine.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{routine.description}</p>
            </div>
            <div className="flex space-x-1 ml-4">
              <Button variant="ghost" size="sm" onClick={() => onEdit(routine)}>
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar rutina?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente la rutina "{routine.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={getDifficultyColor(routine.difficulty)}>{getDifficultyLabel(routine.difficulty)}</Badge>
            <Badge variant={routine.isActive ? "default" : "secondary"}>
              {routine.isActive ? "Activa" : "Inactiva"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              <User className="w-4 h-4 mr-2" />
              {routine.memberName}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Target className="w-4 h-4 mr-2" />
              {routine.exercises.length} ejercicios
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />~{routine.estimatedDuration} min
            </div>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(routine.createdAt).toLocaleDateString()}
            </div>
          </div>

          {routine.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {routine.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {routine.exercises.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Ejercicios principales:</p>
              <div className="space-y-1">
                {routine.exercises.slice(0, 3).map((exercise) => (
                  <div key={exercise.id} className="text-xs text-muted-foreground">
                    • {exercise.name} - {exercise.sets}x{exercise.reps}
                    {exercise.weight && ` (${exercise.weight}kg)`}
                  </div>
                ))}
                {routine.exercises.length > 3 && (
                  <div className="text-xs text-muted-foreground">... y {routine.exercises.length - 3} más</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
