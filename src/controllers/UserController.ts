import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

class UserController {
    public excludeFields(obj: any, fieldsToExclude: string[]): any {
        console.log(fieldsToExclude)
        fieldsToExclude.forEach(field => {
            delete obj[field];
        });
        return obj;
    }
    async register(req: Request, res: Response) {
        try {
            const { name, email, password } = req.body;

            // Vérifier si l'utilisateur existe déjà
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Utilisateur déjà existant' });
            }

            // Hash du mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            // Création de l'utilisateur
            const user = new User({
                name,
                email,
                password: hashedPassword
            });

            await user.save();

            res.status(201).json({
                message: 'Utilisateur créé avec succès',
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur', error });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            console.log(req.body);

            // Trouver l'utilisateur
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Identifiants invalides' });
            }

            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Identifiants invalides' });
            }

            // Générer un token JWT
            const token = jwt.sign(
                { userId: user._id.toString() },
                process.env.JWT_SECRET as string,
                { expiresIn: '1d' },

            );
            const cleanedUser = this.excludeFields(user.toObject(), ['password']);
            res.json({
                message: 'Connexion réussie',
                user: {
                    cleanedUser
                },
                token
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erreur de connexion', error });
        }
    }
}

export default new UserController();
