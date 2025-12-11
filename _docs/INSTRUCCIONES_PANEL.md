# INSTRUCCIONES PARA VERIFICAR EL PANEL DEL EMPLEADO

## PASO 1: INICIAR LOS SERVIDORES

Necesitas abrir DOS terminales:

### Terminal 1 - Backend Django (puerto 8000)
```bash
cd c:\Rikolino\m\MIMS--main
python manage.py runserver
```

Debe mostrar: `Starting development server at http://127.0.0.1:8000/`

### Terminal 2 - Frontend Vite (puerto 5173)
```bash
cd c:\Rikolino\m\MIMS--main\frontend
npm run dev
```

Debe mostrar: `Local:   http://localhost:5173/`

---

## PASO 2: ACCEDER AL SISTEMA

1. Abre tu navegador en: `http://localhost:5173`
2. Login con:
   - **Usuario**: `empleado`
   - **Contraseña**: `Empleado123!`
3. Deberías ver el panel del empleado

---

## PASO 3: VERIFICAR LAS ESTADÍSTICAS

En el navegador:
1. Abre Developer Tools: **F12**
2. Ve a la pestaña **Console**
3. Busca líneas que empiezan con `[loadStats]`
4. Deberías ver:
   - `[loadStats] Iniciando...`
   - `[loadStats] Fetching data...`
   - `[loadStats] Respuestas raw: [...]` (con datos)
   - `[loadStats] Arrays normalized: {...}`
   - `[loadStats] Stats CALCULADAS: {...}` (con números)

---

## PASO 4: SI SIGUEN VIÉNDOSE EN 0

### En la consola (F12), busca:
- Mensajes de error rojo (stderr)
- Respuestas vacías `{ data: [] }`
- Status de error en Network tab

### Verifica:
1. ¿Está el token almacenado? En Console ejecuta:
   ```javascript
   localStorage.getItem('token')
   ```
   Debe devolver un string largo (no null/undefined)

2. ¿Devuelve datos la API? En Console ejecuta:
   ```javascript
   fetch('http://localhost:8000/api/pedidos/pedidos/', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     }
   }).then(r => r.json()).then(d => console.log('Pedidos:', d))
   ```

---

## DATOS DE PRUEBA DISPONIBLES

En la base de datos hay:
- **6 Pedidos**: 3 pendientes, 2 procesados, 1 entregado
- **54 Medicamentos**: 7 con stock bajo, 2 vencidos

Si no se muestran, revisa la consola para errores.
