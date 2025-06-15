import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserModel, User } from '../models/UserModel';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const userModel = new UserModel();

// Serialización del usuario para la sesión
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

// Deserialización del usuario desde la sesión
passport.deserializeUser(async (id: number, done) => {
    try {
        const user = await userModel.findById(id);
        if (user) {
            // No incluir el hash de la contraseña en la sesión
            const { password_hash, ...userWithoutPassword } = user;
            done(null, userWithoutPassword as any);
        } else {
            done(null, false);
        }
    } catch (error) {
        done(error, false);
    }
});

// Estrategia local (usuario/contraseña)
passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password'
    },
    async (username: string, password: string, done) => {
        try {
            const user = await userModel.validatePassword(username, password);
            
            if (user) {
                return done(null, user as any);
            } else {
                return done(null, false, { message: 'Usuario o contraseña incorrectos' });
            }
        } catch (error) {
            return done(error);
        }
    }
));

// Estrategia Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
        },
        async (accessToken: string, refreshToken: string, profile: any, done) => {
            try {
                console.log('🔍 Google Strategy: Procesando perfil:', {
                    id: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails?.[0]?.value
                });
                
                // Buscar usuario existente por Google ID
                let user = await userModel.findByGoogleId(profile.id);
                
                if (user) {
                    console.log('✅ Usuario existente encontrado:', { id: user.id, username: user.username });
                    // Usuario existe, iniciar sesión
                    const { password_hash, ...userWithoutPassword } = user;
                    return done(null, userWithoutPassword as any);
                }
                
                console.log('🔍 Usuario no existe, creando nuevo usuario');
                // Usuario no existe, crear uno nuevo
                const newUserData = {
                    username: profile.emails?.[0]?.value || `google_${profile.id}`,
                    google_id: profile.id,
                    email: profile.emails?.[0]?.value,
                    display_name: profile.displayName
                };
                
                console.log('🔍 Datos del nuevo usuario:', newUserData);
                user = await userModel.create(newUserData);
                
                if (user) {
                    console.log('✅ Nuevo usuario creado exitosamente:', { id: user.id, username: user.username });
                    const { password_hash, ...userWithoutPassword } = user;
                    return done(null, userWithoutPassword as any);
                } else {
                    console.error('❌ Error al crear usuario con Google');
                    return done(null, false, { message: 'Error al crear usuario con Google' });
                }
            } catch (error) {
                console.error('❌ Error en Google Strategy:', error);
                return done(error);
            }
        }
    ));
} else {
    console.warn('Google OAuth no configurado: faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET');
}

export default passport;
