import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Linking,
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import { getNotes, deleteNote as deleteNoteApi, uploadNote } from '../services/api';
import Colors from '../theme/colors';

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await getNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, []);

  const handleUpload = async () => {
    try {
      const result = await pick({
        allowMultiSelection: false,
        type: [types.pdf, types.images],
      });
      const file = result[0];
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type || 'application/pdf',
      });
      form.append('subject', 'General');
      setLoading(true);
      const newNote = await uploadNote(form);
      setNotes(prev => [newNote, ...prev]);
      Alert.alert('Success', 'Note uploaded successfully!');
    } catch (e) {
      if (e?.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Upload Error', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = (id) => {
    if (!id) return Alert.alert('Error', 'Invalid note.');
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteNoteApi(id);
            setNotes(prev => prev.filter(n => n.id !== id));
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const openNote = (url) => {
    if (!url) return Alert.alert('Error', 'File URL not available.');
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open file.')
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unknown date';
    return d.toLocaleDateString();
  };

  const filtered = notes.filter(n =>
    (n.filename || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📚 My Notes</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
            <Text style={styles.uploadText}>+ Upload</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Search notes..."
          placeholderTextColor={Colors.muted}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => openNote(item.storage_url)}>
                <View style={styles.noteCard}>
                  <Text style={styles.noteIcon}>
                    {item.file_type === 'pdf' ? '📄' : '🖼️'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteName} numberOfLines={1}>
                      {item.filename}
                    </Text>
                    <Text style={styles.noteMeta}>
                      {item.subject} • {formatDate(item.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteNote(item.id)}>
                    <Text style={[styles.actionBtn, { color: 'red' }]}>Del</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No notes yet. Upload your first one!</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.bright },
  uploadBtn: { backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  uploadText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  search: { marginHorizontal: 16, backgroundColor: Colors.card, borderRadius: 10, padding: 12, color: Colors.text, borderWidth: 1, borderColor: Colors.border, marginBottom: 8, fontSize: 14 },
  noteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  noteIcon: { fontSize: 24 },
  noteName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  noteMeta: { fontSize: 12, color: Colors.muted },
  actionBtn: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  empty: { textAlign: 'center', color: Colors.muted, marginTop: 60, fontSize: 14 },
});