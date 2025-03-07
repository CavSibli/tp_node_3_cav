import * as userService from '../services/userService.js';
import { calculateAge, formatBirthday } from '../utils/dateUtils.js';

// Afficher la page d'accueil avec un utilisateur aléatoire
export const showDashboard = async (req, res) => {
    try {
        console.log('Début de showDashboard');
        const randomUser = await userService.getRandomUser();
        console.log('randomUser:', randomUser);

        if (!randomUser) {
            console.log('Aucun utilisateur trouvé');
            throw new Error('Aucun utilisateur trouvé');
        }

        const age = calculateAge(randomUser.birthdate);
        const birthday = formatBirthday(randomUser.birthdate);
        
        console.log('Données préparées:', {
            age,
            birthday,
            randomUser
        });

        const data = {
            user: req.session.user,
            randomUser: randomUser,
            display: {
                age,
                birthday
            }
        };

        console.log('Données envoyées au template:', data);
        
        res.render('dashboard', data);
    } catch (error) {
        console.error('Erreur détaillée dans showDashboard:', error);
        res.status(500).render('error', {
            message: 'Erreur lors du chargement du dashboard',
            error: { status: 500, message: error.message }
        });
    }
};

// Afficher la liste des utilisateurs
export const listUsers = async (req, res) => {
    try {
        console.log('Début de listUsers');
        const { name, category, city } = req.query;
        const users = await userService.filterUsers({ name, category, city });
        console.log('Utilisateurs trouvés:', users);
        
        const processedUsers = users.map(user => ({
            ...user,
            display: {
                age: calculateAge(user.birthdate),
                birthday: formatBirthday(user.birthdate)
            }
        }));
        
        console.log('Utilisateurs traités:', processedUsers);
        
        res.render('users', {
            users: processedUsers,
            filters: { name, category, city },
            user: req.session.user
        });
    } catch (error) {
        console.error('Erreur lors de la liste des utilisateurs:', error);
        res.status(500).render('error', {
            message: 'Erreur lors du chargement des utilisateurs',
            error: { status: 500, message: error.message }
        });
    }
};

// Afficher le formulaire de modification de profil
export const showEditProfile = async (req, res) => {
    try {
        console.log('Début de showEditProfile');
        const userId = req.params.id || req.session.user._id;
        const userToEdit = await userService.getUserById(userId);
        
        if (!userToEdit) {
            return res.status(404).render('error', {
                message: 'Utilisateur non trouvé',
                error: { status: 404 }
            });
        }

        const age = calculateAge(userToEdit.birthdate);
        const birthday = formatBirthday(userToEdit.birthdate);
        
        res.render('edit-profile', {
            user: req.session.user,
            userToEdit,
            display: {
                age,
                birthday
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'édition du profil:', error);
        res.status(500).render('error', {
            message: 'Erreur lors du chargement du profil',
            error: { status: 500, message: error.message }
        });
    }
};

// Mettre à jour le profil
export const updateProfile = async (req, res) => {
    try {
        console.log('Début de updateProfile');
        const userId = req.session.user._id;
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

        const updatedUser = await userService.updateUser(userId, userData);
        if (updatedUser) {
            req.session.user = updatedUser;
            res.redirect('/dashboard?success=update');
        } else {
            throw new Error('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.redirect('/profile/edit?error=1');
    }
};

// Admin : Afficher le formulaire d'ajout d'utilisateur
export const showAddUser = (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).render('error', {
            message: 'Accès non autorisé',
            error: { status: 403 }
        });
    }
    res.render('add-user', { user: req.session.user });
};

// Admin : Ajouter un utilisateur
export const addUser = async (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).render('error', {
            message: 'Accès non autorisé',
            error: { status: 403 }
        });
    }

    try {
        console.log('Début de addUser');
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

        const newUser = await userService.addUser(userData);
        if (!newUser) {
            throw new Error('Erreur lors de l\'ajout de l\'utilisateur');
        }
        res.redirect('/users?success=add');
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
        res.status(400).render('error', {
            message: 'Erreur lors de l\'ajout de l\'utilisateur',
            error: { status: 400, message: error.message }
        });
    }
};

// Admin : Supprimer un utilisateur
export const deleteUser = async (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).render('error', {
            message: 'Accès non autorisé',
            error: { status: 403 }
        });
    }

    try {
        console.log('Début de deleteUser');
        const userId = req.params.id;
        const success = await userService.deleteUser(userId);
        if (!success) {
            throw new Error('Utilisateur non trouvé');
        }
        res.redirect('/users?success=delete');
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(404).render('error', {
            message: 'Utilisateur non trouvé',
            error: { status: 404, message: error.message }
        });
    }
};

// Admin : Afficher le formulaire d'édition d'utilisateur
export const showEditUser = async (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).render('error', {
            message: 'Accès non autorisé',
            error: { status: 403 }
        });
    }

    try {
        console.log('Début de showEditUser');
        const userId = req.params.id;
        const userToEdit = await userService.getUserById(userId);
        
        if (!userToEdit) {
            return res.status(404).render('error', {
                message: 'Utilisateur non trouvé',
                error: { status: 404 }
            });
        }

        const age = calculateAge(userToEdit.birthdate);
        const birthday = formatBirthday(userToEdit.birthdate);
        
        res.render('edit-user', { 
            user: req.session.user,
            userToEdit,
            display: {
                age,
                birthday
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'édition de l\'utilisateur:', error);
        res.status(500).render('error', {
            message: 'Erreur lors du chargement de l\'utilisateur',
            error: { status: 500, message: error.message }
        });
    }
};

// Admin : Mettre à jour un utilisateur
export const updateUser = async (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).render('error', {
            message: 'Accès non autorisé',
            error: { status: 403 }
        });
    }

    try {
        console.log('Début de updateUser');
        const userId = req.params.id;
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

        const updatedUser = await userService.updateUser(userId, userData);
        if (!updatedUser) {
            throw new Error('Utilisateur non trouvé');
        }
        res.redirect('/users?success=edit');
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        res.redirect('/users?error=edit');
    }
}; 