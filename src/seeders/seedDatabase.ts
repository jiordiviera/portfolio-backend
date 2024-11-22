import Comment from "../models/Comment";
import Post from "../models/Post";

require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');

const seedDatabase = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Lire le fichier JSON
    const data = JSON.parse(fs.readFileSync('seeders.json', 'utf-8'));

    // Supprimer toutes les données existantes
    await Post.deleteMany({});
    await Comment.deleteMany({});
    console.log('Existing data cleared');

    // Insérer les nouvelles données
    for (const postData of data.posts) {
      const { comments, ...postFields } = postData;
      const post = new Post(postFields);
      await post.save();

      for (const commentData of comments) {
        const comment = new Comment({
          ...commentData,
          post: post._id
        });
        await comment.save();
        post.comments.push(comment.id);
      }

      await post.save();
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedDatabase();
