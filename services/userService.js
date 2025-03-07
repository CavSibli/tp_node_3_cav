import User from '../models/User.js';
import bcrypt from 'bcrypt';

// Obtenir un utilisateur aléatoire
export const getRandomUser = async () => {
    try {
        const users = await User.aggregate([
            { $sample: { size: 1 } },
            {
                $project: {
                    _id: 1,
                    gender: 1,
                    firstname: 1,
                    lastname: 1,
                    email: 1,
                    password: 1,
                    phone: 1,
                    birthdate: 1,
                    city: 1,
                    country: 1,
                    photo: 1,
                    category: 1,
                    isAdmin: 1
                }
            }
        ]);
        
        if (!users || users.length === 0) {
            return null;
        }

        const user = users[0];
        console.log('Utilisateur aléatoire trouvé:', user);
        return user;
    } catch (error) {
        console.error('Erreur dans getRandomUser:', error);
        throw error;
    }
};

// Obtenir un utilisateur par email
export const getUserByEmail = async (email) => {
    const user = await User.findOne({ email });
    return user ? user.toObject() : null;
};

// Obtenir un utilisateur par ID
export const getUserById = async (id) => {
    const user = await User.findById(id);
    return user ? user.toObject() : null;
};

// Obtenir tous les utilisateurs
export const getAllUsers = async () => {
    const users = await User.find();
    return users.map(user => user.toObject());
};

// Mettre à jour un utilisateur
export const updateUser = async (id, userData) => {
    // Si un nouveau mot de passe est fourni, le hasher
    if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await User.findByIdAndUpdate(id, userData, { new: true });
    return user ? user.toObject() : null;
};

// Ajouter un nouvel utilisateur
export const addUser = async (userData) => {
    const newUser = new User({
        ...userData,
        password: await bcrypt.hash(userData.password, 10),
        isAdmin: false
    });
    const savedUser = await newUser.save();
    return savedUser.toObject();
};

// Supprimer un utilisateur
export const deleteUser = async (id) => {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
};

// Vérifier les identifiants de connexion
export const verifyCredentials = async (email, password) => {
    const user = await getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
};

// Filtrer les utilisateurs
export const filterUsers = async (filters) => {
    let query = {};
    
    if (filters.name) {
        query.$or = [
            { firstname: new RegExp(filters.name, 'i') },
            { lastname: new RegExp(filters.name, 'i') }
        ];
    }
    
    if (filters.category && filters.category !== '- Aucun -') {
        query.category = filters.category;
    }
    
    if (filters.city) {
        query.city = new RegExp(filters.city, 'i');
    }
    
    const users = await User.find(query);
    return users.map(user => user.toObject());
}; 