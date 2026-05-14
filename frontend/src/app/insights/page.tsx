'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { InsightData } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { NotebookPen, Archive, Sparkles, Tag, TrendingUp, Clock } from 'lucide-react';

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.get('/insights').then((res) => {
        setData(res.data);
        setLoading(false);
      });
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    { label: 'Total Notes', value: data.totalNotes, icon: NotebookPen, color: 'text-violet-400' },
    { label: 'Archived', value: data.archivedNotes, icon: Archive, color: 'text-gray-400' },
    { label: 'AI Summaries', value: data.notesWithAI, icon: Sparkles, color: 'text-yellow-400' },
    { label: 'AI Requests', value: data.aiUsageCount, icon: TrendingUp, color: 'text-green-400' },
    { label: 'This Week', value: data.notesThisWeek, icon: Clock, color: 'text-blue-400' },
    { label: 'Tags Used', value: data.topTags.length, icon: Tag, color: 'text-pink-400' },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-950">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-bold text-white mb-6">Productivity Insights</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly activity chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Notes Created — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.weeklyActivity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af', fontSize: 12 }}
                  itemStyle={{ color: '#c4b5fd' }}
                  labelFormatter={(v) => new Date(v as string).toLocaleDateString()}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.weeklyActivity.map((_, i) => (
                    <Cell key={i} fill={i === data.weeklyActivity.length - 1 ? '#7c3aed' : '#4c1d95'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top tags */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Most-Used Tags</h2>
            {data.topTags.length === 0 ? (
              <p className="text-sm text-gray-500">No tags yet. Add tags to your notes.</p>
            ) : (
              <div className="space-y-2.5">
                {data.topTags.map(({ tag, count }) => {
                  const max = data.topTags[0].count;
                  return (
                    <div key={tag} className="flex items-center gap-3">
                      <span className="text-xs text-gray-300 w-24 truncate">{tag}</span>
                      <div className="flex-1 bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-violet-500 h-2 rounded-full"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recently edited */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Recently Edited</h2>
            {data.recentNotes.length === 0 ? (
              <p className="text-sm text-gray-500">No notes yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentNotes.map((note) => (
                  <div
                    key={note._id}
                    className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm text-white">{note.title || 'Untitled'}</p>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {note.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded-full bg-gray-800 text-xs text-gray-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-4">
                      {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
