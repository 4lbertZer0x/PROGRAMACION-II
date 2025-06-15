import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import passport from 'passport';
import { UserModel, CreateUserData } from '../models/UserModel';

export class AuthController {
    private userModel = new UserModel();

    /**
     * Mostrar página de login
     */
    public async showLogin(req: Request, res: Response): Promise<void> {
        const messages = {
            error: req.flash('error'),
            success: req.flash('success')
        };
        
        res.render('auth/login', { 
            title: 'Iniciar Sesión',
            messages,
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
        });
    }

    /**
     * Procesar login local
     */
    public login(req: Request, res: Response, next: NextFunction): void {
        passport.authenticate('local', (err: any, user: any, info: any) => {
            if (err) {
                console.error('Error en autenticación:', err);
                req.flash('error', 'Error interno del servidor');
                return res.redirect('/auth/login');
            }
            
            if (!user) {
                req.flash('error', info?.message || 'Credenciales incorrectas');
                return res.redirect('/auth/login');
            }
            
            req.logIn(user, (err) => {
                if (err) {
                    console.error('Error al iniciar sesión:', err);
                    req.flash('error', 'Error al iniciar sesión');
                    return res.redirect('/auth/login');
                }
                
                console.log('Usuario logueado exitosamente:', user.username);
                req.flash('success', `¡Bienvenido, ${user.display_name || user.username}!`);
                res.redirect('/admin');
            });
        })(req, res, next);
    }

    /**
     * Cerrar sesión
     */
    public logout(req: Request, res: Response): void {
        req.logout((err) => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
                req.flash('error', 'Error al cerrar sesión');
                return res.redirect('/admin');
            }
            
            // Establecer mensaje flash antes de destruir la sesión
            req.flash('success', 'Sesión cerrada correctamente');
            
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error al destruir sesión:', err);
                }
                
                res.clearCookie('connect.sid');
                res.redirect('/');
            });
        });
    }

    /**
     * Mostrar página de registro (solo para administradores)
     */
    public async showRegister(req: Request, res: Response): Promise<void> {
        const messages = {
            error: req.flash('error'),
            success: req.flash('success')
        };
        
        res.render('auth/register', { 
            title: 'Registrar Usuario',
            messages
        });
    }

    /**
     * Procesar registro de usuario
     */
    public async register(req: Request, res: Response): Promise<void> {
        try {
            // Validar datos del formulario
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('error', 'Datos del formulario inválidos');
                return res.redirect('/auth/register');
            }

            const { username, password, email, display_name } = req.body;

            // Verificar si el usuario ya existe
            const existingUser = await this.userModel.findByUsername(username);
            if (existingUser) {
                req.flash('error', 'El nombre de usuario ya está en uso');
                return res.redirect('/auth/register');
            }

            // Crear nuevo usuario
            const userData: CreateUserData = {
                username,
                password,
                email: email || undefined,
                display_name: display_name || username
            };

            const newUser = await this.userModel.create(userData);
            
            if (newUser) {
                req.flash('success', 'Usuario creado correctamente');
                res.redirect('/admin/users');
            } else {
                req.flash('error', 'Error al crear el usuario');
                res.redirect('/auth/register');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            req.flash('error', 'Error interno del servidor');
            res.redirect('/auth/register');
        }
    }

    /**
     * Iniciar autenticación con Google
     */
    public googleAuth = passport.authenticate('google', {
        scope: ['profile', 'email']
    });

    /**
     * Callback de Google OAuth
     */
    public googleCallback(req: Request, res: Response, next: NextFunction): void {
        console.log('🔍 Google callback iniciado');
        passport.authenticate('google', (err: any, user: any, info: any) => {
            console.log('🔍 Resultado de autenticación Google:', { err: !!err, user: !!user, info });
            
            if (err) {
                console.error('❌ Error en autenticación Google:', err);
                req.flash('error', 'Error al autenticar con Google');
                return res.redirect('/auth/login');
            }
            
            if (!user) {
                console.error('❌ No se recibió usuario:', info);
                req.flash('error', info?.message || 'Error al autenticar con Google');
                return res.redirect('/auth/login');
            }
            
            console.log('✅ Usuario recibido:', { id: user.id, username: user.username, email: user.email });
            
            req.logIn(user, (err) => {
                if (err) {
                    console.error('❌ Error al iniciar sesión con Google:', err);
                    req.flash('error', 'Error al iniciar sesión');
                    return res.redirect('/auth/login');
                }
                
                console.log('✅ Usuario logueado exitosamente');
                console.log('✅ Redirigiendo a /admin');
                
                req.flash('success', `¡Bienvenido, ${user.display_name || user.username}!`);
                res.redirect('/admin');
            });
        })(req, res, next);
    }

    /**
     * Verificar estado de autenticación (API)
     */
    public checkAuth(req: Request, res: Response): void {
        if (req.isAuthenticated && req.isAuthenticated()) {
            res.json({
                authenticated: true,
                user: {
                    id: req.user?.id,
                    username: req.user?.username,
                    display_name: req.user?.display_name
                }
            });
        } else {
            res.json({ authenticated: false });
        }
    }

    /**
     * Página de administración principal
     */
    public async showAdmin(req: Request, res: Response): Promise<void> {
        const messages = {
            error: req.flash('error'),
            success: req.flash('success')
        };
        
        res.render('admin/admin', {
            title: 'Panel de Administración',
            messages,
            user: req.user
        });
    }
}
