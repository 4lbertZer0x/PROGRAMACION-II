import { Database } from './Database';
import { PaymentsModel } from './PaymentsModel';

export interface Contact {
    id?: number;
    email: string;
    name: string;
    comment: string;
    ip_address: string;
    country?: string;
    service?: string;
    created_at?: string;
}

export interface CombinedDailyData {
    day: number;
    contacts: number;
    payments: number;
}

export class ContactsModel {
    private db = Database.getInstance().getDatabase();

    public async create(contact: Contact): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const { email, name, comment, ip_address, country, service, created_at } = contact;
            const createdAtValue = created_at || new Date().toISOString();
            const query = `
                INSERT INTO contacts (email, name, comment, ip_address, country, service, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(query, [email, name, comment, ip_address, country || '', service || '', createdAtValue], (err) => {
                if (err) {
                    console.error('Error al guardar el contacto:', err);
                    reject(false);
                }
                resolve(true);
            });
        });
    }

    public async getAll(): Promise<Contact[]> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM contacts ORDER BY created_at DESC';

            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Error al obtener los contactos:', err);
                    reject([]);
                }
                resolve(rows as Contact[]);
            });
        });
    }

    public async getCount(): Promise<number> {
        return new Promise((resolve) => {
            const query = 'SELECT COUNT(*) as count FROM contacts';
            
            this.db.get(query, [], (err, row: { count: number }) => {
                if (err) {
                    console.error('Error al obtener el conteo de contactos:', err);
                    resolve(0);
                    return;
                }
                resolve(row ? row.count : 0);
            });
        });
    }

    public async getById(id: number): Promise<Contact | null> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM contacts WHERE id = ?';

            this.db.get(query, [id], (err, row) => {
                if (err) {
                    console.error('Error al obtener el contacto:', err);
                    reject(null);
                }
                resolve(row as Contact || null);
            });
        });
    }

    public async getMonthlyData(): Promise<{ days: number[]; contacts: number[] }> {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    strftime('%d', created_at) as day,
                    COUNT(*) as daily_count
                FROM contacts
                WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
                GROUP BY day
                ORDER BY day ASC
            `;
            
            this.db.all(query, [], (err, rows: { day: string; daily_count: number }[]) => {
                if (err) {
                    console.error('Error al obtener los datos mensuales de contactos:', err);
                    reject({ days: [], contacts: [] });
                }
                const days = rows.map(row => parseInt(row.day));
                const contacts = rows.map(row => row.daily_count);
                resolve({ days, contacts });
            });
        });
    }
    
    /**
     * Obtiene datos combinados de contactos y pagos para el mes actual
     * @returns Datos diarios combinados de contactos y pagos
     */
    public async getCombinedMonthlyData(): Promise<CombinedDailyData[]> {
        try {
            // Obtener datos de contactos
            const contactsData = await this.getMonthlyData();
            
            // Obtener datos de pagos
            const paymentsModel = new PaymentsModel();
            const paymentsData = await paymentsModel.getMonthlyData();
            
            // Crear un mapa con todos los días del mes actual
            const currentDate = new Date();
            const daysInMonth = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0
            ).getDate();
            
            // Inicializar el array de datos combinados
            const combinedData: CombinedDailyData[] = [];
            
            // Crear un mapa para facilitar la búsqueda
            const contactsMap = new Map<number, number>();
            const paymentsMap = new Map<number, number>();
            
            // Llenar los mapas con los datos existentes
            contactsData.days.forEach((day: number, index: number) => {
                contactsMap.set(day, contactsData.contacts[index]);
            });
            
            paymentsData.days.forEach((day: number, index: number) => {
                paymentsMap.set(day, paymentsData.amounts[index]);
            });
            
            // Generar el array combinado para todos los días del mes
            for (let day = 1; day <= daysInMonth; day++) {
                combinedData.push({
                    day,
                    contacts: contactsMap.get(day) || 0,
                    payments: paymentsMap.get(day) || 0
                });
            }
            
            return combinedData;
        } catch (error) {
            console.error('Error al obtener datos combinados:', error);
            return [];
        }
    }

    public async getDailyData(): Promise<any> {
        return new Promise((resolve, reject) => {
            // Obtener el mes y año actual
            const now = new Date();
            const currentMonth = now.getMonth() + 1; // Los meses en JS son 0-indexed
            const currentYear = now.getFullYear();
            
            // Consulta para obtener contactos por día del mes actual
            const query = `
                SELECT 
                    CAST(strftime('%d', datetime(created_at)) AS INTEGER) as day,
                    COUNT(*) as count,
                    date(created_at, 'localtime') as date
                FROM contacts
                WHERE 
                    strftime('%m', created_at) = ? AND
                    strftime('%Y', created_at) = ?
                GROUP BY date(created_at, 'localtime')
                ORDER BY date(created_at, 'localtime') ASC
            `;

            this.db.all(query, [currentMonth.toString().padStart(2, '0'), currentYear.toString()], (err, rows) => {
                if (err) {
                    console.error('Error al obtener los datos diarios de contactos:', err);
                    reject([]);
                }
                resolve(rows);
            });
        });
    }
}