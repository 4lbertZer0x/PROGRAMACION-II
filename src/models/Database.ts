import sqlite3 from 'sqlite3';
import { Database as SQLiteDatabase } from 'sqlite3';

export class Database {
    private static instance: Database;
    private db: SQLiteDatabase;

    private constructor() {
        this.db = new sqlite3.Database('database.sqlite', (err) => {
            if (err) {
                console.error('Error al conectar con la base de datos:', err);
            } else {
                console.log('Conexión exitosa con la base de datos SQLite');
                this.initializeTables();
            }
        });
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    private getCurrentDateTime(): string {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = now.getFullYear();
        const hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = String(hours % 12 || 12).padStart(2, '0');
        
        return `${month}/${day}/${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
    }

    private initializeTables(): void {
        const defaultDate = this.getCurrentDateTime();

        // Tabla de contactos
        this.db.run(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                comment TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                country TEXT,
                service TEXT,
                created_at DATETIME DEFAULT '${defaultDate}'
            )
        `);

        // Tabla de pagos
        this.db.run(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                cardholder_name TEXT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                currency TEXT NOT NULL,
                service_type TEXT NOT NULL,
                status TEXT NOT NULL,
                transaction_id TEXT,
                created_at DATETIME DEFAULT '${defaultDate}'
            )
        `);
        
        // Verificar si la columna transaction_id existe, si no, añadirla
        this.db.all("PRAGMA table_info(payments)", [], (err, rows) => {
            if (err) {
                console.error('Error al verificar la estructura de la tabla payments:', err);
                return;
            }
            
            // Comprobar si la columna transaction_id ya existe
            const hasTransactionId = rows && rows.some((row: any) => row.name === 'transaction_id');
            
            if (!hasTransactionId) {
                // Añadir la columna transaction_id si no existe
                this.db.run(`ALTER TABLE payments ADD COLUMN transaction_id TEXT;`, (err) => {
                    if (err) {
                        console.error('Error al añadir la columna transaction_id:', err);
                    } else {
                        console.log('Columna transaction_id añadida correctamente a la tabla payments');
                    }
                });
            }
        });
    }

    public getDatabase(): SQLiteDatabase {
        return this.db;
    }
}