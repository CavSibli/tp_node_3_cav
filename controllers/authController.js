import { verifyCredentials } from '../services/userService.js';

// Gérer la connexion
export const login = (req, res) => {
    const { email, password } = req.body;
    
    const user = verifyCredentials(email, password);
    if (!user) {
        return res.redirect('/?error=1');
    }
    
    // Stocker l'utilisateur dans la session
    req.session.user = user;
    res.redirect('/dashboard');
};

// Gérer la déconnexion
export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la déconnexion:', err);
        }
        res.redirect('/');
    });
}; 