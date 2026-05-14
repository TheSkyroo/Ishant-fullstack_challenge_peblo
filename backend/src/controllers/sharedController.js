const Note = require('../models/Note');

const getSharedNote = async (req, res) => {
  try {
    const note = await Note.findOne({ shareId: req.params.shareId, isPublic: true })
      .populate('user', 'name')
      .lean();

    if (!note) {
      return res.status(404).json({ message: 'Shared note not found or no longer public' });
    }

    res.json({
      note: {
        title: note.title,
        content: note.content,
        tags: note.tags,
        category: note.category,
        aiOutput: note.aiOutput,
        updatedAt: note.updatedAt,
        author: note.user?.name || 'Anonymous',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch shared note' });
  }
};

module.exports = { getSharedNote };
