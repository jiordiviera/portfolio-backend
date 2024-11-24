import express from 'express';
import { authenticateToken } from '../middleware/auth';

import { upload } from '../services/fileUpload';
import PostController from '../controllers/postController';

const router = express.Router();


router.post('/', authenticateToken as express.RequestHandler, upload.single('file'), PostController.createPost as express.RequestHandler);
router.get('/', PostController.getAllPosts as express.RequestHandler);
router.get('/:slug', PostController.getPostBySlug as express.RequestHandler);
router.put('/:id', authenticateToken as express.RequestHandler, PostController.updatePost as express.RequestHandler);
router.delete('/:id', authenticateToken as express.RequestHandler, PostController.deletePost as express.RequestHandler);
router.post('/:postId/comments', PostController.addComment as express.RequestHandler);

export default router;
