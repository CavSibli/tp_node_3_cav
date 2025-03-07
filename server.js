import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { setUserLocals } from './middleware/auth.js';
import { handle404, handleError } from './middleware/error.js';
import connectDB from './config/database.js';
import User from './models/User.js';
import userRoutes from './routes/userRoutes.js';

// Configuration
dotenv.config();
const app = express();

// Connexion à MongoDB
connectDB();

// Configuration des vues
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
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.redirect('/?error=1');
        }
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.redirect('/?error=1');
        }
        
        req.session.user = user;
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Erreur de connexion:', error);
        res.redirect('/?error=1');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Dashboard
app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const randomUser = await User.aggregate([{ $sample: { size: 1 } }]);
        res.render('dashboard', { 
            user: req.session.user,
            randomUser: randomUser[0]
        });
    } catch (error) {
        console.error('Erreur dashboard:', error);
        res.redirect('/');
    }
});

// Users
app.get('/users', requireAuth, async (req, res) => {
    try {
        const { name, category, city } = req.query;
        let query = {};
        
        if (name) {
            query.$or = [
                { firstname: new RegExp(name, 'i') },
                { lastname: new RegExp(name, 'i') }
            ];
        }
        if (category) query.category = category;
        if (city) query.city = new RegExp(city, 'i');
        
        const users = await User.find(query);
        res.render('users', { 
            users,
            filters: { name, category, city }
        });
    } catch (error) {
        console.error('Erreur liste utilisateurs:', error);
        res.redirect('/dashboard');
    }
});

// CRUD Users
app.post('/users/delete/:id', requireAuth, async (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/users?success=delete');
    } catch (error) {
        console.error('Erreur suppression:', error);
        res.redirect('/users?error=delete');
    }
});

app.get('/users/edit/:id', requireAuth, async (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('Utilisateur non trouvé');
        }
        res.render('edit-user', { user });
    } catch (error) {
        console.error('Erreur édition:', error);
        res.redirect('/users');
    }
});

app.post('/users/edit/:id', requireAuth, async (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const { password, ...userData } = req.body;
        if (password) {
            userData.password = await bcrypt.hash(password, 10);
        }
        await User.findByIdAndUpdate(req.params.id, userData);
        res.redirect('/users?success=edit');
    } catch (error) {
        console.error('Erreur mise à jour:', error);
        res.redirect('/users?error=edit');
    }
});

app.get('/users/add', requireAuth, (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    res.render('add-user');
});

app.post('/users/add', requireAuth, async (req, res) => {
    if (!req.session.user.isAdmin) {
        return res.status(403).send('Accès non autorisé');
    }
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.redirect('/users?success=add');
    } catch (error) {
        console.error('Erreur ajout utilisateur:', error);
        res.redirect('/users?error=add');
    }
});

// Routes utilisateur
app.use('/', userRoutes);

// Error Handling
app.use(handle404);
app.use(handleError);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Le port ${PORT} est déjà utilisé. Tentative avec le port ${PORT + 1}...`);
        app.listen(PORT + 1);
    } else {
        console.error('Erreur lors du démarrage du serveur:', err);
    }
});