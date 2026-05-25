# Sistema de Administración Interna

Plataforma integral para la gestión operativa y administrativa de la organización. Proporciona herramientas centralizadas para el control de usuarios, procesos y datos críticos del negocio.

## Variables de entorno

Para que el proyecto funcione correctamente, crea un archivo `.env` en la raíz del mismo y agrega las siguientes variables de entorno:

### Configuración del cliente

```
NEXT_CLIENT_NAME=Mercados Mejia
```

- nombre de la empresa obligatorio para la generacion de ordenes de compra

### Configuración de entorno

```
NEXT_PUBLIC_MODE=production
```

### Endpoints de API

```
NEXT_PUBLIC_API_URL=https://api.mercadosliz.com:5231/api/
NEXT_PUBLIC_HUBS_URL=https://api.mercadosliz.com:5231/
NEXT_PUBLIC_API_URL_INT=https://mercadosmejia.intelisiscloud.com:4206/api
```

### Desarrollo y pruebas

```
NEXT_TEST_API_URL=http://localhost:5230/api/v1/
```

### Configuración de Twilio (WhatsApp)

```
TWILIO_ACCOUNT_SID=AC3b3b1eee294255c10a07e080d4fa9fe5
TWILIO_AUTH_TOKEN=44b8f08f734cc6c9ee0703b496d2e8a4
TWILIO_WHATSAPP_NUMBER=+14155238886
```

## ⚠️ Notas importantes

1. **Seguridad**: Nunca subas el archivo `.env` al control de versiones. Asegúrate de agregarlo a `.gitignore`.
2. **Credenciales**: Las credenciales de Twilio proporcionadas son de ejemplo. Reemplázalas con tus credenciales reales en producción.
3. **Ambientes**: Considera usar diferentes archivos (`.env.local`, `.env.production`) para desarrollo y producción.
4. **Puertos**: Verifica que los puertos especificados (5231, 4206, 5230) estén accesibles según el entorno.

## Deployment

Para ejecutar el proyecto son necesarios los siguientes pasos...

- Clonar

```bash
  git clone https://github.com/Mercados-Liz/administracion.git
```

- Acceder

```bash
  cd administracion
```

- Instalacion de dependencias

```bash
  npm i
```

- Ejecucion

```bash
  npm run dev
```

## Ejemplos de uso

Los componentes reutilizables están disponibles en `/@components/` e incluyen:

- Modales
- Alertas
- Formularios
- Cards
- Grids
- Tablas

Revisa los componentes existentes antes de crear nuevos.

### Tipos de inputs disponibles

Para crear formularios propios revisa `@/utils/constants/forms/testInputs` en donde viene todo lo necesario para cada tipo de input:

- `"INPUT"`
- `"NUMBER"`
- `"PASSWORD"`
- `"PHONE"`
- `"TEXT_AREA"`
- `"MAIL"`
- `"DATE"`
- `"DATE_RANGE"`
- `"CHECKBOX"`
- `"CHECKBOX_GROUP"`
- `"SELECT"`
- `"FILE"`
- `"IMG"`
- `"SEARCH"`
- `"LINK"`
- `"RATING"`
- `"TAG_INPUT"`
- `"H1"`

### Ejemplo de pantalla básica

URL de ejemplo: `https://admin.mercadosliz.com/register`

Esta pantalla sigue la estructura requerida para formularios, encuestas y cuestionarios:

- **Header/Footer obligatorios** para navegación del usuario
- **Etiquetas vacías** (`<></>`) para encapsular código limpiamente
- Sin especificar `"use client"` o `"use server"` (gestión directa del navegador)

```typescript
import MainForm from "@/components/form/main-form";
import Footer from "@/template/footer";
import Header from "@/template/header";

const Page = () => {
  return (
    <>
      <Header />
      <section className="p-10 min-h-[80vh] md:w-[60%] mx-auto">
        <MainForm
          actionType="post-general"
          table="usuarios"
          dataForm={[
            {
              id: 0,
              type: "MAIL",
              name: "email",
              label: "Correo",
              placeholder: "example@mercadosliz.com",
              require: true,
            },
            {
              id: 1,
              type: "PASSWORD",
              name: "password",
              label: "Contraseña",
              placeholder: "UseExample@123",
              require: true,
            },
            {
              id: 2,
              type: "SELECT",
              name: "rol",
              label: "Rol del usuario",
              options: [
                "cajero",
                "ventas",
                "compras",
                "almacen",
                "seguridad",
                "imagen",
                "abarrotes",
                "entregas",
              ],
              require: true,
            },
          ]}
          message_button="Registrar"
        />
      </section>
      <Footer />
    </>
  );
};
export default Page;
```

## API

Construcción de consultas y las limitaciones actuales. A continuación, presento una serie de ejemplos de uso correctos y completos, basados en la lógica implementada.

## Estructura del Request

El endpoint espera un JSON con las siguientes propiedades:

- **`Selects`** (opcional): Lista de columnas o expresiones a incluir en el `SELECT`. Cada elemento tiene:
  - `Key`: nombre de columna o expresión (p.ej. `"Nombre"`, `"CASE WHEN Edad > 18 THEN 'Mayor' ELSE 'Menor' END"`).
  - `Alias`: (opcional) nombre del campo en el resultado.

- **`Agregaciones`** (opcional): Lista de operaciones de agregación. Cada elemento tiene:
  - `Key`: columna o expresión sobre la que se aplica la agregación.
  - `Operation`: puede ser `SUM`, `COUNT`, `AVG`, `MIN`, `MAX` o `DISTINCT` (este último para obtener valores únicos sin agregación).
  - `Alias`: (opcional) nombre del campo en el resultado.

- **`FiltrosAnd`** (opcional): Lista de grupos de filtros que se combinan con `AND` entre sí. Cada grupo tiene:
  - `OperadorLogico`: `"AND"` o `"OR"` (por defecto `"AND"`). Define cómo se combinan los filtros _dentro_ del grupo.
  - `Filtros`: lista de condiciones simples (objetos con `Key`, `Operator`, `Value`).  
    _Nota:_ No se soportan grupos anidados dentro de los filtros; solo condiciones atómicas.

- **`Order`** (opcional): Lista de criterios de ordenación. Cada elemento tiene:
  - `Key`: columna o alias por el que ordenar.
  - `Direction`: `"ASC"` o `"DESC"` (por defecto `"ASC"`).

Además, se pasan por query string:

- `table` (opcional, por defecto `"general"`): nombre de la tabla o vista.
- `page` (opcional, por defecto `1`): número de página.
- `pageSize` (opcional, por defecto `50`): número de registros por página.

> ⚠️ **Importante:** El código actual solo procesa `FiltrosAnd`; las propiedades `Filtros` (directa) y `FiltrosOr` no se utilizan, aunque aparezcan en la validación inicial. Por lo tanto, todos los ejemplos deben usar únicamente `FiltrosAnd`.

---

## Ejemplos de uso

### 1. Consulta simple con selección de columnas y filtro básico

Obtener el nombre y la edad de personas mayores de 25 años.

```json
{
  "Selects": [{ "Key": "Nombre", "Alias": "nombre" }, { "Key": "Edad" }],
  "FiltrosAnd": [
    {
      "OperadorLogico": "AND",
      "Filtros": [{ "Key": "Edad", "Operator": ">", "Value": "25" }]
    }
  ]
}
```

### 2. Filtro con operador LIKE

Buscar productos cuyo nombre contenga "laptop" (sin distinguir mayúsculas).  
El código agrega automáticamente los `%` alrededor del valor a menos que ya los incluya.

```json
{
  "Selects": [{ "Key": "Producto" }, { "Key": "Precio" }],
  "FiltrosAnd": [
    {
      "Filtros": [{ "Key": "Nombre", "Operator": "LIKE", "Value": "laptop" }]
    }
  ]
}
```

### 3. Operador IN

Obtener pedidos cuyo estado sea "Enviado" o "Entregado".

```json
{
  "Selects": [{ "Key": "PedidoId" }, { "Key": "Estado" }],
  "FiltrosAnd": [
    {
      "Filtros": [
        { "Key": "Estado", "Operator": "IN", "Value": "Enviado,Entregado" }
      ]
    }
  ]
}
```

### 4. Operador BETWEEN (rango de fechas)

Pedidos realizados entre el 1 y el 31 de enero de 2025.

```json
{
  "Selects": [{ "Key": "PedidoId" }, { "Key": "Fecha" }],
  "FiltrosAnd": [
    {
      "Filtros": [
        {
          "Key": "Fecha",
          "Operator": "BETWEEN",
          "Value": "2025-01-01 AND 2025-01-31"
        }
      ]
    }
  ]
}
```

### 5. Operador TIME_BETWEEN (rango de horas)

Eventos cuya hora de inicio esté entre las 9:00 y las 18:00.

```json
{
  "Selects": [{ "Key": "Evento" }, { "Key": "HoraInicio" }],
  "FiltrosAnd": [
    {
      "Filtros": [
        {
          "Key": "HoraInicio",
          "Operator": "TIME_BETWEEN",
          "Value": "09:00:00 AND 18:00:00"
        }
      ]
    }
  ]
}
```

### 6. Operadores IS NULL / IS NOT NULL

Clientes que no tienen teléfono registrado.

```json
{
  "Selects": [{ "Key": "ClienteId" }, { "Key": "Nombre" }],
  "FiltrosAnd": [
    {
      "Filtros": [{ "Key": "Telefono", "Operator": "IS NULL" }]
    }
  ]
}
```

### 7. Combinación de condiciones dentro de un grupo (AND / OR)

Personas que tengan más de 30 años **y** vivan en "Madrid" **o** tengan menos de 18 años.  
Esto se logra con un solo grupo que use `OperadorLogico: "OR"` para combinar dos condiciones compuestas, pero como no podemos anidar, necesitamos representarlo con dos grupos unidos por AND a nivel superior:

- Grupo 1: (Edad > 30 Y Ciudad = "Madrid") → lógico AND.
- Grupo 2: (Edad < 18) → lógico AND (un solo filtro).

```json
{
  "Selects": [{ "Key": "Nombre" }, { "Key": "Edad" }, { "Key": "Ciudad" }],
  "FiltrosAnd": [
    {
      "OperadorLogico": "AND",
      "Filtros": [
        { "Key": "Edad", "Operator": ">", "Value": "30" },
        { "Key": "Ciudad", "Operator": "=", "Value": "Madrid" }
      ]
    },
    {
      "OperadorLogico": "AND",
      "Filtros": [{ "Key": "Edad", "Operator": "<", "Value": "18" }]
    }
  ]
}
```

Esto produce la condición SQL: `(Edad > 30 AND Ciudad = 'Madrid') AND (Edad < 18)`, que no es exactamente lo que queríamos (debería ser OR entre ambas partes). Para conseguir el OR entre los dos bloques, necesitaríamos un grupo con OR a nivel superior que agrupara las dos condiciones compuestas, pero eso no es posible porque la estructura es fija: los grupos siempre se combinan con AND. Por tanto, la única manera de expresar una condición OR compleja es meter todas las condiciones en un mismo grupo con `OperadorLogico: "OR"`, pero entonces no podemos agrupar internamente con AND.  
Ejemplo: (A AND B) OR C se puede expresar como un grupo OR con tres condiciones simples: A, B, C. Pero esto significaría (A OR B OR C), que no es equivalente.  
En conclusión, el modelo actual solo permite combinaciones **conjuntivas entre grupos** y, dentro de cada grupo, combinaciones **disyuntivas o conjuntivas simples**. No se soportan árboles lógicos arbitrarios. Para la mayoría de los casos prácticos es suficiente, pero hay que tenerlo en cuenta.

### 8. Agregaciones con GROUP BY implícito

Ventas totales (suma) por categoría, incluyendo el promedio de precio.

```json
{
  "Selects": [{ "Key": "Categoria", "Alias": "Categoría" }],
  "Agregaciones": [
    { "Key": "Ventas", "Operation": "SUM", "Alias": "TotalVentas" },
    { "Key": "Precio", "Operation": "AVG", "Alias": "PrecioPromedio" }
  ]
}
```

Las columnas listadas en `Selects` se incluyen automáticamente en el `GROUP BY`.

### 9. Distinct de una columna

Obtener todos los países distintos donde hay clientes.

```json
{
  "Agregaciones": [
    { "Key": "Pais", "Operation": "DISTINCT", "Alias": "Paises" }
  ]
}
```

Esto genera `SELECT DISTINCT Pais AS Paises`.

### 10. Ordenamiento

Productos ordenados por precio descendente y luego por nombre ascendente.

```json
{
  "Selects": [{ "Key": "Nombre" }, { "Key": "Precio" }],
  "Order": [
    { "Key": "Precio", "Direction": "DESC" },
    { "Key": "Nombre", "Direction": "ASC" }
  ]
}
```

### 11. Paginación con parámetros

Obtener la página 5 con 20 resultados por página.

```
POST /api/v2/masivo/consultar?table=ventas&page=5&pageSize=20
```

### 12. Uso de CASE WHEN en SELECT

Clasificar a los clientes según su edad.

```json
{
  "Selects": [
    { "Key": "Nombre" },
    {
      "Key": "CASE WHEN Edad >= 18 THEN 'Adulto' ELSE 'Menor' END",
      "Alias": "Tipo"
    }
  ]
}
```

### 13. CASE WHEN en agregación

Contar cuántos clientes son adultos y cuántos menores.

```json
{
  "Agregaciones": [
    {
      "Key": "CASE WHEN Edad >= 18 THEN 'Adulto' ELSE 'Menor' END",
      "Operation": "COUNT",
      "Alias": "Cantidad"
    }
  ]
}
```

### 14. Filtro con expresión CASE_WHEN

Aunque menos común, el operador `CASE_WHEN` permite usar una expresión condicional en el `WHERE`. Por ejemplo, filtrar registros que cumplan una condición lógica definida en el `Value`.

```json
{
  "FiltrosAnd": [
    {
      "Filtros": [
        {
          "Key": "",
          "Operator": "CASE_WHEN",
          "Value": "WHEN Edad > 60 THEN 'Jubilado' ELSE 'Activo' END = 'Jubilado'"
        }
      ]
    }
  ]
}
```

> Nota: El parsing de `CASE_WHEN` es complejo; se recomienda usar este operador solo cuando sea estrictamente necesario y preferir expresiones en `Selects` o `Agregaciones`.

### 15. Combinación de varios elementos

Un ejemplo completo que incluye selección, filtros con AND/OR, agregación y ordenamiento:

```json
{
  "Selects": [{ "Key": "Departamento" }],
  "Agregaciones": [
    { "Key": "Salario", "Operation": "AVG", "Alias": "SalarioPromedio" },
    { "Key": "EmpleadoId", "Operation": "COUNT", "Alias": "TotalEmpleados" }
  ],
  "FiltrosAnd": [
    {
      "OperadorLogico": "AND",
      "Filtros": [
        { "Key": "Departamento", "Operator": "IN", "Value": "Ventas,Marketing" }
      ]
    },
    {
      "OperadorLogico": "OR",
      "Filtros": [
        { "Key": "Salario", "Operator": ">", "Value": "50000" },
        { "Key": "AniosExperiencia", "Operator": ">=", "Value": "5" }
      ]
    }
  ],
  "Order": [{ "Key": "SalarioPromedio", "Direction": "DESC" }]
}
```

**Interpretación SQL aproximada:**

```sql
SELECT Departamento, AVG(Salario) AS SalarioPromedio, COUNT(EmpleadoId) AS TotalEmpleados
FROM table
WHERE Departamento IN ('Ventas','Marketing')
  AND (Salario > 50000 OR AniosExperiencia >= 5)
GROUP BY Departamento
ORDER BY SalarioPromedio DESC
```

---

## Resumen de operadores soportados en filtros

| Operador      | Uso en `Operator` | Ejemplo de `Value`            |
| ------------- | ----------------- | ----------------------------- |
| Igualdad      | `=` (o vacío)     | `"Juan"`                      |
| Mayor que     | `>`               | `"100"`                       |
| Menor que     | `<`               | `"50"`                        |
| Mayor o igual | `>=`              | `"18"`                        |
| Menor o igual | `<=`              | `"65"`                        |
| Diferente     | `<>` o `!=`       | `"Inactivo"`                  |
| LIKE          | `LIKE`            | `"%algo%"`                    |
| IN            | `IN`              | `"valor1,valor2,valor3"`      |
| NOT IN        | `NOT IN`          | `"excluido1,excluido2"`       |
| BETWEEN       | `BETWEEN`         | `"10 AND 20"`                 |
| NOT BETWEEN   | `NOT BETWEEN`     | `"2020-01-01 AND 2020-12-31"` |
| IS NULL       | `IS NULL`         | (no requiere `Value`)         |
| IS NOT NULL   | `IS NOT NULL`     | (no requiere `Value`)         |
| TIME_BETWEEN  | `TIME_BETWEEN`    | `"09:00 AND 18:00"`           |
| CASE_WHEN     | `CASE_WHEN`       | Expresión condicional         |

---

## Consideraciones finales

- Los nombres de columnas pueden incluir el nombre de la tabla (ej. `"clientes.Nombre"`) y se formatean con corchetes.
- Los alias son opcionales, pero útiles para simplificar la salida o para referenciarlos en `Order`.
- La paginación se maneja automáticamente según el tamaño del offset y la complejidad de la consulta (estrategias directa, CTE, tabla temporal o keyset).
- El parámetro `table` en la URL permite cambiar la tabla de consulta sin modificar el cuerpo.

Estos ejemplos cubren prácticamente todos los casos de uso que el controlador puede manejar. Si necesitas una combinación más compleja de condiciones, recuerda la limitación de la estructura de dos niveles (grupos AND y dentro de cada grupo condiciones planas combinadas con AND/OR).

## Autor

- [@aresnative](https://www.github.com/AresNative)
