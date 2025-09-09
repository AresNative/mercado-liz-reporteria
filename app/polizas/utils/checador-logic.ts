export interface RegistroTiempo {
  id: string;
  empleado_id: string;
  nombre: string;
  sucursal: string;
  tipo: "entrada" | "salida" | "traslado";
  fecha: string;
  hora: string;
  timestamp: number;
}

export class CheckadorService {
  private static STORAGE_KEY = "registros_tiempo";

  static obtenerRegistros(): RegistroTiempo[] {
    if (typeof window === "undefined") return [];
    const registros = localStorage.getItem(this.STORAGE_KEY);
    return registros ? JSON.parse(registros) : [];
  }

  static guardarRegistro(registro: RegistroTiempo): void {
    if (typeof window === "undefined") return;
    const registros = this.obtenerRegistros();
    registros.push(registro);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(registros));
  }

  static obtenerUltimoRegistro(empleadoId: string): RegistroTiempo | null {
    const registros = this.obtenerRegistros();
    const registrosEmpleado = registros
      .filter((r) => r.empleado_id === empleadoId)
      .sort((a, b) => b.timestamp - a.timestamp);

    return registrosEmpleado.length > 0 ? registrosEmpleado[0] : null;
  }

  static determinarTipoRegistro(
    empleadoId: string,
    sucursalActual: string
  ): {
    tipo: "entrada" | "salida" | "traslado";
    mensaje: string;
  } {
    const ultimoRegistro = this.obtenerUltimoRegistro(empleadoId);

    if (!ultimoRegistro) {
      return {
        tipo: "entrada",
        mensaje: "Primera entrada del día",
      };
    }

    // Si el último registro fue una salida, el siguiente debe ser entrada
    if (ultimoRegistro.tipo === "salida") {
      return {
        tipo: "entrada",
        mensaje: "Entrada después de salida",
      };
    }

    // Si el último registro fue entrada en la misma sucursal, debe ser salida
    if (
      ultimoRegistro.tipo === "entrada" &&
      ultimoRegistro.sucursal === sucursalActual
    ) {
      return {
        tipo: "salida",
        mensaje: "Salida de la sucursal actual",
      };
    }

    // Si el último registro fue entrada en diferente sucursal, es traslado
    if (
      ultimoRegistro.tipo === "entrada" &&
      ultimoRegistro.sucursal !== sucursalActual
    ) {
      return {
        tipo: "traslado",
        mensaje: `Traslado desde ${ultimoRegistro.sucursal} a ${sucursalActual}`,
      };
    }

    // Si el último registro fue traslado, el siguiente debe ser salida
    if (ultimoRegistro.tipo === "traslado") {
      return {
        tipo: "salida",
        mensaje: "Salida después de traslado",
      };
    }

    return {
      tipo: "entrada",
      mensaje: "Entrada por defecto",
    };
  }

  static registrarTiempo(
    empleadoId: string,
    nombre: string,
    sucursal: string
  ): RegistroTiempo {
    const { tipo, mensaje } = this.determinarTipoRegistro(empleadoId, sucursal);
    const ahora = new Date();

    const registro: RegistroTiempo = {
      id: `${empleadoId}_${Date.now()}`,
      empleado_id: empleadoId,
      nombre,
      sucursal,
      tipo,
      fecha: ahora.toLocaleDateString("es-ES"),
      hora: ahora.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: Date.now(),
    };

    this.guardarRegistro(registro);
    return registro;
  }

  static obtenerRegistrosRecientes(limite = 10): RegistroTiempo[] {
    return this.obtenerRegistros()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limite);
  }
}
