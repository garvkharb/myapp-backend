import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, updateProfile } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setUser(data);
      setName(data.name || '');
      setSelectedSubjects(data.subjects || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (!trimmed) return;
    if (selectedSubjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSubjectInput('');
      return;
    }
    setSelectedSubjects(prev => [...prev, trimmed]);
    setSubjectInput('');
  };

  const removeSubject = (subject) => {
    setSelectedSubjects(prev => prev.filter(s => s !== subject));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name,
        subjects: selectedSubjects,
      });
      // Update stored user data
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        await AsyncStorage.setItem('user', JSON.stringify({
          ...parsed,
          name: updated.name,
          subjects: updated.subjects,
        }));
      }
      setUser(updated);
      Alert.alert('Success', 'Profile updated successfully!');
      setEditingName(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          navigation.replace('Login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6c63ff" size="large" />
      </View>
    );
  }

  const initials = (name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Name Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👤 Your Name</Text>
            {!editingName && (
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {editingName ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#888"
              autoFocus
            />
          ) : (
            <Text style={styles.nameValue}>{name || 'Not set'}</Text>
          )}
        </View>

        {/* Subjects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 My Subjects</Text>
          <Text style={styles.sectionHint}>
            Type a subject and tap Add. Tap a chip to remove it.
          </Text>

          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.addInput]}
              value={subjectInput}
              onChangeText={setSubjectInput}
              placeholder="e.g. Organic Chemistry"
              placeholderTextColor="#888"
              onSubmitEditing={addSubject}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addSubject}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {selectedSubjects.length > 0 ? (
            <>
              <View style={styles.subjectGrid}>
                {selectedSubjects.map(subject => (
                  <TouchableOpacity
                    key={subject}
                    style={[styles.subjectChip, styles.subjectChipActive]}
                    onPress={() => removeSubject(subject)}
                  >
                    <Text style={[styles.subjectChipText, styles.subjectChipTextActive]}>
                      {subject}  ✕
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.selectedBox}>
                <Text style={styles.selectedTitle}>Your current subjects:</Text>
                <Text style={styles.selectedList}>
                  {selectedSubjects.join(' • ')}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noSubjects}>
              No subjects added yet. Type one above and tap Add!
            </Text>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>💾 Save Changes</Text>
          }
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  center: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: '#2a2a3e',
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#888' },
  section: {
    backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#2a2a3e',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  sectionHint: { fontSize: 11, color: '#888', marginBottom: 14, marginTop: -8 },
  editBtn: { fontSize: 13, color: '#6c63ff', fontWeight: '700' },
  input: {
    backgroundColor: '#2a2a3e', color: '#fff', borderRadius: 10,
    padding: 13, fontSize: 15, borderWidth: 1, borderColor: '#444',
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  addInput: { flex: 1 },
  addBtn: {
    backgroundColor: '#6c63ff', borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 13,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  nameValue: { fontSize: 15, color: '#ccc', paddingVertical: 4 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  subjectChip: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#444', backgroundColor: '#2a2a3e',
  },
  subjectChipActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  subjectChipText: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  subjectChipTextActive: { color: '#fff' },
  selectedBox: {
    backgroundColor: '#6c63ff11', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#6c63ff33',
  },
  selectedTitle: { fontSize: 11, color: '#888', marginBottom: 4, fontWeight: '700', textTransform: 'uppercase' },
  selectedList: { fontSize: 13, color: '#6c63ff', fontWeight: '600', lineHeight: 20 },
  noSubjects: { fontSize: 13, color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
  saveBtn: {
    backgroundColor: '#6c63ff', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 12,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  logoutBtn: {
    borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#ff4444',
  },
  logoutText: { color: '#ff4444', fontWeight: '700', fontSize: 15 },
});