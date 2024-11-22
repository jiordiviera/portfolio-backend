import express from 'express';
import { authenticateToken } from '../middleware/auth';

import { upload } from '../services/fileUpload';
import {
    createPost,
    getAllPosts,
    getPostBySlug,
    updatePost,
    deletePost,
    addComment,
} from '../controllers/postController';

const router = express.Router();


router.post('/', authenticateToken as express.RequestHandler, upload.single('file'), createPost as express.RequestHandler);
router.get('/', getAllPosts as express.RequestHandler);
router.get('/:slug', getPostBySlug as express.RequestHandler);
router.put('/:id', authenticateToken as express.RequestHandler, updatePost as express.RequestHandler);
router.delete('/:id', authenticateToken as express.RequestHandler, deletePost as express.RequestHandler);
router.post('/:postId/comments', addComment as express.RequestHandler);

export default router;
