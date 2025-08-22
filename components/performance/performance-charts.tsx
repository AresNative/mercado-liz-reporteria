"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PerformanceRecord } from "@/lib/features/performance/performanceSlice"

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface PerformanceChartsProps {
  records: PerformanceRecord[]
  selectedMemberId?: string
}

export function PerformanceCharts({ records, selectedMemberId }: PerformanceChartsProps) {
  const filteredRecords = useMemo(() => {
    if (!selectedMemberId) return records
    return records.filter((record) => record.memberId === selectedMemberId)
  }, [records, selectedMemberId])

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredRecords])

  // Weight Progress Chart
  const weightChartData = useMemo(() => {
    const data = sortedRecords.map((record) => ({
      x: new Date(record.date).getTime(),
      y: record.weight,
    }))

    return {
      series: [
        {
          name: "Peso (kg)",
          data: data,
        },
      ],
      options: {
        chart: {
          type: "line" as const,
          height: 350,
          toolbar: { show: false },
        },
        stroke: {
          curve: "smooth" as const,
          width: 3,
        },
        colors: ["#0891b2"],
        xaxis: {
          type: "datetime" as const,
          labels: {
            format: "dd/MM",
          },
        },
        yaxis: {
          title: {
            text: "Peso (kg)",
          },
        },
        tooltip: {
          x: {
            format: "dd/MM/yyyy",
          },
        },
        grid: {
          borderColor: "#e5e7eb",
        },
      },
    }
  }, [sortedRecords])

  // Body Composition Chart
  const bodyCompositionData = useMemo(() => {
    const weightData = sortedRecords.map((record) => ({
      x: new Date(record.date).getTime(),
      y: record.weight,
    }))

    const bodyFatData = sortedRecords
      .filter((record) => record.bodyFat)
      .map((record) => ({
        x: new Date(record.date).getTime(),
        y: record.bodyFat,
      }))

    const muscleMassData = sortedRecords
      .filter((record) => record.muscleMass)
      .map((record) => ({
        x: new Date(record.date).getTime(),
        y: record.muscleMass,
      }))

    return {
      series: [
        { name: "Peso (kg)", data: weightData },
        { name: "Grasa Corporal (%)", data: bodyFatData },
        { name: "Masa Muscular (kg)", data: muscleMassData },
      ],
      options: {
        chart: {
          type: "line" as const,
          height: 350,
          toolbar: { show: false },
        },
        stroke: {
          curve: "smooth" as const,
          width: 2,
        },
        colors: ["#0891b2", "#f59e0b", "#10b981"],
        xaxis: {
          type: "datetime" as const,
          labels: {
            format: "dd/MM",
          },
        },
        yaxis: {
          title: {
            text: "Valores",
          },
        },
        tooltip: {
          x: {
            format: "dd/MM/yyyy",
          },
        },
        legend: {
          position: "top" as const,
        },
        grid: {
          borderColor: "#e5e7eb",
        },
      },
    }
  }, [sortedRecords])

  // Measurements Chart
  const measurementsData = useMemo(() => {
    const measurements = ["chest", "waist", "hips", "arms", "thighs"] as const
    const colors = ["#0891b2", "#f59e0b", "#10b981", "#8b5cf6", "#f43f5e"]

    const series = measurements.map((measurement, index) => ({
      name:
        measurement === "chest"
          ? "Pecho"
          : measurement === "waist"
            ? "Cintura"
            : measurement === "hips"
              ? "Caderas"
              : measurement === "arms"
                ? "Brazos"
                : "Muslos",
      data: sortedRecords
        .filter((record) => record.measurements[measurement])
        .map((record) => ({
          x: new Date(record.date).getTime(),
          y: record.measurements[measurement],
        })),
      color: colors[index],
    }))

    return {
      series,
      options: {
        chart: {
          type: "line" as const,
          height: 350,
          toolbar: { show: false },
        },
        stroke: {
          curve: "smooth" as const,
          width: 2,
        },
        colors,
        xaxis: {
          type: "datetime" as const,
          labels: {
            format: "dd/MM",
          },
        },
        yaxis: {
          title: {
            text: "Medidas (cm)",
          },
        },
        tooltip: {
          x: {
            format: "dd/MM/yyyy",
          },
        },
        legend: {
          position: "top" as const,
        },
        grid: {
          borderColor: "#e5e7eb",
        },
      },
    }
  }, [sortedRecords])

  // Workout Performance Chart
  const workoutData = useMemo(() => {
    const caloriesData = sortedRecords.map((record) => ({
      x: new Date(record.date).getTime(),
      y: record.workoutData.caloriesBurned,
    }))

    const durationData = sortedRecords.map((record) => ({
      x: new Date(record.date).getTime(),
      y: record.workoutData.duration,
    }))

    return {
      series: [
        { name: "Calorías Quemadas", data: caloriesData },
        { name: "Duración (min)", data: durationData },
      ],
      options: {
        chart: {
          type: "line" as const,
          height: 350,
          toolbar: { show: false },
        },
        stroke: {
          curve: "smooth" as const,
          width: 2,
        },
        colors: ["#dc2626", "#0891b2"],
        xaxis: {
          type: "datetime" as const,
          labels: {
            format: "dd/MM",
          },
        },
        yaxis: [
          {
            title: {
              text: "Calorías",
            },
            seriesName: "Calorías Quemadas",
          },
          {
            opposite: true,
            title: {
              text: "Duración (min)",
            },
            seriesName: "Duración (min)",
          },
        ],
        tooltip: {
          x: {
            format: "dd/MM/yyyy",
          },
        },
        legend: {
          position: "top" as const,
        },
        grid: {
          borderColor: "#e5e7eb",
        },
      },
    }
  }, [sortedRecords])

  const getProgressIndicator = (current: number, previous: number) => {
    if (!previous) return null
    const change = ((current - previous) / previous) * 100
    const isPositive = change > 0

    return (
      <Badge variant={isPositive ? "default" : "secondary"} className="ml-2">
        {isPositive ? "+" : ""}
        {change.toFixed(1)}%
      </Badge>
    )
  }

  const latestRecord = sortedRecords[sortedRecords.length - 1]
  const previousRecord = sortedRecords[sortedRecords.length - 2]

  if (sortedRecords.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay datos de rendimiento disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {latestRecord && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Peso Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold text-primary">{latestRecord.weight} kg</div>
                {previousRecord && getProgressIndicator(latestRecord.weight, previousRecord.weight)}
              </div>
            </CardContent>
          </Card>

          {latestRecord.bodyFat && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Grasa Corporal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-secondary">{latestRecord.bodyFat}%</div>
                  {previousRecord?.bodyFat && getProgressIndicator(latestRecord.bodyFat, previousRecord.bodyFat)}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Último Entrenamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">{latestRecord.workoutData.caloriesBurned} cal</div>
              <p className="text-xs text-muted-foreground">{latestRecord.workoutData.duration} min</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ejercicios Completados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-4">{latestRecord.workoutData.exercisesCompleted}</div>
              <p className="text-xs text-muted-foreground">Último registro</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progreso de Peso</CardTitle>
            <CardDescription>Evolución del peso corporal a lo largo del tiempo</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart options={weightChartData.options} series={weightChartData.series} type="line" height={350} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composición Corporal</CardTitle>
            <CardDescription>Peso, grasa corporal y masa muscular</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart options={bodyCompositionData.options} series={bodyCompositionData.series} type="line" height={350} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medidas Corporales</CardTitle>
            <CardDescription>Evolución de las medidas corporales</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart options={measurementsData.options} series={measurementsData.series} type="line" height={350} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendimiento de Entrenamientos</CardTitle>
            <CardDescription>Calorías quemadas y duración de entrenamientos</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart options={workoutData.options} series={workoutData.series} type="line" height={350} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
