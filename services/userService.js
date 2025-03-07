import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le fichier users.json
const usersFilePath = path.join(__dirname, '../data/users.json');

// Lire les utilisateurs depuis le fichier
const readUsers = () => {
    const usersData = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(usersData);
};

// Écrire les utilisateurs dans le fichier
const writeUsers = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Obtenir un utilisateur aléatoire
export const getRandomUser = () => {
    const users = readUsers();
    const randomIndex = Math.floor(Math.random() * users.length);
    return users[randomIndex];
};

// Obtenir un utilisateur par email
export const getUserByEmail = (email) => {
    const users = readUsers();
    return users.find(user => user.email === email);
};

// Obtenir un utilisateur par ID
export const getUserById = (id) => {
    const users = readUsers();
    return users.find(user => user.id === id);
};

// Obtenir tous les utilisateurs
export const getAllUsers = () => {
    return readUsers();
};

// Mettre à jour un utilisateur
export const updateUser = (id, userData) => {
    const users = readUsers();
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return false;

    // Si un nouveau mot de passe est fourni, le hasher
    if (userData.password) {
        userData.password = bcrypt.hashSync(userData.password, 10);
    }

    users[index] = { ...users[index], ...userData };
    writeUsers(users);
    return users[index];
};

// Ajouter un nouvel utilisateur
export const addUser = (userData) => {
    const users = readUsers();
    const newId = String(Math.max(...users.map(u => parseInt(u.id))) + 1);
    
    const newUser = {
        id: newId,
        ...userData,
        password: bcrypt.hashSync(userData.password, 10),
        isAdmin: false
    };

    users.push(newUser);
    writeUsers(users);
    return newUser;
};

// Supprimer un utilisateur
export const deleteUser = (id) => {
    const users = readUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    writeUsers(filteredUsers);
    return true;
};

// Vérifier les identifiants de connexion
export const verifyCredentials = (email, password) => {
    const user = getUserByEmail(email);
    if (!user) return null;
    
    const isValid = bcrypt.compareSync(password, user.password);
    return isValid ? user : null;
};

// Filtrer les utilisateurs
export const filterUsers = (filters) => {
    let users = readUsers();
    
    if (filters.name) {
        const searchTerm = filters.name.toLowerCase();
        users = users.filter(user => 
            user.firstname.toLowerCase().includes(searchTerm) ||
            user.lastname.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filters.category && filters.category !== '- Aucun -') {
        users = users.filter(user => user.category === filters.category);
    }
    
    if (filters.city) {
        const searchTerm = filters.city.toLowerCase();
        users = users.filter(user => 
            user.city.toLowerCase().includes(searchTerm)
        );
    }
    
    return users;
}; 