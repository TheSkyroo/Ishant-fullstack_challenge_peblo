'use client';

import { Note } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Tag, Folder, Sparkles } from 'lucide-react';

interface NoteListProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (note: Note) => void;
}

export default function NoteList({ notes, selectedId, onSelect }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-4 text-center">
        No notes yet. Click &ldquo;New Note&rdquo; to get started.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {notes.map((note) => (
        <button
          key={note._id}
          onClick={() => onSelect(note)}
          className={`w-full text-left px-4 py-3 border-b border-gray-800 transition hover:bg-gray-800 ${
            selectedId === note._id ? 'bg-gray-800 border-l-2 border-l-violet-500' : ''
          }`}
        >
          <p className="text-sm font-medium text-white truncate mb-0.5">
            {note.title || 'Untitled Note'}
          </p>

          <p className="text-xs text-gray-500 truncate mb-1.5">
            {note.content
              ? note.content.replace(/[#*`>\-_]/g, '').trim().substring(0, 60) + '…'
              : 'No content'}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600">
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </span>

            {note.category && (
              <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
                <Folder className="w-2.5 h-2.5" />
                {note.category}
              </span>
            )}

            {note.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gray-700 text-xs text-gray-300"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}

            {note.tags.length > 2 && (
              <span className="text-xs text-gray-600">+{note.tags.length - 2}</span>
            )}

            {note.aiOutput && (
              <span title="Has AI summary">
                <Sparkles className="w-3 h-3 text-violet-500" />
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
