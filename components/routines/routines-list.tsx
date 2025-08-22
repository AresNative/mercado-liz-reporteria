"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Filter, Target, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RoutineCard } from "./routine-card"
import { RoutineForm } from "./routine-form"
import { fetchRoutines, setSearchTerm, setDifficultyFilter, type Routine } from "@/lib/features/routines/routinesSlice"
import type { AppDispatch, RootState } from "@/lib/store"

export function RoutinesList() {
  const dispatch = useDispatch<AppDispatch>()
  const { routines, loading, searchTerm, difficultyFilter } = useSelector((state: RootState) => state.routines)
  const [showForm, setShowForm] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)

  useEffect(() => {
    dispatch(fetchRoutines())
  }, [dispatch])

  const filteredRoutines = routines.filter((routine) => {
    const matchesSearch =
      routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = difficultyFilter === "all" || routine.difficulty === difficultyFilter
    return matchesSearch && matchesDifficulty
  })

  const handleAddRoutine = () => {
    setEditingRoutine(null)
    setShowForm(true)
  }

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingRoutine(null)
  }

  const handleFormSuccess = () => {
    dispatch(fetchRoutines())
  }

  const getDifficultyCount = (difficulty: string) => {
    if (difficulty === "all") return routines.length
    return routines.filter((r) => r.difficulty === difficulty).length
  }

  const getTotalExercises = () => {
    return routines.reduce((total, routine) => total + routine.exercises.length, 0)
  }

  const getAverageDuration = () => {
    if (routines.length === 0) return 0
    return Math.round(routines.reduce((total, routine) => total + routine.estimatedDuration, 0) / routines.length)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rutinas y Ejercicios</h1>
          <p className="text-muted-foreground">Crea y gestiona rutinas personalizadas para tus miembros</p>
        </div>
        <Button onClick={handleAddRoutine}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Rutina
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rutinas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{getDifficultyCount("all")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ejercicios</CardTitle>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getTotalExercises()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{getAverageDuration()} min</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutinas Activas</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{routines.filter((r) => r.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Principiante</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getDifficultyCount("beginner")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intermedio</CardTitle>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getDifficultyCount("intermediate")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avanzado</CardTitle>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getDifficultyCount("advanced")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>Busca y filtra rutinas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, miembro o descripción..."
                  value={searchTerm}
                  onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={difficultyFilter} onValueChange={(value: any) => dispatch(setDifficultyFilter(value))}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las dificultades</SelectItem>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredRoutines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} onEdit={handleEditRoutine} />
          ))}
        </AnimatePresence>
      </div>

      {filteredRoutines.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron rutinas</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || difficultyFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primera rutina"}
            </p>
            {!searchTerm && difficultyFilter === "all" && (
              <Button onClick={handleAddRoutine}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Rutina
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Routine Form Modal */}
      <AnimatePresence>
        {showForm && (
          <RoutineForm routine={editingRoutine || undefined} onClose={handleCloseForm} onSuccess={handleFormSuccess} />
        )}
      </AnimatePresence>
    </div>
  )
}
