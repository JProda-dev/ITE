# Pokédle League

Panel SaaS local para gestionar una competición entre amigos.

## Inicio

1. Instala Node.js 18 o superior.
2. Abre una terminal dentro de esta carpeta.
3. Ejecuta:

```bash
node server.js
```

4. Abre `http://localhost:3000`.

## Datos

Los jugadores y resultados se guardan en `database.json`, situado en la raíz. El servidor usa escritura atómica básica para reducir el riesgo de corrupción.

## Funciones

- Alta de jugadores.
- Registro y actualización de resultados diarios.
- Categorías: Adivina Pokémon, Silueta, Zoom/Carta y Descripción.
- Intentos y generación obligatorios.
- Ranking mensual.
- Media de puntos e intentos.
- Gráficos por categoría, generación y evolución mensual.
- Historial con filtros y eliminación.
- Diseño responsive.

## Producción

Esta versión está pensada para un grupo privado y un único proceso. Para publicarla en Internet conviene añadir autenticación, HTTPS y migrar el JSON a SQLite/PostgreSQL.
