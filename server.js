import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setUserLocals } from './middleware/auth.js';
import { handle404, handleError } from './middleware/error.js';
import { getRandomUser, getAllUsers, filterUsers } from './services/userService.js';
import { showDashboard, showEditProfile, updateProfile } from './controllers/userController.js';
import { calculateAge, formatBirthday } from './utils/dateUtils.js';

// Configuration
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
dotenv.config();
const app = express();
app.set('view engine', 'pug');
app.set('views', './views');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.use(setUserLocals);
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Authentication Middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/?error=2');
    }
    next();
};

// Routes
// Home
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    const error = req.query.error;
    res.render('login', { error });
});

// Authentication
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.redirect('/?error=1');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.redirect('/?error=1');
    }
    req.session.user = user;
    res.redirect('/dashboard');
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Dashboard
app.get('/dashboard', requireAuth, showDashboard);

// Users
app.get('/users', requireAuth, (req, res) => {
    const { name, category, city } = req.query;
    let filteredUsers = getAllUsers();
    if (name || category || city) {
        filteredUsers = filterUsers(filteredUsers, { name, category, city });
    }
    
    res.render('users', { 
        users: filteredUsers,
        filters: { name, category, city },
        query: req.query,
        display: {
            calculateAge,
            formatBirthday
        }
    });
});
app.post('/users/delete/:id', requireAuth, (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    const userId = req.params.id;
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
    const userIndex = usersData.findIndex(user => user.id === userId);
    if (userIndex === -1) {
        return res.status(404).send('Utilisateur non trouvé');
    }
    usersData.splice(userIndex, 1);
    fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(usersData, null, 2));
    res.redirect('/users?success=delete');
});
app.get('/users/edit/:id', requireAuth, (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    const userId = req.params.id;
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
    const userToEdit = usersData.find(user => user.id === userId);
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
});
app.post('/users/edit/:id', requireAuth, (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    const userId = req.params.id;
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
    const userIndex = usersData.findIndex(user => user.id === userId);
    if (userIndex === -1) {
        return res.status(404).send('Utilisateur non trouvé');
    }
    const {
        firstname,
        lastname,
        email,
        phone,
        birthdate,
        city,
        country,
        category,
        photo
    } = req.body;
    usersData[userIndex] = {
        ...usersData[userIndex],
        firstname,
        lastname,
        email,
        phone,
        birthdate,
        city,
        country,
        category,
        photo: photo || usersData[userIndex].photo
    };
    fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(usersData, null, 2));
    res.redirect('/users?success=edit');
});

// Profile
app.get('/profile/edit', requireAuth, showEditProfile);
app.post('/profile/update', requireAuth, updateProfile);

// Error Handling
app.use(handle404);
app.use(handleError);

// Server
const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Le port ${PORT} est déjà utilisé. Tentative avec le port ${PORT + 1}...`);
    } else {
        console.error('Erreur lors du démarrage du serveur:', err);
    }
});