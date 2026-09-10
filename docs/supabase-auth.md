# Sistema de Autenticación de PokeGuide con Supabase

Esta documentación detalla la arquitectura, configuración y funcionamiento del sistema de cuentas y perfiles de usuario en **PokéGuide**.

---

## 1. Variables de Entorno (`.env.local`)

PokeGuide utiliza Vite para cargar las variables del frontend. Asegúrate de tener en tu archivo local `.env.local`:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<tu-clave-publica>
```

> ⚠️ **Importante**: Nunca introduzcas la clave `service_role` ni claves secretas en el frontend. La clave pública / publishable key es la única requerida y segura para usar en el navegador junto con Row Level Security (RLS).

---

## 2. Configuración de la Base de Datos (`supabase/schema.sql`)

Para que Supabase pueda guardar los perfiles y validar la unicidad de los nombres de usuario, debes aplicar el script SQL en tu panel de Supabase:

1. Ve a tu panel de Supabase: `https://supabase.com/dashboard/project/<tu-proyecto>/sql/new`
2. Abre el archivo [`supabase/schema.sql`](../supabase/schema.sql) de este repositorio.
3. Copia todo su contenido, pégalo en el editor SQL de Supabase y haz clic en **Run**.

### ¿Qué crea este script?
- **Tabla `public.profiles`**: Vinculada a `auth.users(id)` mediante clave foránea con eliminación en cascada.
- **Columna `username_normalized`**: Columna computada `LOWER(TRIM(username))` con restricción `UNIQUE` para garantizar que nombres como `Gabo`, `gabo` y `GABO` se consideren idénticos e impidan duplicados a nivel de motor PostgreSQL.
- **Restricciones CHECK**: Valida que el nombre de usuario tenga entre 3 y 20 caracteres y solo contenga letras, números, guiones y guiones bajos (`^[a-zA-Z0-9_-]+$`).
- **Políticas RLS**:
  - `SELECT`: Público para que los usuarios puedan ver nombres públicos y comprobar disponibilidad.
  - `INSERT`: Restringido a que `auth.uid() = id`.
  - `UPDATE`: Restringido a que `auth.uid() = id`.
- **Triggers**:
  - `update_profiles_updated_at`: Actualiza automáticamente la marca de tiempo `updated_at`.

---

## 3. Arquitectura en el Frontend

### Proveedor de Contexto (`src/context/AuthContext.jsx`)
Es la única fuente de verdad para el estado de autenticación:
- **`user`**: Objeto de usuario retornado por Supabase Auth.
- **`session`**: Sesión activa con JWT y tokens de refresco persistentes.
- **`profile`**: Datos del registro en `public.profiles` (`{ id, username, created_at, updated_at }`).
- **`isAuthenticated`**: Booleano (`Boolean(user)`).
- **`isProfileComplete`**: Booleano (`Boolean(user && profile?.username)`).
- **`openAuthModal(view)` / `closeAuthModal()`**: Control global de modales (`login`, `register`, `forgot-password`, `reset-password`).

---

## 4. Flujo de Registro con Email y Contraseña

1. El usuario introduce `username`, `email`, `password` (mín. 8 caracteres) y confirma la contraseña.
2. Mientras escribe el nombre de usuario, un mecanismo con **debounce de 380 ms** consulta `profiles` para verificar si está disponible, mostrando retroalimentación visual inmediata.
3. Al pulsar **Crear cuenta**, se invoca `supabase.auth.signUp()`.
4. **Si la confirmación por correo está activada en Supabase**:
   - Muestra el mensaje informativo: *"Cuenta creada correctamente. Te hemos enviado un correo de confirmación. Revisa tu bandeja de entrada para activar tu cuenta."*
5. **Si la confirmación está desactivada**:
   - Se inicia sesión automáticamente, se guarda el perfil en `profiles` y se cierra el modal.
6. **Protección contra condiciones de carrera**:
   - Si otro usuario registra el mismo nombre en el mismo instante, la base de datos rechaza la inserción por la restricción `UNIQUE` y el frontend muestra el error: *"Este nombre de usuario acaba de ser ocupado. Por favor, elige otro."*

---

## 5. Flujo de Google OAuth

1. El usuario pulsa **Continuar con Google**.
2. Se inicia la autenticación mediante `supabase.auth.signInWithOAuth({ provider: 'google' })`.
3. Al regresar a PokeGuide:
   - `AuthContext` obtiene la sesión mediante `onAuthStateChange`.
   - Consulta `public.profiles` con el `id` del usuario autenticado.
   - **Usuario recurrente (perfil existe)**: Accede inmediatamente a PokeGuide.
   - **Usuario nuevo o con registro interrumpido (perfil NO existe)**: Se abre de forma obligatoria el modal `UsernameSetupModal`.
   - **Regla estricta**: El usuario DEBE escribir su propio nombre de usuario. **Nunca** se utiliza el email ni el display name de Google como nombre de usuario automático.

---

## 6. Recuperación de Contraseña

1. En el modal de login, el usuario hace clic en *"¿Olvidaste tu contraseña?"*.
2. Ingresa su correo y pulsa *"Enviar enlace de recuperación"*.
3. Por seguridad, se emite una respuesta neutral: *"Si existe una cuenta asociada a ese correo, recibirás instrucciones para restablecer tu contraseña."*
4. Al hacer clic en el enlace del correo, Supabase redirige al usuario a PokeGuide y emite el evento `PASSWORD_RECOVERY`.
5. `AuthContext` detecta este evento y abre automáticamente el formulario para definir la nueva contraseña.

---

## 7. Fase 2: Perfiles, Avatares y Ajustes de Cuenta

### Configuración del Storage de Supabase (`supabase/migrations/add_profile_avatar.sql`)

Para habilitar las fotos de perfil, ejecuta en el editor SQL de Supabase el archivo [`supabase/migrations/add_profile_avatar.sql`](../supabase/migrations/add_profile_avatar.sql):

1. Agrega la columna `avatar_url TEXT` a `public.profiles`.
2. Crea el bucket público `avatars` con límite de 10 MB y tipos MIME permitidos (`image/*`).
3. Aplica políticas RLS estrictas en `storage.objects`:
   - **Lectura**: Pública para cualquier usuario o visitante.
   - **Subida / Modificación / Borrado**: Restringido al propietario del archivo mediante `auth.uid()::text = (storage.foldername(name))[1]`.

### Editor Visual de Avatar (`AvatarEditor.jsx`)
- **Pan & Zoom interactivo**: Soporta arrastre táctil y con ratón, además de barra de zoom y botones de acercar/alejar.
- **Máscara circular**: Guía visual translúcida en tiempo real que delimita la zona circular final del avatar.
- **5 Previsualizaciones de resolución en tiempo real**:
  - `64x64 px` (Miniatura compacta)
  - `128x128 px` (Estándar)
  - `256x256 px` (Recomendado con etiqueta visual destacada)
  - `384x384 px` (Alta definición)
  - `512x512 px` (Máxima fidelidad)
  - Cada resolución cuenta con su propio canvas dinámico de renderizado y escala visual diferencial.
- **Previsualización de contexto Navbar**: Simula fielmente cómo lucirá el botón de usuario en la barra superior de PokéGuide (`[◉] Nombre ▾`).
- **Exportación optimizada**: Convierte el recorte seleccionado en un Blob **WebP** comprimido en el cliente antes de subirlo a Supabase Storage.
- **Cache-Busting**: Genera URLs con `?t=timestamp` para evitar que el navegador mantenga en caché una imagen antigua al actualizar la foto.

### Modal de Perfil (`ProfileModal.jsx`)
- Muestra la foto actual con fallback a la inicial del usuario si no hay foto o si falla la carga.
- Botón para subir nueva foto (con validación de tamaño máx. 10 MB) que abre el `AvatarEditor`.
- Botón de eliminar foto con confirmación.
- Cambio de nombre de usuario con validación en vivo de formato (3-20 caracteres, `^[a-zA-Z0-9_-]+$`) y disponibilidad debounced (380 ms).
- Visualización del correo asociado y botón de acceso rápido a Ajustes.

### Modal de Ajustes (`SettingsModal.jsx`)
Organizado en pestañas:
- **Cuenta**: Modificación de correo electrónico con envío de confirmación de Supabase.
- **Seguridad**: Cambio de contraseña segura (mínimo 8 caracteres) y botón para cerrar sesión activa.
- **Preferencias**: Selector visual de idioma (Español, Español Latino, English) sincronizado con el estado global de PokéGuide.
- **Datos**: Zona informativa sobre la privacidad de la cuenta y eliminación de datos.

### Menú de Usuario (`UserMenuDropdown.jsx`)
- Muestra el avatar circular recortado tanto en el trigger del Navbar como en el encabezado del dropdown.
- El encabezado y el elemento **"👤 Mi perfil"** abren el `ProfileModal`.
- El elemento **"⚙️ Ajustes"** abre el `SettingsModal` en la pestaña correspondiente.
- Conserva intacto el acceso a Favoritos, Próximamente (IA), selector de idioma y Cerrar sesión.
