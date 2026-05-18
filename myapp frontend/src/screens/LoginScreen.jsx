import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://myapp-backend-8yap.onrender.com'; // Keep your existing IP here

const POPULAR_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'History', 'Geography', 'Computer Science',
  'Economics', 'Accountancy', 'Political Science', 'Hindi',
];

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isLogin && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin
        ? { email, password }
        : { email, password, name, subjects: selectedSubjects };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Something went wrong');
      await AsyncStorage.setItem('token', data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>📚 StudyMate</Text>
        <Text style={styles.subtitle}>Your AI-powered study companion</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Subject selection on signup */}
          {!isLogin && (
            <View>
              <Text style={styles.subjectLabel}>
                📖 Select your subjects (optional)
              </Text>
              <Text style={styles.subjectHint}>
                You can update these anytime from your profile
              </Text>
              <View style={styles.subjectGrid}>
                {POPULAR_SUBJECTS.map(subject => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectChip,
                      selectedSubjects.includes(subject) && styles.subjectChipActive,
                    ]}
                    onPress={() => toggleSubject(subject)}
                  >
                    <Text style={[
                      styles.subjectChipText,
                      selectedSubjects.includes(subject) && styles.subjectChipTextActive,
                    ]}>
                      {subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedSubjects.length > 0 && (
                <Text style={styles.selectedCount}>
                  ✅ {selectedSubjects.length} subject{selectedSubjects.length > 1 ? 's' : ''} selected
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            setIsLogin(!isLogin);
            setSelectedSubjects([]);
          }}>
            <Text style={styles.toggle}>
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 32 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 24 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#2a2a3e', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 16 },
  subjectLabel: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4, marginTop: 4 },
  subjectHint: { fontSize: 11, color: '#888', marginBottom: 12 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  subjectChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#444', backgroundColor: '#2a2a3e',
  },
  subjectChipActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  subjectChipText: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  subjectChipTextActive: { color: '#fff' },
  selectedCount: { fontSize: 12, color: '#6c63ff', marginBottom: 12, fontWeight: '700' },
  button: { backgroundColor: '#6c63ff', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toggle: { color: '#6c63ff', textAlign: 'center', marginTop: 16, fontSize: 14 },
});