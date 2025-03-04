import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import { getRandomUser } from './services/userService.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'votre_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/?error=2');
    }
    next();
};

const PORT = process.env.PORT;

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    const error = req.query.error;
    res.render('login', { error });
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
