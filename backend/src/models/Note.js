const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const aiOutputSchema = new mongoose.Schema(
  {
    summary: { type: String, default: '' },
    actionItems: [{ type: String }],
    suggestedTitle: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Untitled Note',
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    content: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareId: {
      type: String,
      unique: true,
      sparse: true,
    },
    aiOutput: {
      type: aiOutputSchema,
      default: null,
    },
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ user: 1, tags: 1 });
noteSchema.index({ shareId: 1 });
noteSchema.index(
  { title: 'text', content: 'text', tags: 'text' },
  { weights: { title: 3, tags: 2, content: 1 } }
);

noteSchema.methods.generateShareId = function () {
  this.shareId = uuidv4().replace(/-/g, '').substring(0, 16);
  this.isPublic = true;
  return this.shareId;
};

module.exports = mongoose.model('Note', noteSchema);
