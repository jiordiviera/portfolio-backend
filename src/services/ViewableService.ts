import { View, IView } from '../models/View';
import { Viewable } from '../interfaces/Viewable';
import { Request } from 'express';
import { Types } from 'mongoose';

export class ViewableService {
    private static instance: ViewableService;
    private cooldownPeriod: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    private constructor() { }

    public static getInstance(): ViewableService {
        if (!ViewableService.instance) {
            ViewableService.instance = new ViewableService();
        }
        return ViewableService.instance;
    }

    private generateVisitorId(req: Request): string {
        // Generate a unique visitor ID based on IP and user agent
        const ip = req.ip;
        const userAgent = req.get('user-agent') || '';
        return Buffer.from(`${ip}-${userAgent}`).toString('base64');
    }

    public async recordView(model: Viewable, req: Request): Promise<boolean> {
        try {
            const visitorId = this.generateVisitorId(req);
            const modelType = model.constructor.name;

            // Check if the visitor has viewed this item recently
            const recentView = await View.findOne({
                viewable_id: model._id,
                viewable_type: modelType,
                visitor_id: visitorId,
                viewed_at: {
                    $gte: new Date(Date.now() - this.cooldownPeriod)
                }
            });
            console.log(recentView)

            if (recentView) {
                return false; // View not recorded (too recent)
            }

            // Create new view record
            const view = new View({
                viewable_id: model._id,
                viewable_type: modelType,
                visitor_id: visitorId,
                ip_address: req.ip,
                user_agent: req.get('user-agent')
            });
console.log({view:view})
            await view.save();
            return true; // View recorded successfully
        } catch (error) {
            console.error('Error recording view:', error);
            return false;
        }
    }

    public async getViewCount(model: Viewable): Promise<number> {
        try {
            return await View.countDocuments({
                viewable_id: model._id,
                viewable_type: model.constructor.name
            });
        } catch (error) {
            console.error('Error getting view count:', error);
            return 0;
        }
    }

    public async getUniqueViewCount(model: Viewable): Promise<number> {
        try {
            const result = await View.aggregate([
                {
                    $match: {
                        viewable_id: new Types.ObjectId(model.id),
                        viewable_type: model.constructor.name
                    }
                },
                {
                    $group: {
                        _id: '$visitor_id',
                        count: { $sum: 1 }
                    }
                },
                {
                    $count: 'uniqueViews'
                }
            ]);

            return result[0]?.uniqueViews || 0;
        } catch (error) {
            console.error('Error getting unique view count:', error);
            return 0;
        }
    }

    public async getViewsHistory(
        model: Viewable,
        days: number = 30
    ): Promise<{ date: string; count: number }[]> {
        try {
            const result = await View.aggregate([
                {
                    $match: {
                        viewable_id: new Types.ObjectId(model.id),
                        viewable_type: model.constructor.name,
                        viewed_at: {
                            $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$viewed_at' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id': 1 }
                }
            ]);

            return result.map(item => ({
                date: item._id,
                count: item.count
            }));
        } catch (error) {
            console.error('Error getting views history:', error);
            return [];
        }
    }
}

export const viewableService = ViewableService.getInstance();
