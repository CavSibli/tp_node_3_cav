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

// Middleware de vérification admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).render('error', {
            message: 'Accès non autorisé',
            error: { status: 403 }
        });
    }
    next();
};

// Routes
router.get('/dashboard', requireAuth, userController.showDashboard);
router.get('/users', requireAuth, userController.listUsers);
router.get('/profile/edit', requireAuth, userController.showEditProfile);
router.post('/profile/edit', requireAuth, userController.updateProfile);

// Routes admin
router.get('/users/add', requireAuth, requireAdmin, userController.showAddUser);
router.post('/users/add', requireAuth, requireAdmin, userController.addUser);
router.get('/users/edit/:id', requireAuth, requireAdmin, userController.showEditUser);
router.post('/users/edit/:id', requireAuth, requireAdmin, userController.updateUser);
router.post('/users/delete/:id', requireAuth, requireAdmin, userController.deleteUser);

export default router;
