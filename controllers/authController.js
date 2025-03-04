
import { verifyUser } from '../services/userService.js';

export const login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await verifyUser(email, password);
        
        if (!user) {
            return res.redirect('/?error=1');
        }
        
        const birthDate = new Date(user.birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        const options = { day: 'numeric', month: 'long' };
        const birthday = new Date(user.birthdate).toLocaleDateString('fr-FR', options);
        
        req.session.user = {
            ...user,
            age,
            birthday
        };
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.redirect('/?error=1');
    }
}; 