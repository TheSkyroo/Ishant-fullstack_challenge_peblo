const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  generateSummary,
  shareNote,
  unshareNote,
} = require('../controllers/notesController');

const router = express.Router();

router.use(protect);

router.get('/', getNotes);
router.post('/', createNote);
router.get('/:id', getNoteById);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/generate-summary', generateSummary);
router.post('/:id/share', shareNote);
router.delete('/:id/share', unshareNote);

module.exports = router;
