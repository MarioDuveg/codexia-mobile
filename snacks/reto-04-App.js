import React from 'react';
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
});
