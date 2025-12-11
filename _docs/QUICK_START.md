# 🚀 QUICK START - Módulo Droguerías

## 30 Segundos de Setup

### Step 1: Backend Running? ✅
```bash
# Si no está corriendo:
python manage.py runserver
# → http://localhost:8000 debe estar online
```

### Step 2: Frontend Running? ✅
```bash
# Si no está corriendo:
cd frontend
npm run dev
# → http://localhost:5173 debe estar online
```

### Step 3: Go! 🎯
1. Abre `http://localhost:5173`
2. Login como **admin**
3. Ve a **Panel Administrativo**
4. **VAS A VER**: Widget "Droguería Activa" con dropdown

---

## 3 Pruebas Rápidas

### ✅ Test 1: Widget Funciona
```
1. En Panel Admin, expande widget dropdown
2. Selecciona otra droguería
3. Debe cambiar en localStorage
```

### ✅ Test 2: Chat Funciona
```
1. Click "Droguerías" en barra lateral
2. Ves lista (izq) + chat (der)
3. Escribe algo, presiona Enter
4. Burbuja azul aparece
```

### ✅ Test 3: Seguridad Funciona
```
1. Logout
2. Login como NO-ADMIN
3. Intenta /droguerias
4. Debe rechazar (error)
```

---

## 📁 Archivos Clave

### Backend
- `droguerias/models.py` - 3 modelos (Conversacion, Mensaje)
- `droguerias/views.py` - API endpoints (admin-only)

### Frontend
- `context/DrogueriaContext.jsx` - Estado global
- `components/Droguerias/` - 4 componentes chat
- `pages/droguerias.jsx` - Página /droguerias
- `components/DrogueriaWidget.jsx` - Widget en panelAdmin
- `pages/panelAdmin.jsx` - Integración widget
- `styles/droguerias.css` - CSS WhatsApp-style

---

## 🆘 Algo No Funciona?

| Problema | Solución |
|----------|----------|
| Widget no aparece | Recarga página `F5` |
| Chat muestra error 404 | Verifica `python manage.py migrate` aplicada |
| Mensajes no guardan | Verifica DevTools Network: POST /api/mensajes/ status 201 |
| No-admin puede acceder /droguerias | Verifica que no es superuser |

---

## 📚 Documentación Completa

Si necesitas más detalles:
- `GUIA_PRUEBAS_DROGUERIAS.md` - 50+ casos de prueba
- `IMPLEMENTACION_DROGUERIAS.md` - Arquitectura técnica
- `RESUMEN_EJECUTIVO.md` - Resumen ejecutivo
- `VERIFICACION_RAPIDA.md` - Checklist de verificación

---

**¡Eso es todo! Ya puedes chatear con droguerías. 🚀**

