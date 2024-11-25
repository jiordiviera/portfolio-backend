import { Request, Response } from 'express';
import Post, { PostInterface } from '../models/Post';
import { uploadToCloudinary } from '../services/fileUpload';
import slugify from 'slugify';
import Comment, { CommentInterface } from '../models/Comment';
import { calculateReadTime } from '../services/readTimeService';
import { viewableService } from '../services/ViewableService';

class PostController {
    async createPost(req: Request, res: Response): Promise<void> {
        try {
            console.log(req.body)
            if (!req.file) {
                res.status(400).json({ message: 'No file provided' });
                return;
            }

            const mediaUrl = req.file.path;
            const { title, description } = req.body;
            const slug = slugify(title, { lower: true, strict: true });
            const read_time = calculateReadTime(description);
            const userId = (req as any).user.userId;

            const newPost: PostInterface = new Post({
                title,
                slug,
                description,
                read_time,
                media_url: mediaUrl,
                author: userId,
                published_at:new Date()
            });

            await newPost.save();
            res.status(201).json(newPost);
        } catch (error) {
            console.error('Error creating post:', error);
            res.status(500).json({ message: 'Error creating post', error: error instanceof Error ? error.message : String(error) });
        }
    }

    async getAllPosts(req: Request, res: Response): Promise<void> {
        try {
            const posts = await Post
                .find({ is_active: true })
                .sort({ published_at: -1 })
                .populate("comments");
            const postsWithExcerpt = posts.map(post => {
                const excerpt = post.description.substring(0, 150) + '...'; // Generate excerpt from description
                return {
                    ...post.toObject(),
                    excerpt
                };
            });
            console.log(postsWithExcerpt);
            res.status(200).json(postsWithExcerpt);
        } catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ message: 'Error fetching posts', error: error instanceof Error ? error.message : String(error) });
        }
    }


    async getPostBySlug(req: Request, res: Response): Promise<void> {
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
    }

    async updatePost(req: Request, res: Response): Promise<void> {
        try {
            const { title, description, is_active } = req.body;
            let updateData: Partial<PostInterface> = {
                title,
                description,
                is_active
            };

            if (description) {
                updateData.read_time = calculateReadTime(description);
            }

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
    }

    async deletePost(req: Request, res: Response): Promise<void> {
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
    }

    async incrementViewCount(req: Request, res: Response): Promise<void> {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }

            const viewRecorded = await viewableService.recordView(post, req);
            if (viewRecorded) {
                // Only increment the counter if the view was actually recorded
                await Post.findByIdAndUpdate(
                    req.params.id,
                    { $inc: { views_count: 1 } }
                );
            }

            const viewCount = await viewableService.getViewCount(post);
            const uniqueViewCount = await viewableService.getUniqueViewCount(post);

            res.status(200).json({
                total_views: viewCount,
                unique_views: uniqueViewCount,
                view_recorded: viewRecorded
            });
        } catch (error) {
            console.error('Error incrementing view count:', error);
            res.status(500).json({
                message: 'Error incrementing view count',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    async getViewsStats(req: Request, res: Response): Promise<void> {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }

            const viewsHistory = await viewableService.getViewsHistory(post, 30); // Last 30 days
            const totalViews = await viewableService.getViewCount(post);
            const uniqueViews = await viewableService.getUniqueViewCount(post);

            res.status(200).json({
                total_views: totalViews,
                unique_views: uniqueViews,
                views_history: viewsHistory
            });
        } catch (error) {
            console.error('Error fetching views stats:', error);
            res.status(500).json({
                message: 'Error fetching views stats',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    async addComment(req: Request, res: Response): Promise<void> {
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
    }

    async getPostComments(req: Request, res: Response): Promise<void> {
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
    }

    async deleteComment(req: Request, res: Response): Promise<void> {
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
    }
}

export default new PostController();
