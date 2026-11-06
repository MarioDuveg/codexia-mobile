import React from 'react';
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
});
