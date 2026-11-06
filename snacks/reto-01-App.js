import React from 'react';
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
});
