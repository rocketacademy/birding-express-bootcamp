import express from 'express';
import {
  allNotesController,
  singleNoteController,
  postNoteController,
  createNoteController,
  editNoteController,
  postEditNoteController,
  deleteNoteController,
  confirmDelete,
} from '../controllers/noteController.js';

const router = express.Router();
router.get('/all', allNotesController);
router.get('/create', createNoteController);
router.post('/', postNoteController);

router.get('/single/:id', singleNoteController);
router.get('/edit/:id', editNoteController);
router.post('/edit/:id', postEditNoteController);
router.post('/delete/:id', confirmDelete);
router.get('/delete/:id', deleteNoteController);
export default router;
