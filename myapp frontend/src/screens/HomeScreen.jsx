import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { getStoredUser } from '../services/auth';
import Colors from '../theme/colors';

const FEATURES = [
  { icon: '📚', label: 'Notes',    color: Colors.accent3,  tab: 'Notes',    desc: 'Upload & access your notes' },
  { icon: '🗓️', label: 'Planner', color: Colors.accent2,  tab: 'Planner',  desc: 'AI-generated study plans' },
  { icon: '📈', label: 'Progress', color: Colors.green,    tab: 'Progress', desc: 'Track your study progress' },
  { icon: '📝', label: 'Mock Test',color: Colors.orange,   tab: 'Test',     desc: 'Generate & take tests' },
  { icon: '🤖', label: 'AI Chat',  color: Colors.accent,   tab: 'AI Chat',  desc: 'Ask your AI study tutor' },
];

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getStoredUser().then(setUser);
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good day, {firstName} 👋</Text>
              <Text style={styles.sub}>What would you like to study today?</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{firstName[0]}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Feature Grid */}
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.grid}>
            {FEATURES.map(f => (
              <TouchableOpacity
                key={f.label}
                style={[styles.card, { borderColor: f.color + '33' }]}
                onPress={() => navigation.navigate(f.tab)}
              >
                <View style={[styles.iconBg, { backgroundColor: f.color + '1a' }]}>
                  <Text style={styles.cardIcon}>{f.icon}</Text>
                </View>
                <Text style={styles.cardLabel}>{f.label}</Text>
                <Text style={styles.cardDesc}>{f.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 28, marginTop: 8 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.bright },
  sub: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: Colors.white, fontWeight: '800', fontSize: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.muted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: Colors.card, borderRadius: 16, padding: 18,
    borderWidth: 1 },
  iconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center',
    alignItems: 'center', marginBottom: 10 },
  cardIcon: { fontSize: 22 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: Colors.bright, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: Colors.muted, lineHeight: 16 },
});
