'use strict';

// Los cinco App.js iniciales no requieren paquetes adicionales en Expo Snack.
const LEVELS = [
  {
    title: '¡Hola, CODEXIA!', topic: 'TEXT', minutes: 6,
    kicker: 'APP 01 // PRIMER MENSAJE',
    story: 'Tu primera aplicación ya funciona, pero saluda al mundo equivocado. Personaliza la pantalla para identificar a tu equipo.',
    goal: 'Cambia «Hola, mundo» por «¡Hola, CODEXIA!» y «Equipo XX» por tu número de equipo.',
    steps: ['Busca las dos líneas que contienen <Text>.', 'Edita únicamente lo que aparece entre <Text> y </Text>.', 'Abre tu código en Expo Snack y verifica los dos mensajes.'],
    hints: ['Text muestra palabras en una aplicación móvil.', 'Busca «Hola, mundo» y «Equipo XX»; están cerca de la mitad del archivo.', 'Debes ver exactamente «¡Hola, CODEXIA!» y «Equipo N» (N = tu número de equipo).'],
    starter: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, mundo</Text>
      <Text style={styles.subtitle}>Equipo XX</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1020' },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#A5B4FC', fontSize: 18, marginTop: 12 },
});`,
  },
  {
    title: 'Cambia el skin', topic: 'STYLES', minutes: 7,
    kicker: 'APP 02 // MODO GAMER',
    story: 'La aplicación abre, pero sus colores son demasiado simples. Conviértela en una pantalla de videojuego con tres cambios.',
    goal: 'Pon el fondo #0F172A, el título #22D3EE y el tamaño del título en 30.',
    steps: ['Busca la propiedad backgroundColor dentro de container.', 'En title cambia color y fontSize.', 'Abre Expo Snack: comprueba el fondo oscuro y el título azul neón.'],
    hints: ['backgroundColor pinta el fondo. color pinta las letras. fontSize controla su tamaño.', 'Busca StyleSheet.create al final del código.', 'Valores esperados: backgroundColor: "#0F172A", color: "#22D3EE", fontSize: 30.'],
    starter: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MODO GAMER</Text>
      <Text style={styles.subtitle}>Personaliza mi apariencia</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  title: { color: '#111827', fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: '#64748B', fontSize: 16, marginTop: 14 },
});`,
  },
  {
    title: 'Crea tu avatar', topic: 'COMPONENTS', minutes: 7,
    kicker: 'APP 03 // IDENTIDAD DIGITAL',
    story: 'Tu equipo necesita una tarjeta de jugador para entrar al torneo. Elige cómo será tu personaje.',
    goal: 'Cambia el avatar ❔ por un emoji, escribe el nombre de tu personaje y asigna un poder especial.',
    steps: ['Localiza las constantes avatar, nombre y poder.', 'Sustituye sus valores manteniendo las comillas.', 'Abre Expo Snack y mira tu tarjeta personalizada.'],
    hints: ['Una constante guarda un valor que después se muestra en la pantalla.', 'Solo tienes que cambiar lo que va entre comillas en las tres primeras constantes.', 'Ejemplo: avatar = "🚀", nombre = "Cosmo", poder = "Velocidad". Escoge los tuyos.'],
    starter: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  const avatar = '❔';
  const nombre = 'SIN NOMBRE';
  const poder = 'SIN PODER';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.avatar}>{avatar}</Text>
        <Text style={styles.name}>{nombre}</Text>
        <Text style={styles.detail}>PODER: {poder}</Text>
        <Text style={styles.badge}>JUGADOR CODEXIA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11132B', justifyContent: 'center', padding: 28 },
  card: { alignItems: 'center', padding: 30, borderRadius: 20, backgroundColor: '#272451', borderWidth: 2, borderColor: '#A78BFA' },
  avatar: { fontSize: 70, marginBottom: 14 },
  name: { color: 'white', fontSize: 27, fontWeight: 'bold', textAlign: 'center' },
  detail: { color: '#C4B5FD', fontSize: 16, marginTop: 12, textAlign: 'center' },
  badge: { color: '#FDE68A', fontSize: 12, marginTop: 25, fontWeight: 'bold' },
});`,
  },
  {
    title: 'El botón mágico', topic: 'ONPRESS', minutes: 8,
    kicker: 'APP 04 // ACCIÓN DESBLOQUEADA',
    story: 'Los botones permiten que una aplicación reaccione. Este botón ya responde, pero envía un mensaje incorrecto.',
    goal: 'Haz que al tocar «ACTIVAR PODER» aparezca exactamente «¡Poder desbloqueado!».',
    steps: ['Busca onPress y dentro de él la función setMensaje.', 'Cambia únicamente el texto PENDIENTE por ¡Poder desbloqueado!.', 'En Expo Snack toca el botón para comprobar que cambia el mensaje.'],
    hints: ['onPress indica qué hace la app cuando alguien toca un botón.', 'Busca esta parte: setMensaje("PENDIENTE").', 'La acción debe llamar a setMensaje("¡Poder desbloqueado!").'],
    starter: `import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function App() {
  const [mensaje, setMensaje] = React.useState('Botón listo');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BOTÓN MÁGICO</Text>
      <Text style={styles.message}>{mensaje}</Text>
      <Pressable style={styles.button} onPress={() => setMensaje('PENDIENTE')}>
        <Text style={styles.buttonText}>ACTIVAR PODER</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101827', padding: 24 },
  title: { color: '#FBBF24', fontSize: 25, fontWeight: 'bold' },
  message: { color: '#FFFFFF', fontSize: 19, marginVertical: 25, textAlign: 'center' },
  button: { padding: 18, borderRadius: 14, backgroundColor: '#7C3AED' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});`,
  },
  {
    title: 'Contador de energía', topic: 'USESTATE', minutes: 9,
    kicker: 'APP 05 // CARGA FINAL',
    story: 'La aplicación suma energía con cada toque, pero el héroe necesita recargas más potentes para ganar la batalla.',
    goal: 'Haz que cada toque de «GANAR ENERGÍA» sume 5 puntos en lugar de 1.',
    steps: ['Encuentra setEnergia(actual => actual + 1).', 'Cambia únicamente el 1 por 5.', 'En Expo Snack toca tres veces: debe mostrar 5, 10 y 15.'],
    hints: ['useState permite recordar valores y actualizar la pantalla.', 'Busca el operador + dentro de onPress.', 'Esta parte debe quedar: setEnergia(actual => actual + 5).'],
    starter: `import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function App() {
  const [energia, setEnergia] = React.useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ENERGÍA DEL HÉROE</Text>
      <Text style={styles.energy}>⚡ {energia}</Text>
      <Pressable style={styles.button} onPress={() => setEnergia(actual => actual + 1)}>
        <Text style={styles.buttonText}>GANAR ENERGÍA</Text>
      </Pressable>
      <Text style={styles.tip}>Toca 3 veces: ¿llegas a 15?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', padding: 24 },
  title: { color: '#E5E7EB', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  energy: { color: '#34D399', fontSize: 68, fontWeight: 'bold', marginVertical: 25 },
  button: { padding: 18, backgroundColor: '#059669', borderRadius: 14 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  tip: { color: '#9CA3AF', marginTop: 25 },
});`,
  },
];

function codeWithoutComments(code) {
  // Comprueba los cambios concretos del ejercicio; no ejecuta código JSX.
  return code.replace(/\/\*[\s\S]*?\*\/|(^|\s)\/\/[^\n\r]*/g, '$1');
}
function styleBlock(code, name) {
  const found = code.match(new RegExp('\\b' + name + '\\s*:\\s*\\{([^}]*)\\}', 'm'));
  return found ? found[1] : '';
}
function extractConst(code, name) {
  const found = code.match(new RegExp('\\bconst\\s+' + name + '\\s*=\\s*([\\x27"`])([^\\r\\n]*?)\\1\\s*;', 'm'));
  return found ? found[2].trim() : null;
}
function validateCode(level, source, teamNumber) {
  if (typeof source !== 'string' || source.length > 12000 || source.length < 80) return 'Envía el código completo de App.js (máximo 12 000 caracteres).';
  const code = codeWithoutComments(source);
  if (!/export\s+default\s+function\s+App\s*\(/.test(code) || !/<View\b/.test(code) || !/<Text\b/.test(code)) {
    return 'Conserva la estructura de la aplicación: App, View y Text.';
  }
  switch (level) {
    case 1:
      if (!/<Text\b[^>]*>\s*¡Hola, CODEXIA!\s*<\/Text>/.test(code)) return 'El saludo debe mostrarse exactamente como «¡Hola, CODEXIA!». Mira el primer Text.';
      if (!new RegExp('<Text\\b[^>]*>\\s*Equipo\\s+' + teamNumber + '\\s*<\\/Text>').test(code)) return 'El segundo Text debe mostrar «Equipo ' + teamNumber + '».';
      return null;
    case 2: {
      const container = styleBlock(code, 'container');
      const title = styleBlock(code, 'title');
      if (!/\bbackgroundColor\s*:\s*['"]#0F172A['"]/i.test(container)) return 'En container, el fondo debe ser #0F172A.';
      if (!/\bcolor\s*:\s*['"]#22D3EE['"]/i.test(title)) return 'En title, el color del texto debe ser #22D3EE.';
      if (!/\bfontSize\s*:\s*30\b/.test(title)) return 'En title, fontSize debe valer 30.';
      return null;
    }
    case 3: {
      const avatar = extractConst(code, 'avatar');
      const nombre = extractConst(code, 'nombre');
      const poder = extractConst(code, 'poder');
      if (!avatar || avatar === '❔' || avatar.length > 12) return 'Elige otro emoji o símbolo para la constante avatar.';
      if (!nombre || nombre === 'SIN NOMBRE' || nombre.length < 2 || nombre.length > 40) return 'Escribe un nombre para tu personaje en la constante nombre.';
      if (!poder || poder === 'SIN PODER' || poder.length < 2 || poder.length > 40) return 'Escribe una habilidad en la constante poder.';
      if (!code.includes('{avatar}') || !code.includes('{nombre}') || !code.includes('{poder}')) return 'Mantén las tres variables dentro de la tarjeta para que se muestren.';
      return null;
    }
    case 4:
      if (!/\bonPress\s*=\s*\{\s*\(\s*\)\s*=>\s*setMensaje\s*\(\s*['"]¡Poder desbloqueado!['"]\s*\)\s*\}/.test(code)) return 'Dentro de onPress, usa setMensaje("¡Poder desbloqueado!").';
      if (!/\{mensaje\}/.test(code)) return 'Mantén {mensaje} para mostrar el texto en la pantalla.';
      return null;
    case 5:
      if (!/\bonPress\s*=\s*\{\s*\(\s*\)\s*=>\s*setEnergia\s*\(\s*actual\s*=>\s*actual\s*\+\s*5\s*\)\s*\}/.test(code)) return 'El botón debe sumar 5: setEnergia(actual => actual + 5).';
      if (!/\{energia\}/.test(code)) return 'Mantén {energia} para mostrar el contador.';
      return null;
    default: return 'Nivel desconocido.';
  }
}

module.exports = { LEVELS, validateCode };
