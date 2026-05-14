'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Note, AiOutput } from '@/lib/types';
import {
  Sparkles, Share2, Archive, Trash2, ArchiveRestore, X, Copy, Check,
  Tag, FolderOpen, Eye, EyeOff, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface NoteEditorProps {
  note: Note;
  onUpdate: (id: string, data: Partial<Note>) => Promise<Note>;
  onDelete: (id: string) => Promise<void>;
  onGenerateSummary: (id: string) => Promise<AiOutput>;
  onShare: (id: string) => Promise<{ shareId: string; shareUrl: string }>;
  onUnshare: (id: string) => Promise<void>;
}

const DEBOUNCE_MS = 800;

export default function NoteEditor({
  note,
  onUpdate,
  onDelete,
  onGenerateSummary,
  onShare,
  onUnshare,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(note.tags);
  const [category, setCategory] = useState(note.category);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<AiOutput | null>(note.aiOutput || null);
  const [showAiPanel, setShowAiPanel] = useState(!!note.aiOutput);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareId, setShareId] = useState(note.shareId || '');
  const [isPublic, setIsPublic] = useState(note.isPublic);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags);
    setCategory(note.category);
    setAiOutput(note.aiOutput || null);
    setShowAiPanel(!!note.aiOutput);
    setShareId(note.shareId || '');
    setIsPublic(note.isPublic);
    isFirstRender.current = true;
  }, [note._id]);

  const save = useCallback(
    async (newTitle: string, newContent: string, newTags: string[], newCategory: string) => {
      setSaving(true);
      try {
        await onUpdate(note._id, {
          title: newTitle,
          content: newContent,
          tags: newTags,
          category: newCategory,
        });
      } finally {
        setSaving(false);
      }
    },
    [note._id, onUpdate]
  );

  const scheduleSave = useCallback(
    (t: string, c: string, tg: string[], cat: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(t, c, tg, cat), DEBOUNCE_MS);
    },
    [save]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scheduleSave(title, content, tags, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, tags, category]);

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleGenerateSummary = async () => {
    setAiLoading(true);
    try {
      const output = await onGenerateSummary(note._id);
      setAiOutput(output);
      setShowAiPanel(true);
      toast.success('AI summary generated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const data = await onShare(note._id);
      setShareId(data.shareId);
      setIsPublic(true);
      toast.success('Share link created');
    } catch {
      toast.error('Failed to create share link');
    } finally {
      setShareLoading(false);
    }
  };

  const handleUnshare = async () => {
    try {
      await onUnshare(note._id);
      setShareId('');
      setIsPublic(false);
      toast.success('Note is now private');
    } catch {
      toast.error('Failed to remove share link');
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/shared/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    try {
      await onDelete(note._id);
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleArchiveToggle = async () => {
    try {
      await onUpdate(note._id, { isArchived: !note.isArchived });
      toast.success(note.isArchived ? 'Note restored' : 'Note archived');
    } catch {
      toast.error('Failed to update note');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {saving && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Saving…
            </>
          )}
          {!saving && <span className="text-gray-600">Auto-saved</span>}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreview(!preview)}
            title={preview ? 'Edit mode' : 'Preview mode'}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={handleGenerateSummary}
            disabled={aiLoading}
            title="Generate AI summary"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium transition"
          >
            {aiLoading ? (
              <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {aiLoading ? 'Generating…' : 'AI Summary'}
          </button>

          {isPublic && shareId ? (
            <div className="flex items-center gap-1">
              <button
                onClick={copyShareLink}
                title="Copy share link"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-white font-medium transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleUnshare}
                title="Make private"
                className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleShare}
              disabled={shareLoading}
              title="Create share link"
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleArchiveToggle}
            title={note.isArchived ? 'Restore note' : 'Archive note'}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            {note.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDelete}
            title="Delete note"
            className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pt-5 pb-2 shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title…"
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-600 border-none outline-none"
        />
      </div>

      {/* Meta row */}
      <div className="px-6 pb-3 shrink-0 flex flex-wrap gap-3 items-center">
        {/* Category */}
        <div className="flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="bg-transparent text-xs text-gray-400 border-none outline-none placeholder-gray-600 w-24"
          />
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-900/50 text-violet-300 text-xs"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tag…"
            className="bg-transparent text-xs text-gray-400 border-none outline-none placeholder-gray-600 w-20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-4" data-color-mode="dark">
        {preview ? (
          <div className="prose prose-invert max-w-none text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {content || <span className="text-gray-500 italic">Nothing to preview yet…</span>}
          </div>
        ) : (
          <MDEditor
            value={content}
            onChange={(v) => setContent(v || '')}
            preview="edit"
            hideToolbar={false}
            height="100%"
            style={{ background: 'transparent', boxShadow: 'none' }}
          />
        )}
      </div>

      {/* AI Panel */}
      {aiOutput && (
        <div className="shrink-0 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-violet-400 hover:text-violet-300 transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Insights
            </div>
            {showAiPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {showAiPanel && (
            <div className="px-5 pb-4 space-y-3">
              {aiOutput.suggestedTitle && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Suggested Title</p>
                  <p className="text-sm text-gray-200">{aiOutput.suggestedTitle}</p>
                </div>
              )}
              {aiOutput.summary && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Summary</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{aiOutput.summary}</p>
                </div>
              )}
              {aiOutput.actionItems?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Action Items</p>
                  <ul className="space-y-1">
                    {aiOutput.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
