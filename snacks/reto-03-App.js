import React from 'react';
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
});
