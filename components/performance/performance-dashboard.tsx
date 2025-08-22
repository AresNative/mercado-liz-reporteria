"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Filter, TrendingUp, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PerformanceForm } from "./performance-form"
import { PerformanceCharts } from "./performance-charts"
import {
  fetchPerformanceRecords,
  fetchExerciseProgress,
  setSelectedMemberId,
  setDateRange,
} from "@/lib/features/performance/performanceSlice"
import { fetchMembers } from "@/lib/features/members/membersSlice"
import type { AppDispatch, RootState } from "@/lib/store"

export function PerformanceDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const { records, loading, selectedMemberId, dateRange } = useSelector((state: RootState) => state.performance)
  const { members } = useSelector((state: RootState) => state.members)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    dispatch(fetchMembers())
    dispatch(fetchPerformanceRecords())
    dispatch(fetchExerciseProgress())
  }, [dispatch])

  useEffect(() => {
    if (selectedMemberId) {
      dispatch(fetchPerformanceRecords(selectedMemberId))
    } else {
      dispatch(fetchPerformanceRecords())
    }
  }, [dispatch, selectedMemberId])

  const handleMemberChange = (memberId: string) => {
    dispatch(setSelectedMemberId(memberId === "all" ? null : memberId))
  }

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    dispatch(
      setDateRange({
        ...dateRange,
        [field]: value,
      }),
    )
  }

  const handleFormSuccess = () => {
    dispatch(fetchPerformanceRecords(selectedMemberId || undefined))
  }

  const filteredRecords = records.filter((record) => {
    const recordDate = new Date(record.date)
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    return recordDate >= startDate && recordDate <= endDate
  })

  const selectedMember = selectedMemberId ? members.find((m) => m.id === selectedMemberId) : null

  const getStatsForPeriod = () => {
    if (filteredRecords.length === 0) return null

    const totalRecords = filteredRecords.length
    const totalMembers = new Set(filteredRecords.map((r) => r.memberId)).size
    const avgCalories = Math.round(
      filteredRecords.reduce((sum, r) => sum + r.workoutData.caloriesBurned, 0) / totalRecords,
    )
    const avgDuration = Math.round(filteredRecords.reduce((sum, r) => sum + r.workoutData.duration, 0) / totalRecords)

    return { totalRecords, totalMembers, avgCalories, avgDuration }
  }

  const stats = getStatsForPeriod()

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
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Rendimiento</h1>
          <p className="text-muted-foreground">
            {selectedMember
              ? `Seguimiento de progreso de ${selectedMember.name}`
              : "Análisis de rendimiento y progreso de miembros"}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Registro
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
          <CardDescription>Personaliza la vista de datos de rendimiento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Miembro</Label>
              <Select value={selectedMemberId || "all"} onValueChange={handleMemberChange}>
                <SelectTrigger>
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los miembros</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full bg-transparent">
                <Calendar className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalRecords}</div>
              <p className="text-xs text-muted-foreground">En el período seleccionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">Con registros de progreso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calorías Promedio</CardTitle>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.avgCalories}</div>
              <p className="text-xs text-muted-foreground">Por entrenamiento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.avgDuration} min</div>
              <p className="text-xs text-muted-foreground">Por entrenamiento</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Charts */}
      <PerformanceCharts records={filteredRecords} selectedMemberId={selectedMemberId} />

      {/* Performance Form Modal */}
      <AnimatePresence>
        {showForm && <PerformanceForm onClose={() => setShowForm(false)} onSuccess={handleFormSuccess} />}
      </AnimatePresence>
    </div>
  )
}
