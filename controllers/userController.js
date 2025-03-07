import * as userService from '../services/userService.js';
import { calculateAge, formatBirthday } from '../utils/dateUtils.js';

// Afficher la page d'accueil avec un utilisateur aléatoire
export const showDashboard = (req, res) => {
    const randomUser = userService.getRandomUser();
    const age = calculateAge(randomUser.birthdate);
    const birthday = formatBirthday(randomUser.birthdate);
    
    res.render('dashboard', {
        user: req.session.user,
        randomUser: randomUser,
        display: {
            age,
            birthday
        }
    });
};

// Afficher la liste des utilisateurs
export const listUsers = (req, res) => {
    try {
        const { name, category, city } = req.query;
        const users = userService.filterUsers({ name, category, city });
        
        const processedUsers = users.map(user => ({
            ...user,
            display: {
                age: calculateAge(user.birthdate),
                birthday: formatBirthday(user.birthdate)
            }
        }));
        
        res.render('users', {
            users: processedUsers,
            filters: { name, category, city }
        });
    } catch (error) {
        console.error('Erreur lors de la liste des utilisateurs:', error);
        res.status(500).render('error', {
            message: 'Erreur lors du chargement des utilisateurs',
            error: { status: 500 }
        });
    }
};

// Afficher le formulaire de modification de profil
export const showEditProfile = (req, res) => {
    const userId = req.params.id || req.session.user.id;
    const userToEdit = userService.getUserById(userId);
    
    if (!userToEdit) {
        return res.status(404).render('error', {
            message: 'Utilisateur non trouvé',
            error: { status: 404 }
        });
    }
    
    res.render('edit-profile', {
        userToEdit,
        display: {
            calculateAge,
            formatBirthday
        }
    });
};

// Mettre à jour le profil
export const updateProfile = (req, res) => {
    const userId = req.session.user.id;
    const userData = {
        gender: req.body.gender,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone,
        birthdate: req.body.birthdate,
        city: req.body.city,
        country: req.body.country,
        photo: req.body.photo,
        category: req.body.category
    };

    if (req.body.password && req.body.password.length >= 8) {
        userData.password = req.body.password;
    }

    try {
        const updatedUser = userService.updateUser(userId, userData);
        if (updatedUser) {
            req.session.user = updatedUser;
            res.redirect('/dashboard');
        } else {
            throw new Error('Erreur lors de la mise à jour');
        }
    } catch (error) {
        res.redirect('/profile/edit?error=1');
    }
};

// Admin : Afficher le formulaire d'ajout d'utilisateur
export const showAddUser = (req, res) => {
    res.render('add-user');
};

// Admin : Ajouter un utilisateur
export const addUser = (req, res) => {
    try {
        const userData = {
            gender: req.body.gender,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: req.body.password,
            phone: req.body.phone,
            birthdate: req.body.birthdate,
            city: req.body.city,
            country: req.body.country,
            photo: req.body.photo,
            category: req.body.category
        };

        const newUser = userService.addUser(userData);
        if (!newUser) {
            throw new Error('Erreur lors de l\'ajout de l\'utilisateur');
        }
        res.redirect('/users');
    } catch (error) {
        res.status(400).render('error', {
            message: 'Erreur lors de l\'ajout de l\'utilisateur',
            error: { status: 400 }
        });
    }
};

// Admin : Supprimer un utilisateur
export const deleteUser = (req, res) => {
    try {
        const userId = req.params.id;
        const success = userService.deleteUser(userId);
        if (!success) {
            throw new Error('Utilisateur non trouvé');
        }
        res.redirect('/users');
    } catch (error) {
        res.status(404).render('error', {
            message: 'Utilisateur non trouvé',
            error: { status: 404 }
        });
    }
};

// Admin : Afficher le formulaire d'édition d'utilisateur
export const showEditUser = (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    const userId = req.params.id;
    const userToEdit = userService.getUserById(userId);
    
    if (!userToEdit) {
        return res.status(404).send('Utilisateur non trouvé');
    }
    
    res.render('edit-user', { 
        user: userToEdit,
        display: {
            calculateAge,
            formatBirthday
        }
    });
}; 