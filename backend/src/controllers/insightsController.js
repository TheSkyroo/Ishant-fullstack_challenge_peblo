const Note = require('../models/Note');
const User = require('../models/User');

const getInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalNotes,
      archivedNotes,
      recentNotes,
      allNotes,
      weeklyNotes,
      user,
    ] = await Promise.all([
      Note.countDocuments({ user: userId, isArchived: false }),
      Note.countDocuments({ user: userId, isArchived: true }),
      Note.find({ user: userId, isArchived: false })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title updatedAt tags')
        .lean(),
      Note.find({ user: userId }).select('tags aiOutput createdAt updatedAt').lean(),
      Note.find({ user: userId, createdAt: { $gte: weekAgo } })
        .select('createdAt')
        .lean(),
      User.findById(userId).select('aiUsageCount').lean(),
    ]);

    const tagFrequency = {};
    allNotes.forEach((note) => {
      note.tags.forEach((tag) => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));

    const notesWithAI = allNotes.filter((n) => n.aiOutput).length;

    const dailyActivity = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyActivity[key] = 0;
    }
    weeklyNotes.forEach((note) => {
      const key = new Date(note.createdAt).toISOString().split('T')[0];
      if (dailyActivity[key] !== undefined) dailyActivity[key]++;
    });

    const weeklyActivity = Object.entries(dailyActivity).map(([date, count]) => ({
      date,
      count,
    }));

    res.json({
      totalNotes,
      archivedNotes,
      recentNotes,
      topTags,
      notesWithAI,
      aiUsageCount: user?.aiUsageCount || 0,
      weeklyActivity,
      notesThisWeek: weeklyNotes.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch insights' });
  }
};

module.exports = { getInsights };
