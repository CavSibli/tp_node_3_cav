import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// Middleware d'authentification
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/?error=2');
    }
    next();
};

// Routes
router.get('/dashboard', requireAuth, userController.showDashboard);
router.get('/users', requireAuth, userController.listUsers);
router.get('/profile/edit', requireAuth, userController.showEditProfile);
router.post('/profile/edit', requireAuth, userController.updateProfile);

// Routes admin
router.get('/users/add', requireAuth, userController.showAddUser);
router.post('/users/add', requireAuth, userController.addUser);
router.get('/users/edit/:id', requireAuth, userController.showEditUser);
router.post('/users/edit/:id', requireAuth, userController.updateUser);
router.post('/users/delete/:id', requireAuth, userController.deleteUser);

export default router;
