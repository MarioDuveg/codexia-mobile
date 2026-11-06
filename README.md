# CODEXIA // MOBILE CHALLENGE

**Una página web lista para organizar cinco minirretos de React Native en Expo Snack, para equipos de preparatoria sin experiencia previa.**

Esta versión está adaptada del proyecto CODEXIA original. Conserva su estética, equipos 1–20, cronómetro del servidor, panel docente, ranking y sincronización opcional con Supabase. Reemplaza los retos de ciberseguridad por cinco ejercicios de desarrollo móvil.

## Iniciar la aplicación

Requiere **Node.js 18 o posterior** y conexión a Internet para abrir Expo Snack.

```bash
npm start
```

Abre **http://localhost:3011** en la computadora anfitriona. Los alumnos en la misma red pueden usar la URL `http://IP-DEL-SERVIDOR:3011` que aparece en la terminal. No uses `file://` ni publiques solamente el HTML: hace falta el servidor de Node para gestionar equipos, tiempo y validación.

Rutas:

- `/` — portada de alumnos, cinco retos y clasificación emergente.
- `/admin` — panel del docente. Si no fijas `ADMIN_PASSWORD`, la contraseña temporal se imprime en la terminal al iniciar.
- `/resultados` o `/scores` — clasificación pública en pantalla completa.
- `extras/resultados_externa.html` — visor externo de resultados que consulta Supabase directamente; se puede publicar de forma estática.

## Los cinco retos

| Nivel | Reto | Cambio que hacen | Tiempo sugerido | Puntos |
|---|---|---|---:|---:|
| 1 | ¡Hola, CODEXIA! | Cambiar los dos mensajes `Text` para mostrar el saludo y su número de equipo | 6 min | 20 |
| 2 | Cambia el skin | Editar `backgroundColor`, `color` y `fontSize` | 7 min | 20 |
| 3 | Crea tu avatar | Personalizar las constantes `avatar`, `nombre` y `poder` | 7 min | 20 |
| 4 | El botón mágico | Cambiar el mensaje emitido por `setMensaje` en `onPress` | 8 min | 20 |
| 5 | Contador de energía | Modificar el incremento de `setEnergia` de 1 a 5 | 9 min | 20 |

**Agenda sugerida (45 min):** introducción 5 min + retos 6 + 7 + 7 + 8 + 9 min + cierre 3 min.

**Puntuación EXACTA:** 0, 20, 40, 60, 80 o 100, según los retos validados. **No hay puntos por rapidez ni penalización por pistas.** El cronómetro del servidor vence a los 45 minutos. El mejor resultado de cada equipo se conserva cuando Supabase está configurado y operativo.

## Flujo de trabajo del alumno

1. Elegir un equipo del 1 al 20 y presionar **START** (esto inicia el reloj).
2. Leer la consigna. Se muestra un `App.js` con código de React Native listo para editar en la misma página.
3. Hacer uno, dos o tres cambios pequeños. Pueden usar hasta **tres pistas**.
4. Presionar **PROBAR MI APP EN EXPO SNACK**. Se abre una pestaña de Expo Snack con **el código tal como está en el editor**, transmitido mediante el parámetro `code` de su URL, con vista previa en `web`. **No es necesario crear y publicar manualmente cinco proyectos Snack.**
5. Regresar a CODEXIA y pulsar **VALIDAR MI CÓDIGO**. El servidor comprueba el cambio requerido. Si es correcto, otorga 20 puntos y desbloquea el siguiente nivel.

**Importante:** la validación es una *comprobación didáctica de fragmentos específicos del código*; **no compila ni ejecuta JSX en el servidor**. Un código que pasa la validación puede contener errores en otras partes. Por eso el alumno debe verificar visualmente el resultado y la interacción en Expo Snack. No es un sistema de evaluación antifraude ni supervisa que el alumno haya abierto efectivamente la pestaña.

Los cambios en el editor se guardan temporalmente en `sessionStorage` del navegador por intento y reto. El botón «RESTAURAR INICIO» revierte el código.

## Integración con Supabase: Mobile Challenge es `taller_3`

La actividad escribe únicamente la **columna `taller_3`** de la tabla `public.scores`, identificada por el número del equipo (`equipo` de 1 a 20). Se utiliza la misma URL y clave publicable que traía el proyecto original, salvo que se cambien con variables de entorno.

- Por cada reto validado se publica **20, 40, 60, 80 o 100**; no se publican ceros.
- El servidor actualiza `taller_3` con una petición REST equivalente a `supabase.from('scores').update({taller_3: puntos}).eq('equipo', equipo)`. Incluye el filtro adicional `taller_3=lt.puntos` para **no reducir** una nota alta ya guardada, incluso si el equipo reinicia.
- Si la fila del equipo no existe, intenta crearla con `equipo` y `taller_3`, dejando las otras columnas con sus valores predeterminados.
- El ranking muestra **TALLER 3 · MOBILE**, mientras que **BATALLA FINAL** es una categoría independiente. La columna `total` la calcula Supabase según tu esquema y no se escribe manualmente.
- **No se invoca** el antiguo RPC `registrar_batalla_final`, ni se modifica `batalla_final`, `taller_1`, `taller_2` o `taller_4`.
- Se necesitan permisos `SELECT`, `UPDATE` en `scores` y, cuando se inscriba un equipo inexistente, `INSERT`, junto con políticas RLS compatibles con tu clave publicable. Ejecuta `supabase/01_verificar_taller_3.sql` para verificar nombres y contenido sin modificar datos. Si tu tabla ya está preparada, **no hace falta ejecutar ningún SQL**.
- Si la petición falla, queda el puntaje en `data/equipos.json` y la API lo reintenta al consultar el estado. Los tests no escriben en el Supabase real.

**Ejemplo de la operación de escritura:**

```javascript
const { error } = await supabase
  .from('scores')
  .update({ taller_3: 90 })
  .eq('equipo', 5);
```

En CODEXIA se ejecuta desde Node mediante REST, sin cargar la librería `supabase-js`, y se añade la comprobación de nota máxima para evitar retrocesos.

**Seguridad:** una clave publicable no es secreta. Las políticas RLS de tu proyecto determinan quién puede alterar calificaciones. Este prototipo no ofrece protección antifraude contra clientes malintencionados; para evaluaciones formales conviene usar un backend autenticado y permisos más estrictos.

## Configuración opcional

```bash
PORT=3011 \
ADMIN_PASSWORD='TU_CONTRASENA_DOCENTE' \
CTF_DATA_DIR='./data' \
SUPABASE_URL='https://TU_PROYECTO.supabase.co' \
SUPABASE_PUBLISHABLE_KEY='sb_publishable_...' \
npm start
```

Para pruebas automáticas, sin afectar la base de datos real:

```bash
npm test
```

Los tests levantan un servidor simulado de Supabase, validan los cinco retos, controlan el límite de 45 minutos, los reintentos y que el puntaje jamás pase de 100.

## Archivos principales

- `app.js`: servidor web, sesiones, tiempos, rutas, verificaciones y Supabase.
- `mobile-levels.js`: contenido, `App.js` iniciales, pistas y reglas de los cinco retos. **Aquí puedes cambiar los ejercicios.**
- `public/index.html`, `public/main.js`, `public/styles.css`: experiencia principal.
- `public/challenge.css`: editor y diseño de cada minirreto.
- `GUIA_DOCENTE.md`: respuestas e instrucciones para facilitar el taller.
- `supabase/01_verificar_taller_3.sql`: consulta opcional para comprobar la columna de puntuaciones. El SQL antiguo de Batalla Final se conserva como referencia en `supabase/legacy_instalar_batalla_final.sql` (no ejecutarlo para esta actividad).

## Copias de respaldo de los ejercicios

La carpeta `snacks/` incluye los cinco archivos `App.js` iniciales por separado. Son útiles si necesitas repartir códigos en el aula o si la red escolar bloquea los enlaces precargados. Para usarlos, abre `https://snack.expo.dev/` y reemplaza el contenido de `App.js` por el código correspondiente.
