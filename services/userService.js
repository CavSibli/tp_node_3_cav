import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadUsers = () => {
    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    const usersData = fs.readFileSync(usersPath, 'utf8');
    return JSON.parse(usersData);
};

export const getRandomUser = () => {
    const users = loadUsers();
    const randomIndex = Math.floor(Math.random() * users.length);
    const user = users[randomIndex];
    
    const birthDate = new Date(user.birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    const options = { day: 'numeric', month: 'long' };
    const birthday = new Date(user.birthdate).toLocaleDateString('fr-FR', options);
    
    return {
        ...user,
        age,
        birthday
    };
};

export const verifyUser = async (email, password) => {
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return null;
    }
    
    return user;
}; 