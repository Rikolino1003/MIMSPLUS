# 🧪 Guía de Pruebas - Módulo Droguerías (Chat WhatsApp-Style)

## 📋 Resumen de Cambios Completados

### Backend (Django)
✅ **Models** (`droguerias/models.py`)
- Nueva tabla `Conversacion`: relación droguería-usuario con constraint unique_together
- Nueva tabla `Mensaje`: remitente_tipo ('usuario'|'drogueria'), remitente_id, texto, leído flag
- Expandida tabla `Drogueria`: agregado campo `horarios` (TextField)

✅ **Serializers** (`droguerias/serializers.py`)
- `ConversacionSerializer`: nested mensajes con último mensaje display
- `MensajeSerializer`: método `get_remitente_nombre()` para resolver usuario/droguería

✅ **ViewSets** (`droguerias/views.py`)
- `DrogueriaViewSet.set_active()`: ⚠️ **ADMIN-ONLY** - Cambia droguería activa globalmente
- `DrogueriaViewSet.get_active()`: ⚠️ **ADMIN-ONLY** - Obtiene droguería activa actual
- `ConversacionViewSet`: filtra por usuario actual, crea si no existe
- `MensajeViewSet`: aislamiento por usuario, auto-set remitente_tipo='usuario'

✅ **Migrations** 
- Applied: `0002_drogueria_horarios_alter_drogueria_propietario_and_more`

### Frontend (React + Vite)
✅ **Context Global** (`src/context/DrogueriaContext.jsx`)
- Estado: `drogueriaActiva`, `conversacionActiva`, `mensajes[]`, `droguerias[]`
- Métodos: `cambiarDrogueria()` (ADMIN), `cargarConversacion()`, `enviarMensaje()`
- localStorage persistence en `drogueriaActiva`

✅ **Componentes Chat** (`src/components/Droguerias/`)
- `DrogueriasList.jsx`: lista de droguerías con selector (ADMIN only)
- `ChatWindow.jsx`: ventana principal de chat
- `MessageItem.jsx`: burbujas de mensajes con timestamp en español
- `InputMessage.jsx`: textarea + botón enviar

✅ **Página Principal** (`src/pages/droguerias.jsx`)
- Ruta protegida `/droguerias` (admin-only via PrivateRoute)
- Integra DrogueriasList + ChatWindow

✅ **Widget** (`src/components/DrogueriaWidget.jsx`)
- Mini selector integrado en panelAdmin.jsx
- Muestra droguería activa con dropdown (ADMIN only)

✅ **Estilos** (`src/styles/droguerias.css`, `drogueriaWidget.css`)
- Diseño WhatsApp-style: burbujas de chat, colores teal/gris, responsive

✅ **Configuración App** (`src/App.jsx`)
- Envuelto con `<DrogueriaProvider>`
- Nueva ruta: `path="droguerias"` protegida por admin

---

## 🚀 Flujo de Pruebas

### 1️⃣ Verificar Servidores Ejecutando
```powershell
# Backend Django debe estar en http://localhost:8000
# Frontend Vite debe estar en http://localhost:5173

# Terminal 1: Backend
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2️⃣ Acceso a Panel Admin
1. Navega a `http://localhost:5173/`
2. Inicia sesión con usuario **admin**
3. Ve a **Panel Administrativo**
4. Deberías ver nuevo widget **"Droguería Activa"** en la parte superior del main

### 3️⃣ Probar Widget en panelAdmin
1. En el widget, expande el dropdown
2. Cambia de droguería (debe mostrar lista de todas las droguerías disponibles)
3. Verifica que se actualice la droguería activa en localStorage

### 4️⃣ Acceder a Página de Chat Principal
1. Desde el panel admin, click en botón **"Droguerías"** en la barra lateral
2. **O** navega directamente a `http://localhost:5173/droguerias`
3. Deberías ver:
   - **Lado izquierdo**: Lista de todas las droguerías (para admin)
   - **Lado derecho**: Ventana de chat con droguería activa

### 5️⃣ Probar Cambiar Droguería
1. Click en una droguería diferente en la lista izquierda
2. Verifica que:
   - Cambia el header del chat (nombre de droguería)
   - Se cargan los mensajes de esa conversación
   - La droguería se guarda en localStorage

### 6️⃣ Enviar Mensaje
1. En el InputMessage (parte inferior), escribe un mensaje
2. Click en **"Enviar"** o presiona **Enter**
3. Verifica que:
   - Mensaje aparece en burbuja azul (lado derecho = usuario)
   - Se guarda en la BD (tabla `Mensaje`)
   - Campo se limpia después de enviar

### 7️⃣ Probar Restricción ADMIN-ONLY
1. Cierra sesión como admin
2. Inicia sesión con usuario **no-admin** (empleado)
3. Intenta navegar a `http://localhost:5173/droguerias`
4. **Esperado**: Error 403 o redirección (debe estar protegida por `PrivateRoute`)

### 8️⃣ Verificar que NO-ADMIN No Pueda Cambiar Droguería
1. Si logras acceder (bug), intenta cambiar de droguería
2. En la consola del navegador, deberías ver error `403 Forbidden`
3. Backend debe rechazar: `POST /api/droguerias/set_active/` con usuario no-admin

### 9️⃣ Probar Mensajes en Tiempo Real
1. Abre 2 pestañas: una como admin, otra en incógnita (otro usuario)
2. Admin envía mensaje desde droguería activa
3. Ambas pestañas deberían mostrar el mensaje (requiere polling o WebSocket)

### 🔟 Probar Persistencia localStorage
1. En navegador, abre DevTools → Application → LocalStorage
2. Busca key: `drogueriaActiva`
3. Debe contener JSON con estructura: `{ id, nombre, codigo, ... }`
4. Recarga la página (`F5`)
5. Verifica que la droguería activa se restaure desde localStorage

---

## 🔍 Endpoints Disponibles

### Droguerías
- `GET /api/droguerias/` - Listar todas
- `GET /api/droguerias/{id}/` - Obtener una
- `POST /api/droguerias/set_active/` - ⚠️ ADMIN ONLY - Cambiar activa
- `GET /api/droguerias/get_active/` - ⚠️ ADMIN ONLY - Obtener activa

### Conversaciones
- `GET /api/conversaciones/` - Listar conversaciones del usuario actual
- `POST /api/conversaciones/` - Crear nueva conversación
- `GET /api/conversaciones/{id}/` - Obtener conversación con mensajes

### Mensajes
- `GET /api/mensajes/` - Listar mensajes del usuario (filtrado por conversaciones)
- `POST /api/mensajes/` - Crear nuevo mensaje
- `POST /api/mensajes/{id}/marcar_leido/` - Marcar como leído

---

## 📊 Estructura de Datos en BD

### Tabla: `droguerias_conversacion`
```sql
id          | INTEGER PRIMARY KEY
drogueria_id| FOREIGN KEY (droguerias_drogueria)
usuario_id  | FOREIGN KEY (usuarios_usuario)
creada      | DATETIME
actualizada | DATETIME
-- CONSTRAINT: (drogueria_id, usuario_id) UNIQUE
```

### Tabla: `droguerias_mensaje`
```sql
id              | INTEGER PRIMARY KEY
conversacion_id | FOREIGN KEY (droguerias_conversacion)
remitente_tipo  | VARCHAR ('usuario' | 'drogueria')
remitente_id    | INTEGER (usuario.id o drogueria.id según tipo)
texto           | TEXT
creado          | DATETIME
leido           | BOOLEAN (default False)
```

---

## 🎨 Estilos Implementados

### Colores
- **Primario**: Teal/Cyan (#06b6d4)
- **Mensajes Usuario**: Azul/Teal (derecha)
- **Mensajes Droguería**: Gris (#e2e8f0, izquierda)
- **Fondo**: Blanco (#ffffff)

### Layout
- **Desktop**: Grid 320px (lista) | 1fr (chat)
- **Mobile**: Full-width chat, lista oculta
- **Burbujas**: Rounded corners, shadows, padding

### Animaciones
- Dropdown: slideDown (fade + translateY)
- Hover: color change en items de lista

---

## ⚠️ Puntos Críticos de Seguridad

✅ **Backend**
- `set_active()` y `get_active()` verifican `es_admin()` - retorna 403 si no es admin
- ViewSets filtran mensajes por usuario actual (no puedes ver mensajes de otros)

✅ **Frontend**
- Ruta `/droguerias` protegida con `<PrivateRoute allowedRoles={["admin"]}>`
- Widget solo muestra dropdown si usuario es admin
- DrogueriaWidget imports se validan en Context

---

## 🐛 Troubleshooting

### "Error 403 en set_active aunque soy admin"
- Verifica que `es_admin()` en backend retorna True
- Asegúrate que el token JWT es válido
- Revisa que usuario tiene `is_superuser=True` o `is_staff=True`

### "Mensajes no aparecen después de enviar"
- Abre DevTools → Network → verifica POST a `/api/mensajes/` retorna 201
- Revisa que conversacion existe (GET `/api/conversaciones/`)
- Limpia localStorage: `localStorage.clear()` y recarga

### "Widget no aparece en panelAdmin"
- Verifica que DrogueriaWidget.jsx import está en panelAdmin.jsx
- Revisa que DrogueriaProvider envuelve todo en App.jsx
- Abre DevTools → Console → busca errores de componentes

### "localStorage no persiste entre recargas"
- Verifica que localStorage está habilitado en navegador
- Revisa DevTools → Application → LocalStorage → tiene `drogueriaActiva`
- En incógnita, localStorage puede no persistir entre sesiones

---

## ✅ Checklist Final

- [ ] Servidores Django y Vite ejecutando
- [ ] Admin puede acceder a `/droguerias`
- [ ] No-admin recibe 403 al intentar `/droguerias`
- [ ] Widget visible en panelAdmin.jsx
- [ ] Cambiar droguería desde widget funciona
- [ ] Enviar mensaje crea registro en BD
- [ ] localStorage persiste drogueriaActiva
- [ ] Estilos CSS se ven correcto (WhatsApp-style)
- [ ] Timestamps en español ("hace 2 minutos")
- [ ] Admin-only checks funcionan en backend

---

**🎉 Si todos los pasos pasan, ¡el módulo está listo para producción!**

