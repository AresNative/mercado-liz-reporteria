// features/actividad-proyectos/config.ts
import { Field } from "@/utils/types/interfaces";
import {
  FileText,
  Calendar,
  DollarSign,
  Users,
  User,
  Briefcase,
  Clock,
} from "lucide-react";

export const TABLAS = {
  actividad: "actividad_diaria",
  solicitudes: "solicitud_proyectos",
} as const;

export const MINUTOS_OPTIONS = [
  { value: "0", label: "00 min" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
];

// ─── Formulario de actividad ──────────────────────────────────────────────
export const formConfigActividad = (
  proyectosOptions: { value: string; label: string }[] = [],
  loading = false
): Field[] => [
    {
      type: "Flex",
      require: false,
      elements: [
        {
          type: "SEARCH",
          name: "proyecto",
          label: "Proyecto (selecciona o escribe uno nuevo)",
          icon: <Briefcase className="h-4 w-4" />,
          placeholder: loading
            ? "Cargando proyectos..."
            : "Busca o escribe el nombre del proyecto",
          options: proyectosOptions,
          saveData: true,
          require: false,
        },
        {
          type: "INPUT",
          name: "tarea",
          label: "Tarea",
          icon: <FileText className="h-4 w-4" />,
          placeholder: "Descripción corta de la tarea",
          require: true,
        },
      ],
    },
    {
      type: "TEXT_AREA",
      name: "descripcion",
      label: "Descripción detallada",
      placeholder: "Explica lo que hiciste...",
      minLength: 10,
      maxLength: 500,
      require: true,
    },
    {
      type: "Flex",
      require: false,
      elements: [
        {
          type: "DATE",
          name: "fecha",
          label: "Fecha",
          icon: <Calendar className="h-4 w-4" />,
          require: true,
        },
        {
          type: "NUMBER",
          name: "horas",
          label: "Horas completas",
          icon: <Clock className="h-4 w-4" />,
          placeholder: "Ej: 2",
          require: true,
          minLength: 0,
        },
        {
          type: "NUMBER",
          name: "minutos",
          label: "Minutos adicionales",
          icon: <Clock className="h-4 w-4" />,
          options: MINUTOS_OPTIONS,
          valueDefined: "0",
          placeholder: "00 min",
          require: false,
          minLength: 0,
        },
      ],
    },
    {
      type: "INPUT",
      name: "responsable",
      label: "Responsable (tu nombre)",
      icon: <User className="h-4 w-4" />,
      placeholder: "Nombre del desarrollador",
      require: true,
    },
  ];

// ─── Formulario de solicitud ──────────────────────────────────────────────
export const formConfigSolicitud: Field[] = [
  {
    type: "INPUT",
    name: "nombre",
    label: "Nombre del proyecto",
    icon: <FileText className="h-4 w-4" />,
    placeholder: "Título del proyecto",
    require: true,
  },
  {
    type: "TEXT_AREA",
    name: "descripcion",
    label: "Descripción",
    placeholder: "Explica de qué trata el proyecto",
    require: true,
  },
  {
    type: "TEXT_AREA",
    name: "justificacion",
    label: "Justificación",
    placeholder: "¿Por qué es necesario?",
    require: true,
  },
  {
    type: "Flex",
    require: false,
    elements: [
      {
        type: "DATE",
        name: "fecha_inicio",
        label: "Fecha estimada de inicio",
        icon: <Calendar className="h-4 w-4" />,
        require: true,
      },
      {
        type: "DATE",
        name: "fecha_fin",
        label: "Fecha estimada de fin",
        icon: <Calendar className="h-4 w-4" />,
        require: true,
      },
    ],
  },
  {
    type: "Flex",
    require: false,
    elements: [
      {
        type: "NUMBER",
        name: "presupuesto",
        label: "Presupuesto estimado (MXN)",
        icon: <DollarSign className="h-4 w-4" />,
        placeholder: "Ej: 100000",
        require: false,
        minLength: 0,
      },
      {
        type: "INPUT",
        name: "recursos",
        label: "Recursos necesarios",
        icon: <Users className="h-4 w-4" />,
        placeholder: "Ej: 2 desarrolladores, 1 diseñador",
        require: false,
      },
    ],
  },
];

// ─── Columnas visibles ──────────────────────────────────────────────────────
export const columnConfigActividad: Record<string, boolean> = {
  id: true,
  proyecto: true,
  tarea: true,
  descripcion: true,
  fecha: true,
  tiempo: true, // columna calculada
  responsable: true,
  horas: false,
  minutos: false,
  fecha_creacion: false,
};

export const columnConfigSolicitud: Record<string, boolean> = {
  id: true,
  nombre: true,
  descripcion: true,
  justificacion: true,
  fecha_inicio: true,
  fecha_fin: true,
  tiempo_restante: true,
  presupuesto: true,
  recursos: true,
  estado: true,
  solicitante: true,
  fecha_creacion: false,
};

// ─── Filtros (mejorados) ──────────────────────────────────────────────────
export const filtrosActividad = (
  proyectosOptions: { value: string; label: string }[] = []
): Field[] => [
    {
      type: "Flex",
      require: false,
      elements: [
        {
          type: "DATE_RANGE",
          name: "fecha",
          label: "Rango de fechas",
          icon: <Calendar className="h-4 w-4" />,
          require: false,
        },
        {
          type: "SELECT",
          name: "proyecto",
          label: "Proyecto",
          icon: <Briefcase className="h-4 w-4" />,
          options: proyectosOptions,
          require: false,
        },
        {
          type: "INPUT",
          name: "responsable",
          label: "Responsable",
          icon: <User className="h-4 w-4" />,
          placeholder: "Nombre del responsable",
          require: false,
        },
      ],
    },
  ];

export const filtrosSolicitud = [
  {
    type: "Flex",
    require: false,
    elements: [
      {
        type: "DATE_RANGE",
        name: "fecha",
        label: "Rango de fechas",
        icon: <Calendar className="h-4 w-4" />,
        require: false,
      },
      {
        type: "SELECT",
        name: "estado",
        label: "Estado",
        options: [
          { value: "pendiente", label: "Pendiente" },
          { value: "aprobado", label: "Aprobado" },
          { value: "rechazado", label: "Rechazado" },
        ],
        require: false,
      },
    ],
  },
];