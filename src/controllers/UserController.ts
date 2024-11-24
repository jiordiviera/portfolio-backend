import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

class UserController {
    constructor() {
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
    }
    private excludeFields = <T extends Record<string, any>>(obj: T, fieldsToExclude: (keyof T)[]): Partial<T> => {
        const result = { ...obj };
        fieldsToExclude.forEach(field => {
            delete result[field];
        });
        return result;
    }

    private generateToken = (userId: string): string => {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jwt.sign({ userId }, jwtSecret, { expiresIn: '1d' });
    }

    async register(req: Request, res: Response): Promise<void> {
        try {
            const { name, email, password } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(400).json({ message: 'Utilisateur déjà existant' });
                return;
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new User({
                name,
                email,
                password: hashedPassword
            });

            await user.save();

            const token = this.generateToken(user._id.toString());

            res.status(201).json({
                message: 'Utilisateur créé avec succès',
                user: this.excludeFields(user.toObject(), ['password']),
                token
            });
        } catch (error) {
            console.error('Error in register:', error);
            res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                res.status(400).json({ message: 'Identifiants invalides' });
                return;
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                res.status(400).json({ message: 'Identifiants invalides' });
                return;
            }

            const token = this.generateToken(user._id.toString());

            res.json({
                message: 'Connexion réussie',
                user: this.excludeFields(user.toObject(), ['password']),
                token
            });
        } catch (error) {
            console.error('Error in login:', error);
            res.status(500).json({ message: 'Erreur de connexion' });
        }
    }
    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { name, email, twitter, github, linkedin } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ message: 'Utilisateur non trouvé' });
                return;
            }

            user.name = name || user.name;
            user.email = email || user.email;
            user.twitter = twitter || user.twitter;
            user.github = github || user.github;
            user.linkedin = linkedin || user.linkedin;

            await user.save();

            res.json({
                message: 'Profil mis à jour avec succès',
                user: this.excludeFields(user.toObject(), ['password'])
            });
        } catch (error) {
            console.error('Error in updateProfile:', error);
            res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
        }
    }
}

export default new UserController();
