export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AiOutput {
  summary: string;
  actionItems: string[];
  suggestedTitle: string;
  generatedAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  isArchived: boolean;
  isPublic: boolean;
  shareId?: string;
  aiOutput?: AiOutput;
  createdAt: string;
  updatedAt: string;
}

export interface InsightData {
  totalNotes: number;
  archivedNotes: number;
  recentNotes: Pick<Note, '_id' | 'title' | 'updatedAt' | 'tags'>[];
  topTags: { tag: string; count: number }[];
  notesWithAI: number;
  aiUsageCount: number;
  weeklyActivity: { date: string; count: number }[];
  notesThisWeek: number;
}
