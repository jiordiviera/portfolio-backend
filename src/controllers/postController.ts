import { Request, Response } from 'express';
import Post, { PostInterface } from '../models/Post';
import Comment, { CommentInterface } from '../models/Comment';
import { uploadToCloudinary } from '../services/fileUpload';

export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file as Express.Multer.File;
        const mediaUrl = await uploadToCloudinary(file);

        const newPost: PostInterface = new Post({
            ...req.body,
            media_url: mediaUrl,
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(400).json({ message: 'Error creating post', error });
    }
};

export const getAllPosts = async (req: Request, res: Response) => {
    try {
        const posts = await Post.find({ is_active: true }).populate('comments');
        res.status(200).json(posts);
    } catch (error) {
        res.status(400).json({ message: 'Error fetching posts', error });
    }
};

export const getPostBySlug = async (req: Request, res: Response) => {
    try {
        const post = await Post.findOne({ slug: req.params.slug, is_active: true }).populate('comments');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        res.status(400).json({ message: 'Error fetching post', error });
    }
};

export const updatePost = async (req: Request, res: Response) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(400).json({ message: 'Error updating post', error });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const deletedPost = await Post.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting post', error });
    }
};

export const addComment = async (req: Request, res: Response) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment: CommentInterface = new Comment(req.body);
        await newComment.save();

        post.comments.push(newComment);
        await post.save();

        res.status(201).json(newComment);
    } catch (error) {
        res.status(400).json({ message: 'Error adding comment', error });
    }
};
