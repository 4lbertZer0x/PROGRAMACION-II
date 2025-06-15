import { Request, Response, NextFunction } from 'express';

// Extender la interfaz Request para incluir user
declare global {
    namespace Express {
        interface User {
            id: number;
            username: string;
            email?: string;
            display_name?: string;
        }
    }
}

/**
 * Middleware para verificar si el usuario está autenticado
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    console.log('🔍 RequireAuth middleware:', {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user ? { id: req.user.id, username: req.user.username } : null,
        sessionID: req.sessionID,
        url: req.url
    });
    
    if (req.isAuthenticated && req.isAuthenticated()) {
        console.log('✅ Usuario autenticado, permitiendo acceso');
        return next();
    }
    
    console.log('❌ Usuario no autenticado, redirigiendo a login');
    
    // Si es una petición AJAX, devolver JSON
    if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
        res.status(401).json({ 
            error: 'No autorizado', 
            message: 'Debes iniciar sesión para acceder a este recurso' 
        });
        return;
    }
    
    // Redirigir a la página de login
    res.redirect('/auth/login');
};

/**
 * Middleware para verificar si el usuario ya está autenticado
 * (útil para páginas de login/registro)
 */
export const requireGuest = (req: Request, res: Response, next: NextFunction): void => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.redirect('/admin');
        return;
    }
    next();
};

/**
 * Middleware para verificar si el usuario es administrador
 * (por ahora, cualquier usuario autenticado es admin)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    
    // Si es una petición AJAX, devolver JSON
    if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
        res.status(403).json({ 
            error: 'Acceso denegado', 
            message: 'No tienes permisos de administrador' 
        });
        return;
    }
    
    // Redirigir a la página de login
    res.redirect('/auth/login');
};

/**
 * Middleware para pasar información del usuario a las vistas
 */
export const passUserToViews = (req: Request, res: Response, next: NextFunction): void => {
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
    next();
};
