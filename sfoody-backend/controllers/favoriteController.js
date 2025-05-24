const Favorite = require('../models/favoriteModel');
const Recipe = require('../models/recipeModel');

exports.addFavorite = async (req, res) => {
    const { recipeId } = req.body;
    const userId = req.user.id;
    
    try {
        // Check if the recipe exists
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ msg: 'Recipe not found' });
        }
    
        // Check if the favorite already exists
        const existingFavorite = await Favorite.findOne({ user_id: userId, recipe_id: recipeId });
        if (existingFavorite) {
            return res.status(400).json({ msg: 'Recipe already in favorites' });
        }
    
        // Create a new favorite
        const newFavorite = new Favorite({
            user: userId,
            recipe: recipeId,
        });
    
        await newFavorite.save();
        res.status(201).json(newFavorite);
    } catch (error) {
        res.status(500).json({ msg: 'Server error', error });
    }
}

exports.getFavorites = async (req, res) => {
    const userId = req.user.id;
    
    try {
        // Get all favorites for the user
        const favorites = await Favorite.find({ user_id: userId }).populate('recipe_id');
        
        // Format the response
        const formattedFavorites = favorites.map(favorite => ({
            id: favorite._id,
            recipe: {
                id: favorite.recipe_id._id,
                title: favorite.recipe_id.title,
                image_url: favorite.recipe_id.image_url,
                description: favorite.recipe_id.description,
            },
        }));
        
        res.status(200).json(formattedFavorites);
    } catch (error) {
        res.status(500).json({ msg: 'Server error', error });
    }
}

exports.removeFavorite = async (req, res) => {
    const { favoriteId } = req.params;
    const userId = req.user.id;
    
    try {
        // Check if the favorite exists
        const favorite = await Favorite.findById(favoriteId);
        if (!favorite || favorite.user_id.toString() !== userId) {
            return res.status(404).json({ msg: 'Favorite not found' });
        }
    
        // Remove the favorite
        await Favorite.findByIdAndDelete(favoriteId);
        res.status(200).json({ msg: 'Favorite removed' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error', error });
    }
}