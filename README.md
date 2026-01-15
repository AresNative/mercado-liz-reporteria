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

### Instalaciones necesarias para la clonacion del proyecto y su desarrollo

- Git
```bash
  https://git-scm.com/
```

- Node Js
```bash
  https://nodejs.org/es/download
```

- Editor de codigo (VS Code)
```bash
  https://code.visualstudio.com/
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

## Autor

- [@aresnative](https://www.github.com/AresNative)
