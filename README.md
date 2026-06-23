# WordGuess League Dashboard

Dashboard estático preparado para GitHub Pages.

## Estructura

- `index.html`
- `data/users.json`
- `data/scores.json`

## Funcionamiento

El HTML lee los datos desde los JSON de la carpeta `data`.

Como GitHub Pages es estático, el navegador no puede escribir directamente sobre esos JSON del repositorio.
Por eso el dashboard guarda cambios en `localStorage` y permite exportar `users.json` y `scores.json`.
Para que los demás usuarios vean los cambios, sube los JSON exportados de nuevo a la carpeta `data` del repositorio.

## Uso recomendado

1. Sube la carpeta completa al repositorio.
2. Activa GitHub Pages.
3. El primer usuario configura los 3 países del día.
4. Exporta `scores.json` y súbelo a `/data/scores.json`.
5. Los demás usuarios ya verán esos países al entrar.
6. Cada cierto tiempo, exporta y sube los JSON actualizados.

## Si quieres guardado online real

Para que cada usuario guarde datos y todos los vean automáticamente sin subir JSON manualmente,
necesitas un backend externo: Firebase, Supabase, Google Sheets API o una pequeña API propia.
No es recomendable meter un token de GitHub en el HTML porque quedaría visible públicamente.
