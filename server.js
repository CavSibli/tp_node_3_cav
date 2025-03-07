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