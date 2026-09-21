# CourseHub API

API REST hecha con NestJS para gestionar **estudiantes**, **cursos** y **matrículas**.
Los datos se guardan en memoria (se reinician al apagar el servidor).

## Instalación y ejecución

```bash
npm install
npm run start:dev   # http://localhost:3000
npm test            # pruebas unitarias
```

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

```http
GET /enrollments
```
```json
// 200 OK
[
  { "id": 1, "studentId": 1, "courseId": 1 },
  { "id": 2, "studentId": 3, "courseId": 2 }
]
```

```http
GET /enrollments?studentId=3&courseId=2
```
```json
// 200 OK
[ { "id": 2, "studentId": 3, "courseId": 2 } ]
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
| GET / POST | `/courses` | Listar (filtro `level`) / crear |
| GET / PATCH / DELETE | `/courses/:id` | Consultar / actualizar / eliminar |