# TP Integrador — Frontend
## Sistema de Gestión de Turnos Médicos

**IES Santa Fe · Programación 2 · 2026**
**Autores:** Aaron Juárez & Ilan Pitashny

---

## Tecnologías

| Herramienta      | Versión              |
|------------------|----------------------|
| Node.js          | 22.x LTS (≥ 22.12)  |
| Angular CLI      | 21.x                 |
| Angular          | 21.x                 |
| Angular Material | 21.x                 |
| TypeScript       | ~5.9                 |
| Chart.js             | ^4.6.1                           |

---

## Requisitos previos

- Node.js `^20.19.0`, `^22.12.0` o `^24.0.0` (se recomienda 22 LTS)
- Angular CLI 21: `npm install -g @angular/cli@21`
- El backend del repositorio **TPIntegrador-SistemaGestionTurnos-Backend** corriendo en `http://localhost:4000`

---

## Levantar el sistema completo desde cero

### 1 — Base de datos

1. Abrir XAMPP y arrancar MySQL.
2. En phpMyAdmin (o MySQL Workbench), crear la base de datos `clinica`.
3. Importar los scripts en orden:
   - `scripts/clinica_ampliada.sql`
   - `scripts/usuarios_prueba.sql`

### 2 — Backend

```bash
# Desde la raíz del repositorio TPIntegrador-SistemaGestionTurnos-Backend
cp .env.example .env
```

Editar `.env` con las credenciales locales de MySQL:

```env
HOST=localhost
DATABASE=clinica
USER=root
PASSWORD=tu_contraseña
JWT_SECRET=ClaveSecretaTP2026
JWT_EXPIRES_IN=8h
PORT=4000
```

```bash
npm install
npm run dev
# → Servidor en http://localhost:4000
```

### 3 — Frontend

```bash
# Desde la raíz de este repositorio
npm install
ng serve
# → Aplicación en http://localhost:4200
```

La URL base de la API está definida en `src/environments/environment.ts`.
Si el backend corre en otro puerto, cambiarla ahí.

---

## Usuarios de prueba

Importar `scripts/usuarios_prueba.sql` en phpMyAdmin después de la base principal.

| Rol            | DNI      | Contraseña   |
|----------------|----------|--------------|
| administrador  | 00000001 | password123  |
| medico         | 00000002 | password123  |
| operador       | 00000003 | password123  |
| paciente       | 00000004 | password123  |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── services/         ← auth, agenda, turno, medico, paciente, sede,
│   │   │                        especialidad, cobertura, disponibilidad,
│   │   │                        usuario, auditoria (un archivo por servicio)
│   │   ├── guards/           ← authGuard (sesión) y rolGuard (rol)
│   │   ├── interceptors/     ← tokenInterceptor (agrega Bearer automáticamente)
│   │   └── utils/            ← error.util, fecha.util, rol.util
│   ├── models/               ← interfaces TypeScript por entidad
│   ├── shared/
│   │   ├── header/           ← header con menú por rol y campana de notificaciones
│   │   ├── footer/           ← datos de contacto de la clínica
│   │   ├── confirmar-dialogo/← diálogo de confirmación genérico
│   │   ├── form-paciente/    ← formulario reutilizable de paciente
│   │   └── solicitar-turno/  ← flujo de turno reutilizable (operador + paciente)
│   └── pages/
│       ├── home/             ← pantalla principal (con y sin sesión)
│       ├── login/            ← formulario de login
│       ├── registro/         ← registro de paciente
│       ├── perfil/           ← datos del usuario logueado
│       ├── admin/            ← sedes, especialidades, coberturas, usuarios,
│       │                        auditoría y reportes
│       ├── medico/           ← agenda, turnos del día e historial clínico
│       ├── operador/         ← agenda, alta de paciente, asignar turno
│       ├── paciente/         ← nuevo turno, mis turnos, mis datos
│       ├── acceso-denegado/  ← 403
│       └── not-found/        ← 404
└── environments/
    └── environment.ts        ← URL base de la API (único lugar)
```

---

## Funcionalidades implementadas

### Semana 1 — Setup, Angular Material y autenticación

- ✅ Proyecto Angular 21 + Angular Material 21 (tema Azure/Blue)
- ✅ Estructura de carpetas separando servicios, guards, interceptores, modelos y páginas
- ✅ URL base de la API en un único lugar (`environment.ts`)
- ✅ Header con menú según rol, campana de notificaciones, botón cerrar sesión
- ✅ Footer con datos de contacto de la clínica
- ✅ Pantalla principal: sin sesión invita a registrarse/loguear; con sesión da la bienvenida
- ✅ Registro de paciente con coberturas cargadas desde el backend
- ✅ Validaciones de formulario con mensajes de error por campo
- ✅ Errores del backend mostrados al usuario (DNI/email duplicado, credenciales inválidas)
- ✅ Login con guardado de token en localStorage
- ✅ Sesión persistente al recargar (token + usuario en localStorage)
- ✅ Interceptor HTTP que agrega `Authorization: Bearer <token>` automáticamente
- ✅ Cerrar sesión elimina el token y redirige al home
- ✅ Pantalla "Mi perfil" con datos de `GET /auth/perfil`
- ✅ Guards por sesión (`authGuard`) y por rol (`rolGuard`)
- ✅ Rutas separadas por rol: `/admin`, `/medico`, `/operador`, `/paciente`
- ✅ Redirección a `/login` sin sesión, a `/acceso-denegado` con rol incorrecto
- ✅ Página 404 para rutas inexistentes

### Semanas 2–4 — Funcionalidades completas

#### Administrador
- ✅ Sedes: listado con filtro, alta, edición y baja con confirmación
- ✅ Especialidades: ídem
- ✅ Coberturas: ídem
- ✅ Gestión de usuarios: listado paginado con filtros, alta de operador/médico/administrador, edición
- ✅ Auditoría: tabla paginada de solo lectura con filtros

#### Operador
- ✅ Agenda: vista por fecha y sede, nueva agenda para cualquier médico en su sede
- ✅ Edición de agenda de médicos en su sede (agregar, modificar, eliminar rangos)
- ✅ Turnos confirmados por médico y fecha, con opción de cancelar
- ✅ Alta de paciente (reutiliza formulario compartido)
- ✅ Asignar turno a paciente (mismo flujo que "Nuevo turno", sede fija)

#### Paciente
- ✅ Nuevo turno paso a paso: especialidad → sede → médico → fecha → horario → nota y confirmación
- ✅ Mis turnos: listado con detalle desplegable, cancelación y visualización de historial
- ✅ Mis datos: edición de email, contraseña, teléfono y cobertura

#### Todos los roles — Notificaciones
- ✅ Campana en header con contador de no leídas
- ✅ Dropdown con listado; marcar como leída actualiza el contador al instante
- ✅ Contador se actualiza al confirmar, cancelar o atender un turno (sin recargar)
