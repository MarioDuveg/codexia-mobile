import React from 'react';
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
});
