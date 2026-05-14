const { validationResult } = require('express-validator');
const Note = require('../models/Note');
const User = require('../models/User');
const { generateNoteInsights } = require('../services/aiService');

const getNotes = async (req, res) => {
  try {
    const { search, tag, category, archived, sort = 'updatedAt', page = 1, limit = 50 } = req.query;

    const filter = { user: req.user._id };

    if (archived === 'true') {
      filter.isArchived = true;
    } else {
      filter.isArchived = false;
    }

    if (tag) filter.tags = tag;
    if (category) filter.category = category;

    if (search) {
      filter.$text = { $search: search };
    }

    const sortOption = sort === 'title' ? { title: 1 } : { updatedAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notes, total] = await Promise.all([
      Note.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit)).lean(),
      Note.countDocuments(filter),
    ]);

    res.json({ notes, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
};

const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch note' });
  }
};

const createNote = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;
    const note = await Note.create({
      user: req.user._id,
      title: title || 'Untitled Note',
      content: content || '',
      tags: tags || [],
      category: category || '',
    });
    res.status(201).json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create note' });
  }
};

const updateNote = async (req, res) => {
  try {
    const { title, content, tags, category, isArchived } = req.body;

    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (category !== undefined) note.category = category;
    if (isArchived !== undefined) note.isArchived = isArchived;

    await note.save();
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update note' });
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete note' });
  }
};

const generateSummary = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (!note.content || note.content.trim().length < 20) {
      return res.status(400).json({ message: 'Note content is too short to summarise' });
    }

    const aiOutput = await generateNoteInsights(note.title, note.content);
    note.aiOutput = aiOutput;
    await note.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { aiUsageCount: 1 } });

    res.json({ aiOutput });
  } catch (error) {
    console.error('AI generation error:', error.message);
    res.status(500).json({ message: 'AI summary generation failed. Check your API key and try again.' });
  }
};

const shareNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (!note.shareId) {
      note.generateShareId();
      await note.save();
    }

    res.json({ shareId: note.shareId, shareUrl: `/shared/${note.shareId}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate share link' });
  }
};

const unshareNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    note.isPublic = false;
    note.shareId = undefined;
    await note.save();

    res.json({ message: 'Note is now private' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unshare note' });
  }
};

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote, generateSummary, shareNote, unshareNote };
