export const handle404 = (req, res) => {
    res.status(404).render('error', {
        message: 'Page non trouvée',
        error: { status: 404 }
    });
};

export const handleError = (err, req, res, next) => {
    console.error(err.stack);
    
    // Determine the error message based on the error type
    let errorMessage = 'Une erreur est survenue';
    let statusCode = 500;

    if (err.name === 'ValidationError') {
        errorMessage = 'Les données fournies ne sont pas valides';
        statusCode = 400;
    } else if (err.name === 'UnauthorizedError') {
        errorMessage = 'Vous n\'êtes pas autorisé à accéder à cette ressource';
        statusCode = 403;
    } else if (err.name === 'NotFoundError') {
        errorMessage = 'La ressource demandée n\'existe pas';
        statusCode = 404;
    } else if (err.code === 'ER_DUP_ENTRY') {
        errorMessage = 'Cette donnée existe déjà dans la base de données';
        statusCode = 409;
    }

    res.status(statusCode).render('error', {
        message: errorMessage,
        error: { status: statusCode }
    });
}; 