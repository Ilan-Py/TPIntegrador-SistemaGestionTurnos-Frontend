# TP Integrador — Frontend
## Sistema de Gestión de Turnos Médicos

**IES Santa Fe · Programación 2 · 2026**  
**Autores:** Aaron Juárez & Ilan Pitashny

---

## Tecnologías

| Herramienta      | Versión   |
|------------------|-----------|
| Node.js          | 22.x LTS  |
| Angular CLI      | 21.x      |
| Angular          | 21.x      |
| Angular Material | 21.x      |
| TypeScript       | ~5.9      |

---

## Requisitos previos

- Node.js `^20.19.0`, `^22.12.0` o `^24.0.0`
- Angular CLI 21: `npm install -g @angular/cli@21`
- El backend corriendo en `http://localhost:4000` (ver instrucciones abajo)

---

## Instalación y ejecución

```bash
# Desde la carpeta clinica-frontend/
npm install
ng serve
```

La aplicación levanta en `http://localhost:4200`.

---

## Conexión con el backend

Este frontend consume la API del repositorio **TPIntegrador-SistemaGestionTurnos-Backend**.

### 1. Configurar el backend

```bash
# Desde la carpeta backend/
cp .env.example .env
```

Editá el `.env` con tus credenciales de MySQL:

```env
HOST=localhost
DATABASE=clinica
USER=root
PASSWORD=tu_contraseña
JWT_SECRET=ClaveSecretaTP2026
JWT_EXPIRES_IN=8h
PORT=4000
```

### 2. Crear la base de datos

Ejecutá los scripts SQL en orden desde MySQL Workbench (o la terminal):

```
backend/scripts/clinica_ampliada.sql
backend/scripts/usuarios_prueba.sql
```

### 3. Levantar el backend

```bash
npm install
npm run dev
# → Servidor corriendo en puerto 4000
```

### 4. Levantar el frontend

```bash
# En otra terminal, desde clinica-frontend/
ng serve
# → http://localhost:4200
```

La URL base de la API está definida en `src/environments/environment.ts` y puede cambiarse ahí si el backend corre en otro puerto.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── services/         ← auth.service, cobertura.service
│   │   ├── guards/           ← auth.guard, rol.guard
│   │   └── interceptors/     ← token.interceptor (agrega Bearer automáticamente)
│   ├── models/               ← interfaces TypeScript (Usuario, Cobertura, etc.)
│   ├── shared/
│   │   ├── header/           ← header con menú por rol
│   │   └── footer/           ← datos de contacto
│   └── pages/
│       ├── home/             ← pantalla principal (con y sin sesión)
│       ├── login/            ← formulario de login
│       ├── registro/         ← registro de paciente
│       ├── perfil/           ← datos del usuario logueado
│       ├── admin/            ← sección administrador (semana 2+)
│       ├── medico/           ← sección médico (semana 2+)
│       ├── operador/         ← sección operador (semana 2+)
│       ├── paciente/         ← sección paciente (semana 2+)
│       ├── acceso-denegado/  ← 403
│       ├── en-construccion/  ← placeholder semanas futuras
│       └── not-found/        ← 404
└── environments/
    └── environment.ts        ← URL base de la API
```

---

## Funcionalidades implementadas (Semana 1)

- ✅ Proyecto Angular 21 + Angular Material 21 (tema Azure/Blue)
- ✅ Estructura de carpetas separando servicios, guards, interceptores, modelos y páginas
- ✅ URL base de la API definida en un único lugar (`environment.ts`)
- ✅ Header con menú según rol, campana de notificaciones (decorativa), botón cerrar sesión
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
- ✅ Secciones de semanas futuras con pantalla "En construcción"
