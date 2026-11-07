# Guía docente — CODEXIA Mobile Challenge

**Público:** estudiantes de preparatoria sin conocimientos de programación.

**Objetivo:** que cada equipo vea funcionar cinco pequeñas aplicaciones React Native en Expo Snack, haciendo cambios deliberadamente mínimos.

## Agenda de los 45 minutos

- **00:00–05:00**: explicación de `Text`, editor de CODEXIA y botón **PROBAR MI APP EN EXPO SNACK**. Se recomienda hacer una demostración muy breve con el primer reto.
- **05:00–11:00**: reto 1, saludo del equipo.
- **11:00–18:00**: reto 2, estilos.
- **18:00–25:00**: reto 3, tarjeta de avatar.
- **25:00–33:00**: reto 4, botón interactivo.
- **33:00–42:00**: reto 5, contador de energía.
- **42:00–45:00**: cierre, exhibición de aplicaciones y ranking.

## Respuestas esperadas

| Reto | Qué deben cambiar | Comprobación visual en Snack |
|---|---|---|
| 1 | `<Text>¡Hola, CODEXIA!</Text>` y `<Text>Equipo N</Text>` (N es número del equipo) | Aparecen los dos mensajes al centro. |
| 2 | En `container`, `backgroundColor: '#0F172A'`; en `title`, `color: '#22D3EE'` y `fontSize: 30` | Pantalla oscura con título azul neón grande. |
| 3 | `avatar = '🚀'` (u otro símbolo), `nombre = 'Cosmo'` y `poder = 'Velocidad'` (o valores propios) | Tarjeta con emoji, nombre y poder personalizados. |
| 4 | `setMensaje('¡Poder desbloqueado!')` dentro de `onPress` | Al tocar el botón cambia el mensaje. |
| 5 | `setEnergia(actual => actual + 5)` | Tras tres pulsaciones, muestra 15. |

Los estudiantes no deben escribir componentes desde cero ni instalar librerías; todo el código está preparado. Dales libertad para elegir nombres y emojis en el reto 3.

## Puntuación y ayuda

La nota incluye **penalización por tiempo**, igual que en CODEXIA Cybersecurity: cada reto desbloquea una banda de 20 puntos (1–20, 21–40, 41–60, 61–80, 81–100), pero el valor dentro de la banda baja conforme transcurren los 45 minutos. Ejemplo: cinco retos inmediatamente, 100; cinco en el último minuto, aproximadamente 81. Cero retos = 0. **Máximo general: 100 puntos.** Las tres pistas por reto son gratuitas. Si alguien se atasca, muéstrale cómo localizar la palabra del ejemplo y cambiarla sin borrar las llaves, comillas o etiquetas.

**Validación:** el servidor compara el código con los requisitos de cada minirreto, pero NO interpreta ni ejecuta JSX. Es importante pedir al alumno abrir Snack y comprobar la aplicación. El enlace de Snack se crea dinámicamente desde el editor actual: si cambian más código después de abrirlo, deben volver a pulsar el botón para enviar esos cambios a otra pestaña de Snack.

## Preparación técnica

Antes de empezar el taller, inicia `npm start` en una máquina conectada a la misma red Wi-Fi de los alumnos. Abre CODEXIA y Expo Snack en un navegador de prueba. Comprueba que la vista previa web de Snack puede ejecutarse en la red escolar: algunas redes bloquean dominios de desarrollo. Los alumnos pueden usar computadora portátil; no es indispensable instalar Expo Go ni usar un teléfono físico.

**Supabase:** CODEXIA Mobile Challenge utiliza la tabla `scores`, columna **`taller_3`** del Equipo 1 al 20. Cada minirreto validado desbloquea una banda de puntos, con penalización por tiempo, sin superar 100. Los otros talleres y `batalla_final` permanecen intactos. Si existe una nota previa de Taller 3 más alta, no disminuye; antes de una nueva competencia revisa esos puntajes históricos. Los tests locales NO escriben en la base real. Los resultados locales también quedan en `data/equipos.json`. Si no se han creado las filas, la app intentará crearlas; para ello la RLS debe permitir INSERT además de SELECT y UPDATE.

## Direcciones útiles

- Alumnos: `http://IP_DEL_SERVIDOR:3011/`
- Docente: `http://IP_DEL_SERVIDOR:3011/admin`
- Clasificación: `http://IP_DEL_SERVIDOR:3011/resultados`

Para cambiar textos, códigos iniciales o las reglas de comprobación, edita `mobile-levels.js`.

## Material de presentación y misión final

- La portada incluye el video proporcionado: https://youtu.be/C-SqjLy7K6Q. Muéstralo **antes** de presionar START; al iniciar se detiene el video.
- La tabla de `/resultados` conserva la apariencia de Cybersecurity y muestra las notas globales por columna. El menú SCORES continúa disponible para comparar actividades.
- **Al completar los cinco retos** aparece **Password para el dispositivo secreto de Ultrón: 1122**. Se oculta cuando expira la misión sin completar todos los niveles. No uses esa clave como credencial real de seguridad.
