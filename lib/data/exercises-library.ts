import type { Exercise } from "@/lib/features/routines/routinesSlice"

export const exercisesLibrary: Omit<Exercise, "id" | "sets" | "reps" | "weight" | "duration" | "restTime" | "notes">[] =
  [
    // Strength - Upper Body
    {
      name: "Press de Banca",
      category: "strength",
      muscleGroups: ["pecho", "tríceps", "hombros"],
    },
    {
      name: "Dominadas",
      category: "strength",
      muscleGroups: ["espalda", "bíceps"],
    },
    {
      name: "Press Militar",
      category: "strength",
      muscleGroups: ["hombros", "tríceps"],
    },
    {
      name: "Remo con Barra",
      category: "strength",
      muscleGroups: ["espalda", "bíceps"],
    },
    {
      name: "Curl de Bíceps",
      category: "strength",
      muscleGroups: ["bíceps"],
    },
    {
      name: "Extensiones de Tríceps",
      category: "strength",
      muscleGroups: ["tríceps"],
    },

    // Strength - Lower Body
    {
      name: "Sentadillas",
      category: "strength",
      muscleGroups: ["cuádriceps", "glúteos"],
    },
    {
      name: "Peso Muerto",
      category: "strength",
      muscleGroups: ["isquiotibiales", "glúteos", "espalda baja"],
    },
    {
      name: "Prensa de Piernas",
      category: "strength",
      muscleGroups: ["cuádriceps", "glúteos"],
    },
    {
      name: "Zancadas",
      category: "strength",
      muscleGroups: ["cuádriceps", "glúteos"],
    },
    {
      name: "Elevaciones de Gemelos",
      category: "strength",
      muscleGroups: ["gemelos"],
    },

    // Cardio
    {
      name: "Cinta de Correr",
      category: "cardio",
      muscleGroups: ["piernas", "cardiovascular"],
    },
    {
      name: "Bicicleta Estática",
      category: "cardio",
      muscleGroups: ["piernas", "cardiovascular"],
    },
    {
      name: "Elíptica",
      category: "cardio",
      muscleGroups: ["cuerpo completo", "cardiovascular"],
    },
    {
      name: "Remo",
      category: "cardio",
      muscleGroups: ["cuerpo completo", "cardiovascular"],
    },
    {
      name: "Burpees",
      category: "cardio",
      muscleGroups: ["cuerpo completo", "cardiovascular"],
    },

    // Functional
    {
      name: "Plancha",
      category: "functional",
      muscleGroups: ["core", "hombros"],
    },
    {
      name: "Mountain Climbers",
      category: "functional",
      muscleGroups: ["core", "cardiovascular"],
    },
    {
      name: "Kettlebell Swings",
      category: "functional",
      muscleGroups: ["glúteos", "core", "hombros"],
    },
    {
      name: "Box Jumps",
      category: "functional",
      muscleGroups: ["piernas", "cardiovascular"],
    },

    // Flexibility
    {
      name: "Estiramiento de Cuádriceps",
      category: "flexibility",
      muscleGroups: ["cuádriceps"],
    },
    {
      name: "Estiramiento de Isquiotibiales",
      category: "flexibility",
      muscleGroups: ["isquiotibiales"],
    },
    {
      name: "Estiramiento de Hombros",
      category: "flexibility",
      muscleGroups: ["hombros"],
    },
    {
      name: "Yoga - Perro Boca Abajo",
      category: "flexibility",
      muscleGroups: ["cuerpo completo"],
    },
  ]
