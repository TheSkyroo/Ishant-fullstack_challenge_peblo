'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes } from '@/hooks/useNotes';
import { Note } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import NoteList from '@/components/NoteList';
import NoteEditor from '@/components/NoteEditor';
import { Plus, Search, X, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notes, loading, fetchNotes, createNote, updateNote, deleteNote, generateSummary, shareNote, unshareNote } = useNotes();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const loadNotes = useCallback(
    (s = search, t = filterTag, archived = showArchived) => {
      const params: Record<string, string> = {};
      if (s) params.search = s;
      if (t) params.tag = t;
      if (archived) params.archived = 'true';
      fetchNotes(params);
    },
    [search, filterTag, showArchived, fetchNotes]
  );

  useEffect(() => {
    if (user) loadNotes();
  }, [user, showArchived, filterTag]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadNotes(search), 300);
  }, [search]);

  useEffect(() => {
    if (notes.length > 0) {
      const tags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();
      setAllTags(tags);
    }
  }, [notes]);

  const handleCreateNote = async () => {
    try {
      const note = await createNote({ title: 'Untitled Note', content: '' });
      const p: Record<string, string> = {};
      if (showArchived) p.archived = 'true';
      await fetchNotes(p);
      setSelectedNote(note);
    } catch {
      toast.error('Failed to create note');
    }
  };

  const handleUpdate = async (id: string, data: Partial<Note>) => {
    const updated = await updateNote(id, data);
    if (selectedNote?._id === id) setSelectedNote(updated);
    return updated;
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
    if (selectedNote?._id === id) setSelectedNote(null);
    loadNotes();
  };

  const handleGenerateSummary = async (id: string) => {
    const output = await generateSummary(id);
    if (selectedNote?._id === id) {
      setSelectedNote((prev) => prev ? { ...prev, aiOutput: output } : prev);
    }
    return output;
  };

  const handleShare = async (id: string) => {
    const data = await shareNote(id);
    if (selectedNote?._id === id) {
      setSelectedNote((prev) => prev ? { ...prev, isPublic: true, shareId: data.shareId } : prev);
    }
    return data;
  };

  const handleUnshare = async (id: string) => {
    await unshareNote(id);
    if (selectedNote?._id === id) {
      setSelectedNote((prev) => prev ? { ...prev, isPublic: false, shareId: undefined } : prev);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-950">
      <Sidebar
        onArchiveToggle={() => {
          setShowArchived((v) => !v);
          setSelectedNote(null);
        }}
        showArchived={showArchived}
      />

      {/* Note list panel */}
      <div className="w-72 shrink-0 border-r border-gray-800 flex flex-col bg-gray-950">
        {/* Search + actions */}
        <div className="p-3 border-b border-gray-800 space-y-2">
          <button
            onClick={handleCreateNote}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-8 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {filterTag && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-600 text-white text-xs">
                1
              </span>
            )}
          </button>

          {showFilterPanel && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Filter by tag</p>
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                    className={`px-2 py-0.5 rounded-full text-xs transition ${
                      filterTag === tag
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-b border-gray-800">
          <p className="text-xs text-gray-500">
            {showArchived ? 'Archived' : 'Notes'} · {notes.length} total
          </p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <NoteList
            notes={notes}
            selectedId={selectedNote?._id || null}
            onSelect={setSelectedNote}
          />
        )}
      </div>

      {/* Editor panel */}
      <div className="flex-1 overflow-hidden">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote._id}
            note={selectedNote}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onGenerateSummary={handleGenerateSummary}
            onShare={handleShare}
            onUnshare={handleUnshare}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-600 text-sm">
            Select a note to start editing
          </div>
        )}
      </div>
    </div>
  );
}
