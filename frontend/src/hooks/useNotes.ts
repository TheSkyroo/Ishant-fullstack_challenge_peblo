import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { Note } from '@/lib/types';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchNotes = useCallback(async (params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/notes', { params });
      setNotes(res.data.notes);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = async (data: Partial<Note>) => {
    const res = await api.post('/notes', data);
    return res.data.note as Note;
  };

  const updateNote = async (id: string, data: Partial<Note>) => {
    const res = await api.patch(`/notes/${id}`, data);
    setNotes((prev) => prev.map((n) => (n._id === id ? res.data.note : n)));
    return res.data.note as Note;
  };

  const deleteNote = async (id: string) => {
    await api.delete(`/notes/${id}`);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  const generateSummary = async (id: string) => {
    const res = await api.post(`/notes/${id}/generate-summary`);
    setNotes((prev) =>
      prev.map((n) => (n._id === id ? { ...n, aiOutput: res.data.aiOutput } : n))
    );
    return res.data.aiOutput;
  };

  const shareNote = async (id: string) => {
    const res = await api.post(`/notes/${id}/share`);
    setNotes((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, isPublic: true, shareId: res.data.shareId } : n
      )
    );
    return res.data;
  };

  const unshareNote = async (id: string) => {
    await api.delete(`/notes/${id}/share`);
    setNotes((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isPublic: false, shareId: undefined } : n))
    );
  };

  return {
    notes,
    loading,
    total,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    generateSummary,
    shareNote,
    unshareNote,
    setNotes,
  };
}
