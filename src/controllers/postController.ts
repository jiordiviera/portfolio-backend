import { Request, Response } from 'express';
import Post, { PostInterface } from '../models/Post';
import { uploadToCloudinary } from '../services/fileUpload';
import slugify from 'slugify';
import Comment, { CommentInterface } from '../models/Comment';

// Create a new post
export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        // Vérifier si un fichier a été téléchargé
        if (!req.file) {
            res.status(400).json({ message: 'No file provided' });
            return;
        }

        // Extraire l'URL de l'image envoyée à Cloudinary
        const mediaUrl = req.file.path;

        const { title, description, excerpt, read_time } = req.body;
        const slug = slugify(title, { lower: true, strict: true });

        // Créer le post
        const newPost: PostInterface = new Post({
            title,
            slug,
            description,
            excerpt,
            read_time: parseInt(read_time),
            media_url: mediaUrl,
        });

        // Sauvegarder le post dans la base de données
        await newPost.save();

        // Répondre avec le post créé
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Error creating post', error: error instanceof Error ? error.message : String(error) });
    }
};


// Get all posts
export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const posts = await Post.find({ is_active: true }).sort({ published_at: -1 });
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts', error: error instanceof Error ? error.message : String(error) });
    }
};

// Get a post by slug
export const getPostBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const post = await Post.findOne({ slug: req.params.slug, is_active: true }).populate('comments');
        if (!post) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }
        res.status(200).json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Error fetching post', error: error instanceof Error ? error.message : String(error) });
    }
};

// Update a post
export const updatePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, excerpt, read_time, is_active } = req.body;
        let updateData: Partial<PostInterface> = {
            title,
            description,
            excerpt,
            read_time: parseInt(read_time),
            is_active
        };

        if (req.file) {
            try {
                updateData.media_url = await uploadToCloudinary(req.file);
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                res.status(500).json({ message: 'Error uploading file', error: uploadError instanceof Error ? uploadError.message : String(uploadError) });
                return;
            }
        }

        if (title) {
            updateData.slug = slugify(title, { lower: true, strict: true });
        }

        const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedPost) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Error updating post', error: error instanceof Error ? error.message : String(error) });
    }
};

// Delete a post (soft delete)
export const deletePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedPost = await Post.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
        if (!deletedPost) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Error deleting post', error: error instanceof Error ? error.message : String(error) });
    }
};

// Increment view count
export const incrementViewCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { views_count: 1 } },
            { new: true }
        );
        if (!updatedPost) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }
        res.status(200).json({ views_count: updatedPost.views_count });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        res.status(500).json({ message: 'Error incrementing view count', error: error instanceof Error ? error.message : String(error) });
    }
};

// Add a comment
export const addComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        if (!req.body.message || !req.body.pseudo) {
            res.status(400).json({ message: 'Message et pseudo sont requis' });
            return;
        }

        const newComment: CommentInterface = new Comment(req.body);

        await newComment.save();

        post.comments.push(newComment.id);
        await post.save();

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment', error: error instanceof Error ? error.message : String(error) });
    }
};

// Récupérer les commentaires d'un post
export const getPostComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const post = await Post.findById(req.params.postId).populate('comments');
        if (!post) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        res.status(200).json(post.comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Error fetching comments', error: error instanceof Error ? error.message : String(error) });
    }
};

// Delete a comment
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }

        const post = await Post.findOne({ comments: req.params.commentId });
        if (post) {
            post.comments = post.comments.filter(
                (commentId) => commentId.toString() !== comment.id.toString()
            );
            await post.save();
        }

        await Comment.findByIdAndDelete(req.params.commentId);
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Error deleting comment', error: error instanceof Error ? error.message : String(error) });
    }
};
