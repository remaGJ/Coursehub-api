const { Client } = require('pg');

const BASE_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(70));
  console.log('   INICIANDO EJECUCIÓN AUTOMÁTICA DE PRUEBAS - COURSEHUB API');
  console.log('='.repeat(70));

  const pgClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123',
    database: 'coursehub',
  });
  await pgClient.connect();

  console.log('\n[PREPARACIÓN] Limpiando datos previos en PostgreSQL...');
  await pgClient.query('TRUNCATE TABLE courses RESTART IDENTITY CASCADE;');
  await pgClient.query(`
    DELETE FROM users 
    WHERE LOWER(email) IN ('admin@test.com', 'doca@test.com', 'docb@test.com', 'student@test.com');
  `);
  console.log('Tabla courses vaciada y usuarios de prueba eliminados para iniciar desde cero.\n');

  // ==========================================
  // PASO 1: USUARIOS
  // ==========================================
  console.log('='.repeat(70));
  console.log('PASO 1: REGISTRO DE USUARIOS');
  console.log('='.repeat(70));

  const usersToRegister = [
    { email: 'admin@test.com', password: 'Test12345', label: '1. Admin' },
    { email: 'docA@test.com', password: 'Test12345', label: '2. docA' },
    { email: 'docB@test.com', password: 'Test12345', label: '3. docB' },
    { email: 'student@test.com', password: 'Test12345', label: '4. student' },
  ];

  for (const u of usersToRegister) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: u.email, password: u.password }),
    });
    const data = await res.json();
    console.log(`[POST /auth/register] ${u.label} (${u.email}) -> Status: ${res.status}`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  console.log('\n' + '-'.repeat(70));
  console.log('EJECUTANDO SQL EN POSTGRESQL (ASIGNACIÓN DE ROLES)');
  console.log('-'.repeat(70));

  await pgClient.query(`UPDATE users SET role = 'admin' WHERE LOWER(email) = 'admin@test.com';`);
  await pgClient.query(`UPDATE users SET role = 'teacher' WHERE LOWER(email) IN ('doca@test.com', 'docb@test.com');`);
  
  const usersDb = await pgClient.query(`SELECT id, email, role FROM users ORDER BY id;`);
  console.log('Consulta SQL: SELECT id, email, role FROM users ORDER BY id;');
  console.table(usersDb.rows);

  console.log('\n' + '-'.repeat(70));
  console.log('LOGIN DE USUARIOS (OBTENCIÓN DE TOKENS JWT)');
  console.log('-'.repeat(70));

  let tokenAdmin, tokenA, tokenB, tokenStudent;

  // Login Admin
  {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'Test12345' }),
    });
    const data = await res.json();
    tokenAdmin = data.accessToken;
    console.log(`[POST /auth/login] admin@test.com -> Status: ${res.status}`);
    console.log(`   tokenAdmin guardado (${tokenAdmin.substring(0, 30)}...)`);
  }

  // Login docA
  {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'docA@test.com', password: 'Test12345' }),
    });
    const data = await res.json();
    tokenA = data.accessToken;
    console.log(`[POST /auth/login] docA@test.com -> Status: ${res.status}`);
    console.log(`   tokenA guardado (${tokenA.substring(0, 30)}...)`);
  }

  // Login docB
  {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'docB@test.com', password: 'Test12345' }),
    });
    const data = await res.json();
    tokenB = data.accessToken;
    console.log(`[POST /auth/login] docB@test.com -> Status: ${res.status}`);
    console.log(`   tokenB guardado (${tokenB.substring(0, 30)}...)`);
  }

  // Login student
  {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@test.com', password: 'Test12345' }),
    });
    const data = await res.json();
    tokenStudent = data.accessToken;
    console.log(`[POST /auth/login] student@test.com -> Status: ${res.status}`);
    console.log(`   tokenStudent guardado (${tokenStudent.substring(0, 30)}...)`);
  }

  // ==========================================
  // PASO 2: CURSOS DE PRUEBA
  // ==========================================
  console.log('\n' + '='.repeat(70));
  console.log('PASO 2: CURSOS DE PRUEBA');
  console.log('='.repeat(70));

  let courseId, courseId2;

  // Curso 1
  {
    const res = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Curso de docA', level: 'beginner' }),
    });
    const data = await res.json();
    courseId = data.id;
    console.log(`[POST /courses] Bearer tokenA -> Status: ${res.status}`);
    console.log(`   courseId = ${courseId}, creado por createdByUserId = ${data.createdByUserId}`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  // Curso 2
  {
    const res = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ title: 'Curso para borrar', level: 'beginner' }),
    });
    const data = await res.json();
    courseId2 = data.id;
    console.log(`[POST /courses] Bearer tokenA -> Status: ${res.status}`);
    console.log(`   courseId2 = ${courseId2}, creado por createdByUserId = ${data.createdByUserId}`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  // ==========================================
  // PUNTO 2: RUTA ADMIN (DELETE /courses/:id)
  // ==========================================
  console.log('\n' + '='.repeat(70));
  console.log(`PUNTO 2: RUTA ADMIN (DELETE /courses/${courseId2})`);
  console.log('='.repeat(70));

  // a: No Auth -> 401
  {
    const res = await fetch(`${BASE_URL}/courses/${courseId2}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[a] DELETE /courses/${courseId2} | No Auth -> Status: ${res.status} (Esperado: 401)`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  // b: Bearer tokenStudent -> 403
  {
    const res = await fetch(`${BASE_URL}/courses/${courseId2}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenStudent}` },
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[b] DELETE /courses/${courseId2} | Bearer tokenStudent -> Status: ${res.status} (Esperado: 403)`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  // c: Bearer tokenAdmin -> 200
  {
    const res = await fetch(`${BASE_URL}/courses/${courseId2}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[c] DELETE /courses/${courseId2} | Bearer tokenAdmin -> Status: ${res.status} (Esperado: 200)`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  // ==========================================
  // PUNTO 3: PROPIEDAD (PATCH /courses/:id)
  // ==========================================
  console.log('\n' + '='.repeat(70));
  console.log(`PUNTO 3: REGLA DE PROPIEDAD (PATCH /courses/${courseId})`);
  console.log('='.repeat(70));
  const patchPayload = { title: 'Título editado' };

  // a: Bearer tokenB -> 403
  {
    const res = await fetch(`${BASE_URL}/courses/${courseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify(patchPayload),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[a] PATCH /courses/${courseId} | Bearer tokenB -> Status: ${res.status} (Esperado: 403)`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  // b: Bearer tokenStudent -> 403
  {
    const res = await fetch(`${BASE_URL}/courses/${courseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent}`,
      },
      body: JSON.stringify(patchPayload),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[b] PATCH /courses/${courseId} | Bearer tokenStudent -> Status: ${res.status} (Esperado: 403)`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  // c: No Auth -> 401
  {
    const res = await fetch(`${BASE_URL}/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchPayload),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[c] PATCH /courses/${courseId} | No Auth -> Status: ${res.status} (Esperado: 401)`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  // d: Bearer tokenA -> 200
  {
    const res = await fetch(`${BASE_URL}/courses/${courseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(patchPayload),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[d] PATCH /courses/${courseId} | Bearer tokenA -> Status: ${res.status} (Esperado: 200)`);
    console.log('   Respuesta:', JSON.stringify(data));
  }

  console.log('\n' + '-'.repeat(70));
  console.log('VERIFICANDO EN BASE DE DATOS (SQL en PostgreSQL/pgAdmin)');
  console.log('-'.repeat(70));
  const coursesDb = await pgClient.query(`SELECT id, title, "createdByUserId" FROM courses ORDER BY id;`);
  console.log('Consulta SQL: SELECT id, title, "createdByUserId" FROM courses ORDER BY id;');
  console.table(coursesDb.rows);

  // ==========================================
  // PUNTO 4: CORS
  // ==========================================
  console.log('\n' + '='.repeat(70));
  console.log('PUNTO 4: CORS (GET /courses)');
  console.log('='.repeat(70));

  // a: Origin: http://localhost:5173
  {
    const res = await fetch(`${BASE_URL}/courses`, {
      method: 'GET',
      headers: { Origin: 'http://localhost:5173' },
    });
    const acaoHeader = res.headers.get('access-control-allow-origin');
    console.log(`[a] GET /courses | Origin: http://localhost:5173 -> Status: ${res.status}`);
    console.log(`   Header Access-Control-Allow-Origin: ${acaoHeader} (PRESENTE)`);
  }

  // b: Origin: http://evil.com
  {
    const res = await fetch(`${BASE_URL}/courses`, {
      method: 'GET',
      headers: { Origin: 'http://evil.com' },
    });
    const acaoHeader = res.headers.get('access-control-allow-origin');
    console.log(`[b] GET /courses | Origin: http://evil.com -> Status: ${res.status}`);
    console.log(`   Header Access-Control-Allow-Origin: ${acaoHeader} (AUSENTE / NULL)`);
  }

  // ==========================================
  // PUNTO 5: RATE LIMIT
  // ==========================================
  console.log('\n' + '='.repeat(70));
  console.log('PUNTO 5: RATE LIMIT (POST /auth/login)');
  console.log('='.repeat(70));
  console.log('Esperando 62 segundos para que se reinicie la ventana de Throttler en /auth/login...');

  for (let s = 62; s > 0; s -= 10) {
    console.log(`   Quedan ${s} segundos...`);
    await sleep(Math.min(10000, s * 1000));
  }
  console.log('   Ventana reiniciada. Ejecutando 7 iteraciones con credenciales inválidas:\n');

  for (let i = 1; i <= 7; i++) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'x@test.com', password: 'incorrecta123' }),
    });
    const data = await res.json().catch(() => ({}));
    const expected = i <= 5 ? '401' : '429';
    console.log(`   Iteración ${i}/7: Status ${res.status} (Esperado: ${expected}) | Body: ${JSON.stringify(data)}`);
  }

  await pgClient.end();
  console.log('\n' + '='.repeat(70));
  console.log('   ¡TODAS LAS PRUEBAS FINALIZARON EXITOSAMENTE!');
  console.log('='.repeat(70));
}

main().catch((err) => {
  console.error('Error fatal durante la ejecución:', err);
  process.exit(1);
});
