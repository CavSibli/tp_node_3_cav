export const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/?error=2');
    }
    next();
};

export const setUserLocals = (req, res, next) => {
    res.locals.user = req.session.user;
    next();
}; 