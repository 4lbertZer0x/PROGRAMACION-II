import { Database } from './Database';
import bcrypt from 'bcrypt';

export interface User {
    id?: number;
    username: string;
    password_hash?: string;
    google_id?: string;
    email?: string;
    display_name?: string;
    created_at?: string;
}

export interface CreateUserData {
    username: string;
    password?: string;
    google_id?: string;
    email?: string;
    display_name?: string;
}

export class UserModel {
    private db = Database.getInstance().getDatabase();
    private readonly SALT_ROUNDS = 12;

    /**
     * Crear un nuevo usuario
     */
    public async create(userData: CreateUserData): Promise<User | null> {
        return new Promise(async (resolve, reject) => {
            try {
                let password_hash = null;
                
                // Si se proporciona una contraseña, hashearla
                if (userData.password) {
                    password_hash = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
                }

                const query = `
                    INSERT INTO users (username, password_hash, google_id, email, display_name)
                    VALUES (?, ?, ?, ?, ?)
                `;

                this.db.run(
                    query,
                    [
                        userData.username,
                        password_hash,
                        userData.google_id || null,
                        userData.email || null,
                        userData.display_name || null
                    ],
                    function(err) {
                        if (err) {
                            console.error('Error al crear usuario:', err);
                            reject(null);
                            return;
                        }

                        // Obtener el usuario recién creado
                        const selectQuery = 'SELECT * FROM users WHERE id = ?';
                        Database.getInstance().getDatabase().get(selectQuery, [this.lastID], (err, row) => {
                            if (err) {
                                console.error('Error al obtener usuario creado:', err);
                                reject(null);
                                return;
                            }
                            resolve(row as User);
                        });
                    }
                );
            } catch (error) {
                console.error('Error en el proceso de creación de usuario:', error);
                reject(null);
            }
        });
    }

    /**
     * Buscar usuario por nombre de usuario
     */
    public async findByUsername(username: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE username = ?';
            
            this.db.get(query, [username], (err, row) => {
                if (err) {
                    console.error('Error al buscar usuario por username:', err);
                    reject(null);
                    return;
                }
                resolve(row as User || null);
            });
        });
    }

    /**
     * Buscar usuario por Google ID
     */
    public async findByGoogleId(googleId: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE google_id = ?';
            
            this.db.get(query, [googleId], (err, row) => {
                if (err) {
                    console.error('Error al buscar usuario por Google ID:', err);
                    reject(null);
                    return;
                }
                resolve(row as User || null);
            });
        });
    }

    /**
     * Buscar usuario por ID
     */
    public async findById(id: number): Promise<User | null> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE id = ?';
            
            this.db.get(query, [id], (err, row) => {
                if (err) {
                    console.error('Error al buscar usuario por ID:', err);
                    reject(null);
                    return;
                }
                resolve(row as User || null);
            });
        });
    }

    /**
     * Validar contraseña de usuario
     */
    public async validatePassword(username: string, password: string): Promise<User | null> {
        try {
            const user = await this.findByUsername(username);
            
            if (!user || !user.password_hash) {
                return null;
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            
            if (isValid) {
                // No devolver el hash de la contraseña
                const { password_hash, ...userWithoutPassword } = user;
                return userWithoutPassword as User;
            }
            
            return null;
        } catch (error) {
            console.error('Error al validar contraseña:', error);
            return null;
        }
    }

    /**
     * Obtener todos los usuarios (para administración)
     */
    public async getAll(): Promise<User[]> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, username, email, display_name, created_at FROM users ORDER BY created_at DESC';
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Error al obtener usuarios:', err);
                    reject([]);
                    return;
                }
                resolve(rows as User[]);
            });
        });
    }

    /**
     * Verificar si existe algún usuario (para determinar si es la primera instalación)
     */
    public async hasUsers(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count FROM users';
            
            this.db.get(query, [], (err, row: any) => {
                if (err) {
                    console.error('Error al verificar usuarios:', err);
                    reject(false);
                    return;
                }
                resolve(row.count > 0);
            });
        });
    }
}
