'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { NotebookPen, Sparkles, Tag, Folder, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SharedNote {
  title: string;
  content: string;
  tags: string[];
  category: string;
  author: string;
  updatedAt: string;
  aiOutput?: {
    summary: string;
    actionItems: string[];
    suggestedTitle: string;
  };
}

export default function SharedNotePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [note, setNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get(`/shared/${shareId}`)
      .then((res) => setNote(res.data.note))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
        <NotebookPen className="w-12 h-12 text-gray-700 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Note not found</h1>
        <p className="text-gray-400 text-sm">
          This note may have been made private or the link is incorrect.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8 text-violet-500">
          <NotebookPen className="w-5 h-5" />
          <span className="font-bold text-white">Peblo Notes</span>
          <span className="text-gray-600 text-sm ml-auto">Shared note</span>
        </div>

        {/* Note card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
          <h1 className="text-2xl font-bold text-white mb-3">{note.title || 'Untitled Note'}</h1>

          {/* Meta */}
          <div className="flex flex-wrap gap-3 mb-5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </span>
            <span>by {note.author}</span>
            {note.category && (
              <span className="flex items-center gap-1">
                <Folder className="w-3.5 h-3.5" />
                {note.category}
              </span>
            )}
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-300 text-xs"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert max-w-none text-gray-200 text-sm leading-relaxed whitespace-pre-wrap border-t border-gray-800 pt-5">
            {note.content || <span className="text-gray-500 italic">No content</span>}
          </div>

          {/* AI output */}
          {note.aiOutput && (
            <div className="mt-6 pt-5 border-t border-gray-800 space-y-4">
              <div className="flex items-center gap-2 text-violet-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI Insights
              </div>

              {note.aiOutput.summary && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Summary</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{note.aiOutput.summary}</p>
                </div>
              )}

              {note.aiOutput.actionItems?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Action Items</p>
                  <ul className="space-y-1">
                    {note.aiOutput.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Shared via Peblo Notes — AI-powered collaborative workspace
        </p>
      </div>
    </div>
  );
}
