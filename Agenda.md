# Agenda de la sesión de pruebas e2e

| Tiempo | Actividad | Evidencia |
|--------|-----------|-----------|
| 0–20   | Repaso de pirámide de pruebas | Diferenciar unidad, integración y e2e. |
| 20–45  | Demostración | Arrancar la aplicación de prueba. |
| 45–90  | Práctica guiada | Crear casos con **Supertest**. |
| 90–110 | Aislamiento | Limpiar datos entre casos. |
| 110–120| Cierre | Interpretar un fallo e2e. |

## Marco conceptual

Una prueba **e2e** crea la aplicación Nest, envía una solicitud HTTP y comprueba la respuesta observable. Sirve para verificar que rutas, guards, pipes, controladores y la capa de persistencia cooperan correctamente. No debe depender de datos personales ni de una base de datos usada en desarrollo.

```ts
const module = await Test.createTestingModule({
  imports: [AppModule],
}).compile();

app = module.createNestApplication();
await app.init();

await request(app.getHttpServer())
  .get('/courses')
  .expect(200)
  .expect(({ body }) => expect(body).toEqual(expect.any(Array)));
```

Una prueba útil declara su **preparación**, la **solicitud** y la **respuesta esperada**. Para una ruta protegida, crea una identidad de práctica con un rol conocido, obtiene un token de prueba y verifica tanto el acceso permitido como el denegado.

## Práctica guiada

1. **Configura una suite de pruebas que no use credenciales de producción.**
2. **Escribe un caso** para `GET /courses`.
3. **Escribe un caso** para una escritura autenticada (`POST /courses`).
4. **Añade casos** que confirmen `401` sin token y `403` con rol insuficiente.
5. **Limpia o reinicializa los datos** entre pruebas (p.ej. `connection.synchronize(true)`).
6. **Ejecuta el conjunto dos veces**; el resultado debe ser idéntico.

> **Nota:** en esta máquina se usa **pnpm** en vez de npm. Para ejecutar las pruebas e2e, use `pnpm run test:e2e`.
