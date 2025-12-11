# 📱 Módulo Droguerías - Sistema de Chat WhatsApp-Style

## ✨ ¿Qué se ha implementado?

Se ha completado la **reescritura integral del módulo de droguerías** transformándolo en un **sistema de chat moderno tipo WhatsApp** con las siguientes características:

### 🔒 Seguridad - Solo ADMIN Puede Cambiar Droguería
- ✅ Endpoint `/api/droguerias/set_active/` protegido con verificación `es_admin()`
- ✅ Retorna **403 Forbidden** para usuarios no-admin
- ✅ Frontend también valida: solo admin ve dropdown para cambiar droguería
- ✅ Cambios globales: cuando admin cambia droguería, se actualiza en TODOS los paneles

### 🌍 Implementación Global - Visible en Todos los Paneles
- ✅ **Context API** (`DrogueriaContext`) sincroniza estado entre todas las páginas
- ✅ **Widget integrado** en `panelAdmin.jsx` muestra droguería activa
- ✅ **localStorage** persiste la droguería seleccionada entre sesiones
- ✅ Preparado para integración en paneles de empleado, home, etc.

### 📊 Backend Completado (Django + DRF)

| Archivo | Cambios |
|---------|---------|
| `droguerias/models.py` | ✅ Modelo `Conversacion` + `Mensaje` nuevos; Campo `horarios` en `Drogueria` |
| `droguerias/serializers.py` | ✅ Serializadores para Conversacion, Mensaje con métodos display |
| `droguerias/views.py` | ✅ ViewSets CRUD + endpoints `set_active`, `get_active` (admin-only) |
| `droguerias/urls.py` | ✅ Rutas registradas para droguerias, conversaciones, mensajes |
| Migrations | ✅ `0002_drogueria_horarios_alter_drogueria_propietario...` aplicada |

**Endpoints Disponibles:**
```
POST   /api/droguerias/set_active/          → Cambiar droguería activa (⚠️ ADMIN)
GET    /api/droguerias/get_active/          → Obtener droguería activa (⚠️ ADMIN)
GET    /api/conversaciones/                 → Listar conversaciones del usuario
POST   /api/conversaciones/                 → Crear conversación
GET    /api/mensajes/                       → Listar mensajes filtrados
POST   /api/mensajes/                       → Enviar nuevo mensaje
```

### 🎨 Frontend Completado (React + Vite + CSS Moderno)

| Componente | Descripción |
|-----------|------------|
| `DrogueriaContext.jsx` | Estado global: droguería activa, conversaciones, mensajes (localStorage) |
| `DrogueriasList.jsx` | Sidebar izquierdo: lista de droguerías (clickeable solo para admin) |
| `ChatWindow.jsx` | Ventana principal: header + mensajes + input |
| `MessageItem.jsx` | Burbujas de chat: usuario (azul/derecha), droguería (gris/izquierda) |
| `InputMessage.jsx` | Campo textarea + botón enviar (Enter para enviar) |
| `droguerias.jsx` | Página principal (protegida por admin-only route) |
| `DrogueriaWidget.jsx` | Mini widget integrado en panelAdmin con dropdown |
| `droguerias.css` | Estilos principales: layout grid, WhatsApp-style bubbles |
| `drogueriaWidget.css` | Estilos del widget: gradiente, animaciones |

**Rutas Disponibles:**
```
GET /droguerias              → Página principal de chat (⚠️ admin-only via PrivateRoute)
```

---

## 🚀 Cómo Usar

### 1. Backend (Django)
```bash
cd "c:\Rikolino\m\MIMS--mainplusus (2)\MIMS--mainplusus\MIMS--mainplus\MIMS--main"

# Aplicar migraciones (ya están hechas)
python manage.py migrate droguerias

# Iniciar servidor
python manage.py runserver
```
✅ Backend en: `http://localhost:8000`

### 2. Frontend (React + Vite)
```bash
cd frontend

# Instalar dependencias (si es necesario)
npm install

# Iniciar servidor dev
npm run dev
```
✅ Frontend en: `http://localhost:5173`

### 3. Acceder a la Aplicación
1. Navega a `http://localhost:5173`
2. Inicia sesión como **usuario admin**
3. En panel administrativo verás:
   - **Widget "Droguería Activa"** en la parte superior
   - Botón **"Droguerías"** en la barra lateral
4. Click en "Droguerías" para ir a la página principal de chat

---

## 🧪 Casos de Prueba Importante

### ✅ Prueba 1: Admin Cambiar Droguería
1. Admin abre widget en panelAdmin
2. Selecciona droguería diferente del dropdown
3. ✅ Debe actualizarse inmediatamente en localStorage
4. ✅ Debe reflejarse en página `/droguerias`

### ✅ Prueba 2: Enviar Mensaje
1. Admin ve chat con droguería seleccionada
2. Escribe mensaje y presiona Enter
3. ✅ Burbuja azul aparece (lado derecho = usuario)
4. ✅ Se guarda en tabla `droguerias_mensaje` con `remitente_tipo='usuario'`

### ⛔ Prueba 3: Non-Admin No Puede Cambiar
1. Inicia sesión como no-admin (empleado)
2. Intenta navegar a `/droguerias`
3. ✅ Debe obtener error 403 o redirección

### ⛔ Prueba 4: Non-Admin No Puede Usar Endpoint
1. Como no-admin, en DevTools console ejecuta:
```javascript
fetch('/api/droguerias/set_active/', {
  method: 'POST',
  body: JSON.stringify({ drogueria_id: 1 })
})
```
2. ✅ Debe responder con `403 Forbidden`

---

## 📁 Estructura de Archivos

```
MIMS--main/
├── droguerias/                    # Backend
│   ├── models.py                  # ✅ Drogueria, Conversacion, Mensaje
│   ├── serializers.py             # ✅ Serializers CRUD
│   ├── views.py                   # ✅ ViewSets + endpoints admin-only
│   ├── urls.py                    # ✅ Rutas registradas
│   └── migrations/
│       └── 0002_drogueria_horarios...py  # ✅ Aplicada
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Droguerias/
│       │   │   ├── DrogueriasList.jsx         # ✅ NEW
│       │   │   ├── ChatWindow.jsx             # ✅ NEW
│       │   │   ├── MessageItem.jsx            # ✅ NEW
│       │   │   └── InputMessage.jsx           # ✅ NEW
│       │   └── DrogueriaWidget.jsx            # ✅ NEW
│       ├── context/
│       │   └── DrogueriaContext.jsx           # ✅ NEW
│       ├── pages/
│       │   ├── droguerias.jsx                 # ✅ NEW
│       │   └── panelAdmin.jsx                 # ✅ UPDATED (widget integrado)
│       ├── styles/
│       │   ├── droguerias.css                 # ✅ NEW
│       │   └── drogueriaWidget.css            # ✅ NEW
│       └── App.jsx                            # ✅ UPDATED (provider + route)
│
└── GUIA_PRUEBAS_DROGUERIAS.md              # 📖 Guía completa de pruebas
```

---

## 🎯 Características Implementadas

### ✨ Estado Global (Context API)
- Sincronización entre todas las páginas
- localStorage persistence
- Auto-refresh en cambio de droguería

### 🔐 Seguridad Multinivel
- Backend: `es_admin()` check en ViewSets
- Frontend: `PrivateRoute` con validación de rol
- Aislamiento de datos: usuarios solo ven sus propios mensajes

### 💬 Chat Moderno
- Burbujas estilo WhatsApp (usuario/droguería diferenciadas)
- Timestamps en español ("hace 2 minutos")
- Auto-scroll al último mensaje
- Enter para enviar, Shift+Enter para nueva línea

### 📱 Diseño Responsive
- Desktop: 2 columnas (lista + chat)
- Mobile: Full-width chat, lista oculta
- Gradientes moderno, sombras, animaciones

### 🌐 Integración Global
- Widget visible en panelAdmin.jsx
- Preparado para empleadoDashboard.jsx
- localStorage sincroniza entre pestañas

---

## 🔧 Configuración Técnica

**Backend Stack:**
- Django 5.2.8
- Django REST Framework
- Python 3.x

**Frontend Stack:**
- React 19
- Vite 7.2.4
- date-fns (para timestamps en español)
- Lucide-react (iconos)
- Tailwind CSS (parcial)

**Base de Datos:**
- SQLite3 (desarrollo)
- Tablas: `droguerias_drogueria`, `droguerias_conversacion`, `droguerias_mensaje`

---

## 📝 Notas Importantes

⚠️ **Solo ADMIN puede:**
- Cambiar droguería activa (`POST /api/droguerias/set_active/`)
- Acceder a página `/droguerias`
- Ver selector de droguería en dropdown del widget

✅ **Cualquier usuario puede:**
- Ver y enviar mensajes en su conversación
- Cambiar entre droguerías (en la lista, pero sin cambiar la activa global)

🔄 **Cambios globales:**
- Cuando admin cambia droguería, se actualiza en localStorage
- Otros usuarios ven el cambio reflejado en sus contextos
- Widget en panelAdmin muestra siempre la droguería activa actual

---

## 📞 Soporte

Si encuentras errores:
1. Revisa `GUIA_PRUEBAS_DROGUERIAS.md` para troubleshooting
2. Verifica que Django migrations están aplicadas: `python manage.py migrate`
3. Limpiar localStorage: `localStorage.clear()` en DevTools
4. Reinicia servidores: Ctrl+C en ambas terminales y vuelve a iniciar

---

## ✅ Checklist de Compleción

- [x] Backend models creados y migrados
- [x] Backend serializers implementados
- [x] Backend ViewSets CRUD con admin-only checks
- [x] Frontend Context con estado global
- [x] Frontend componentes de chat (lista, ventana, mensaje, input)
- [x] Frontend página principal `/droguerias`
- [x] Frontend widget integrado en panelAdmin
- [x] Frontend estilos completos (CSS)
- [x] Frontend App.jsx configurado (provider + route)
- [x] date-fns instalado
- [x] Seguridad: solo admin puede cambiar droguería
- [x] Documentación: guía de pruebas

🎉 **¡Módulo completamente implementado y listo para usar!**

