import sqlite3
import os

db_path = 'db.sqlite3'

if not os.path.exists(db_path):
    print(f"❌ BD no encontrada en {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Listar tablas
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cur.fetchall()
print("📊 Tablas en BD:")
for t in tables:
    print(f"  - {t[0]}")

# Contar registros
print("\n📈 Conteo de registros:")
try:
    cur.execute("SELECT COUNT(*) FROM usuarios_usuario")
    print(f"  Usuarios: {cur.fetchone()[0]}")
except Exception as e:
    print(f"  Usuarios: ERROR - {e}")

try:
    cur.execute("SELECT COUNT(*) FROM pedidos_pedido")
    print(f"  Pedidos: {cur.fetchone()[0]}")
except Exception as e:
    print(f"  Pedidos: ERROR - {e}")

try:
    cur.execute("SELECT COUNT(*) FROM facturacion_factura")
    print(f"  Facturas: {cur.fetchone()[0]}")
except Exception as e:
    print(f"  Facturas: ERROR - {e}")

try:
    cur.execute("SELECT COUNT(*) FROM mensajes_mensaje")
    print(f"  Mensajes: {cur.fetchone()[0]}")
except Exception as e:
    print(f"  Mensajes: ERROR - {e}")

# Verificar usuarios
print("\n👤 Usuarios en BD:")
try:
    cur.execute("SELECT id, username, email, rol FROM usuarios_usuario LIMIT 5")
    for row in cur.fetchall():
        print(f"  ID {row[0]}: {row[1]} ({row[2]}) - Rol: {row[3]}")
except Exception as e:
    print(f"  ERROR: {e}")

conn.close()
print("\n✅ Inspección completada")
