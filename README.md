# CourseHub API

API REST hecha con NestJS para gestionar **estudiantes**, **cursos** y **matrículas**.
Los datos se guardan en memoria (se reinician al apagar el servidor).

## Instalación y ejecución

```bash
npm install
npm run start:dev   # http://localhost:3000
npm test            # pruebas unitarias
```

## Pruebas automatizadas (Testing)

El proyecto utiliza **Vitest** como ejecutor de pruebas rápido e integrado con TypeScript y ESM.

### Verificación local completa

El repositorio usa `pnpm-lock.yaml`; instala dependencias y verifica el proyecto
con los siguientes comandos:

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run test
pnpm run test:e2e
pnpm run build
```

Las pruebas e2e requieren PostgreSQL local y una base **exclusiva** llamada
`coursehub_e2e`. Créala con un usuario que pueda conectarse:

```sql
CREATE DATABASE coursehub_e2e;
```

En PowerShell, define la contraseña de ese usuario antes de ejecutar el e2e:

```powershell
$env:E2E_DATABASE_PASSWORD = "tu-contraseña-local"
pnpm run test:e2e
```

Opcionalmente, define `E2E_DATABASE_HOST`, `E2E_DATABASE_PORT` y
`E2E_DATABASE_USER` si PostgreSQL no usa `127.0.0.1:5432` y el usuario
`postgres`. El conjunto selecciona únicamente `coursehub_e2e`, sincroniza allí
el esquema y elimina el usuario de prueba antes y después de cada ejecución.
No apunta a la base de desarrollo indicada por `.env`.

El workflow de GitHub Actions instala con el lockfile, ejecuta lint, pruebas
unitarias, e2e contra un servicio PostgreSQL temporal y construye el proyecto.

### Comandos de ejecución

```bash
# Ejecutar todo el conjunto de pruebas unitarias
npm test

# Ejecutar únicamente las pruebas del caso de uso de cursos
npm test -- update-course

# Ejecutar pruebas en modo interactivo/observador (watch)
npm run test:watch

# Generar reporte de cobertura de código
npm run test:cov
```

### Estructura de pruebas unitarias (Patrón Arrange - Act - Assert)

Las pruebas unitarias de casos de uso (como `UpdateCourseUseCase`) desacoplan la regla de negocio de la infraestructura mediante repositorios simulados (*mock repository*) inyectados con `COURSE_REPOSITORY`. Esto permite verificar reglas sin necesidad de una base de datos real ni peticiones HTTP:

1. **Arrange (Preparar):** Se configura el estado previo, datos de entrada y respuestas de los mocks (`findById`, `save`).
2. **Act (Ejecutar):** Se invoca el método `execute` del caso de uso.
3. **Assert (Verificar):** Se comprueba el resultado retornado, la excepción esperada (`NotFoundException`, `ForbiddenException`) y que las interacciones con el repositorio (`save`) solo ocurran cuando la regla lo autoriza.

#### Escenarios protegidos en `UpdateCourseUseCase`:
- **Caso exitoso:** Un docente dueño del curso (`createdByUserId === actor.id`) puede modificarlo y los cambios se guardan.
- **Recurso inexistente (404):** Si el curso no existe, lanza `NotFoundException` y no llama a `save`.
- **Rechazo por regla (403):** Si otro docente intenta modificar un curso ajeno, lanza `ForbiddenException` y se garantiza que el repositorio no persiste ningún cambio.
- **Administrador:** Un usuario con rol `ADMIN` puede modificar cualquier curso independientemente del creador.

### Pruebas de controladores con casos de uso simulados

En las pruebas de controladores (por ejemplo, `CoursesController`), no se revalida la lógica de negocio interna, sino la correcta **delegación** de los parámetros HTTP hacia el caso de uso y la **propagación de excepciones**:

- **Delegación precisa:** Se comprueba que el controlador preserve el `id`, el DTO de entrada y entregue la identidad del usuario autenticado (`req.user`) sin mutar datos.
- **Propagación de errores:** Si el caso de uso lanza un error (como `ForbiddenException`), el controlador debe dejarlo propagar para que los filtros de excepción globales lo capturen; no debe atraparlo ni transformarlo en un falso `200 OK`.
- **Cobertura de ramas:** El análisis con `npm run test:cov` permite identificar métodos o bifurcaciones opcionales (como `req?.user` no definido) para asegurar que todas las ramas críticas cuenten con aserciones significativas.

## Configuración del entorno

`ConfigModule` valida las variables antes de inicializar la conexión a PostgreSQL.
Consulta `.env.example` para los nombres y valores de ejemplo:

- `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER` y `DATABASE_PASSWORD` son
  obligatorias.
- `DATABASE_PORT` usa `5432` por defecto y `PORT` usa `3000`.
- `NODE_ENV` acepta `development`, `test` o `production` y usa `development`
  por defecto. Solo en `development` se permite que `DATABASE_PASSWORD` esté
  vacío; en los demás entornos debe contener al menos un carácter.

## Estructura de módulos

```
src/
├── students/      # StudentsModule  (CRUD de estudiantes, ParseStudentIdPipe)
├── courses/       # CoursesModule   (CRUD de cursos)
└── enrollments/   # EnrollmentsModule (matrículas; usa StudentsService y CoursesService)
```

`EnrollmentsModule` importa `StudentsModule` y `CoursesModule`, que exportan sus services.

## Datos iniciales

| Recurso | Datos |
|---|---|
| Estudiantes | `1` Carlos (activo), `2` José (**inactivo**), `3` Lucrecia (activa) |
| Cursos | `1` NestJS Fundamentals, `2` REST APIs with NestJS, `3` NestJS Architecture |

## Endpoints de matrículas

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| POST | `/enrollments` | Registra una matrícula | 201, 400, 404, 409, 422 |
| GET | `/enrollments` | Lista matrículas. Filtros opcionales combinables: `?studentId=&courseId=` | 200, 400 |
| GET | `/students/:studentId/enrollments` | Matrículas de un estudiante | 200, 400, 404 |
| GET | `/courses/:courseId/enrollments` | Matrículas de un curso | 200, 400, 404 |
| DELETE | `/enrollments/:id` | Cancela una matrícula | 204, 400, 404 |

### Reglas y errores

| Situación | Código |
|---|---|
| Body inválido, campo no permitido o id/filtro no numérico | 400 Bad Request |
| Estudiante, curso o matrícula inexistente | 404 Not Found |
| Matrícula duplicada (mismo `studentId` + `courseId`) | 409 Conflict |
| Estudiante inactivo | 422 Unprocessable Entity |

La validación es global (`ValidationPipe` con `whitelist` y `forbidNonWhitelisted`).
Los identificadores de ruta se validan con `ParseStudentIdPipe` y `ParseIntPipe`.

## Ejemplos de request y response

### Registrar matrícula válida

```http
POST /enrollments
Content-Type: application/json

{ "studentId": 1, "courseId": 1 }
```
```json
// 201 Created
{ "id": 1, "studentId": 1, "courseId": 1 }
```

### Matrícula duplicada

```http
POST /enrollments
{ "studentId": 1, "courseId": 1 }
```
```json
// 409 Conflict
{
  "message": "El estudiante ya está matriculado en este curso",
  "error": "Conflict",
  "statusCode": 409
}
```

### Estudiante inactivo

```http
POST /enrollments
{ "studentId": 2, "courseId": 1 }
```
```json
// 422 Unprocessable Entity
{
  "message": "El estudiante 2 está inactivo",
  "error": "Unprocessable Entity",
  "statusCode": 422
}
```

### Estudiante o curso inexistente

```http
POST /enrollments
{ "studentId": 99, "courseId": 1 }
```
```json
// 404 Not Found
{ "message": "Estudiante no encontrado", "error": "Not Found", "statusCode": 404 }
```

```http
POST /enrollments
{ "studentId": 1, "courseId": 99 }
```
```json
// 404 Not Found
{ "message": "Curso 99 no encontrado", "error": "Not Found", "statusCode": 404 }
```

### Datos inválidos

```http
POST /enrollments
{ "studentId": "a", "courseId": 1, "foo": "x" }
```
```json
// 400 Bad Request
{
  "message": [
    "property foo should not exist",
    "studentId must be a positive number",
    "studentId must be an integer number"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Listar con filtros

`GET /enrollments` acepta los filtros opcionales `search` (coincidencia parcial
sin distinguir mayúsculas en el nombre del estudiante o título del curso),
`studentId`, `courseId` y `activeOnly=true`, además de `page` (por defecto `1`)
y `limit` (por defecto `10`, máximo `50`). La respuesta incluye las entidades
relacionadas `student` y `course`, y metadatos de paginación.

```http
GET /enrollments
```
```json
{
  "items": [
    {
      "id": 1,
      "student": { "id": 1, "name": "Carlos" },
      "course": { "id": 1, "title": "NestJS Fundamentals" }
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

```http
GET /enrollments?search=nest&activeOnly=true&page=1&limit=5
```

### Matrículas por estudiante y por curso

```http
GET /students/1/enrollments
```
```json
// 200 OK
[ { "id": 1, "studentId": 1, "courseId": 1 } ]
```

```http
GET /courses/1/enrollments
```
```json
// 200 OK
[ { "id": 1, "studentId": 1, "courseId": 1 } ]
```

```http
GET /students/abc/enrollments
```
```json
// 400 Bad Request
{
  "message": "El identificador del estudiante debe ser un número entero positivo",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Cancelar una matrícula

```http
DELETE /enrollments/1
```
```
204 No Content
```

Si se repite:
```json
// 404 Not Found
{ "message": "Matrícula 1 no encontrada", "error": "Not Found", "statusCode": 404 }
```

## Otros endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET / POST | `/students` | Listar (filtros `career`, `semester`, `isActive`) / crear |
| GET / PATCH / DELETE | `/students/:id` | Consultar / actualizar / eliminar |
| PATCH | `/students/:id/status` | Alternar activo/inactivo |
| GET / POST | `/courses` | Listar cursos paginados (filtros `level`, `page`, `limit`, `sortBy`, `order`) / crear |
| GET / PATCH / DELETE | `/courses/:id` | Consultar / actualizar / eliminar |

### Listar cursos

`GET /courses` acepta `level` como filtro exacto, `page` (por defecto `1`),
`limit` (por defecto `10`, máximo `50`), `sortBy` (`id`, `title` o `level`;
por defecto `id`) y `order` (`ASC` o `DESC`; por defecto `ASC`).
Los valores inválidos, incluidos `page=0`, `limit=200`, `sortBy=createdAt`
y `order=sideways`, responden `400 Bad Request`.

```http
GET /courses?level=beginner&page=2&limit=5&sortBy=title&order=ASC
```

```json
{
  "items": [],
  "meta": {
    "total": 0,
    "page": 2,
    "limit": 5,
    "totalPages": 0
  }
}
```

## Autenticación y control de acceso (RBAC y Propiedad)

El sistema utiliza autenticación basada en JSON Web Tokens (JWT) mediante Passport (`passport-jwt`) junto con control de acceso basado en roles (`RolesGuard`) y verificación de propiedad en la capa de servicios.

### Roles de usuario (`UserRole`)

Los usuarios cuentan con un rol cerrado modelado mediante la enumeración:
* `admin`: Acceso completo de gestión.
* `teacher`: Puede crear cursos y modificar los cursos de su autoría.
* `student`: Rol por defecto de menor privilegio asignado al registrarse.

### Clasificación de rutas y políticas de autorización

| Método | Ruta | Acceso | Políticas aplicadas |
|---|---|---|---|
| POST | `/auth/register` | **Pública** | Registro con rol por defecto `student` |
| POST | `/auth/login` | **Pública** | Retorna `accessToken` firmado con `sub`, `email` y `role` |
| GET | `/auth/me` | **Protegida** | `JwtAuthGuard` (retorna `req.user`) |
| POST | `/courses` | **Protegida** | `JwtAuthGuard`, `RolesGuard` (`@Roles('teacher', 'admin')`). Asigna `createdByUserId` |
| GET | `/courses` | **Pública** | Listar cursos paginados con filtros |
| GET | `/courses/:id` | **Pública** | Consultar detalle de curso |
| PATCH | `/courses/:id` | **Protegida** | `JwtAuthGuard` + Regla de propiedad en servicio (Admin o docente propietario) |
| DELETE | `/courses/:id` | **Protegida** | `JwtAuthGuard`, `RolesGuard` (`@Roles('admin')`) |
| CRUD | `/students` | **Pública** | Gestión de estudiantes |
| CRUD | `/enrollments` | **Pública** | Gestión de matrículas |

### Matriz de evaluación para `PATCH /courses/:id`

| Caso de prueba | Token enviado | Rol del usuario | ¿Es propietario? | Respuesta | Motivo |
|---|---|---|---|---|---|
| Sin token | Ninguno | N/A | N/A | **`401 Unauthorized`** | `JwtAuthGuard` rechaza la solicitud |
| Estudiante | Token válido | `student` | No | **`403 Forbidden`** | El servicio comprueba que no es admin ni propietario |
| Docente ajeno | Token válido | `teacher` | No (`createdByUserId !== actor.id`) | **`403 Forbidden`** | Solo el docente autor o un admin puede editar |
| Docente propietario | Token válido | `teacher` | Sí (`createdByUserId === actor.id`) | **`200 OK`** | Coincide la propiedad del recurso |
| Administrador | Token válido | `admin` | No relevante (`canManageAny = true`) | **`200 OK`** | El admin tiene privilegios globales de modificación |

### Información mínima requerida en la identidad autenticada

Para evaluar tanto el control de acceso por roles como la regla de propiedad de recursos, la identidad autenticada (`AuthenticatedUser` / `req.user`) debe incorporar como mínimo:

1. **`id` (`number`):** Necesario para comprobar la propiedad del recurso frente a `course.createdByUserId === actor.id`.
2. **`role` (`UserRole`):** Necesario para que `RolesGuard` y la regla de negocio verifiquen si el usuario es `admin`, `teacher` o `student`.
3. **`email` (`string`):** Para identificación y auditoría del usuario en el sistema.

## Seguridad por capas (CORS, Rate Limiting y HTTPS)

### Matriz de capas de seguridad

| Riesgo | Control principal | Control complementario |
|---|---|---|
| Cuerpo malformado | DTO y `ValidationPipe` | Límite de tamaño de petición |
| Token robado en tránsito | HTTPS / TLS | Vencimiento corto de JWT (`15m`) |
| Fuerza bruta de login | Limitación de tasa (`ThrottlerModule` / 5 intentos por min) | Mensaje genérico y hash bcrypt (cost factor 12) |
| Acción sin permiso | Roles (`RolesGuard`) y propiedad en servicio | Registro de auditoría |
| Sitio web no autorizado | CORS | JWT y autorización en el servidor |

### CORS (Cross-Origin Resource Sharing)
CORS restringe qué orígenes web en un navegador pueden leer las respuestas de la API (`app.enableCors(...)`).
* **CORS no es autorización:** No previene que clientes fuera del navegador (como Postman, scripts o curl) envíen peticiones. Las rutas protegidas siempre exigen validación de JWT y roles.
* Orígenes configurados en desarrollo: `http://localhost:5173` y `https://coursehub.example.edu`.

### Limitación de tasa (Rate Limiting)
Implementado con `@nestjs/throttler`:
* **Límite global:** 20 solicitudes por minuto (`ttl: 60_000`, `limit: 20`).
* **Límite estricto en login (`POST /auth/login`):** Máximo 5 intentos por minuto (`@Throttle({ default: { limit: 5, ttl: 60_000 } })`). Al 6.º intento consecutivo en la misma ventana, responde **`429 Too Many Requests`**.

### Reglas de seguridad para producción
1. **Producción requiere HTTPS/TLS:** El tráfico en tránsito debe estar cifrado para evitar la interceptación de tokens Bearer. La terminación TLS debe estar garantizada por el proxy inverso, balanceador o plataforma de despliegue.
2. **Secretos exclusivos en el entorno:** Variables sensibles como `JWT_SECRET` y credenciales de base de datos viven **únicamente** en variables de entorno del servidor de producción, nunca hardcodeadas ni versionadas en el repositorio.


