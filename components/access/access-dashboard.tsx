"use client"

import { useSelector, useDispatch } from "react-redux"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Clock, TrendingUp, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RootState } from "@/lib/store"
import { updateDailyStats } from "@/lib/features/access/accessSlice"

export default function AccessDashboard() {
  const dispatch = useDispatch()
  const { currentlyInGym, dailyStats, records } = useSelector((state: RootState) => state.access)

  useEffect(() => {
    dispatch(updateDailyStats())
    const interval = setInterval(() => {
      dispatch(updateDailyStats())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [dispatch])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En el Gimnasio</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{dailyStats.currentOccupancy}</div>
              <p className="text-xs text-muted-foreground">miembros activos</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitas Hoy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{dailyStats.totalVisits}</div>
              <p className="text-xs text-muted-foreground">check-ins totales</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hora Pico</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{dailyStats.peakHour}</div>
              <p className="text-xs text-muted-foreground">mayor afluencia</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {records.filter((r) => r.duration).length > 0
                  ? formatDuration(
                      Math.round(
                        records.filter((r) => r.duration).reduce((acc, r) => acc + (r.duration || 0), 0) /
                          records.filter((r) => r.duration).length,
                      ),
                    )
                  : "0h 0m"}
              </div>
              <p className="text-xs text-muted-foreground">duración de sesión</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Currently in Gym */}
      <Card>
        <CardHeader>
          <CardTitle>Miembros en el Gimnasio</CardTitle>
        </CardHeader>
        <CardContent>
          {currentlyInGym.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay miembros en el gimnasio actualmente</p>
          ) : (
            <div className="space-y-2">
              {currentlyInGym.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{record.memberName}</p>
                    <p className="text-sm text-muted-foreground">
                      Entrada: {new Date(record.checkInTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {record.accessMethod.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary">
                      {formatDuration(
                        Math.floor((new Date().getTime() - new Date(record.checkInTime).getTime()) / (1000 * 60)),
                      )}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
