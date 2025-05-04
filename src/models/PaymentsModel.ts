import { Database } from './Database';

export interface Payment {
    id?: number;
    email: string;
    cardholder_name: string;
    amount: number;
    currency: string;
    service_type: string;
    status: string;
    created_at?: string;
}

export class PaymentsModel {
    private db = Database.getInstance().getDatabase();

    public async create(payment: Payment): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const { email, cardholder_name, amount, currency, service_type, created_at } = payment;
            const createdAtValue = created_at || new Date().toISOString();
            const query = `
                INSERT INTO payments (email, cardholder_name, amount, currency, service_type, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(
                query,
                [email, cardholder_name, amount, currency, service_type, 'completed', createdAtValue],
                (err) => {
                    if (err) {
                        console.error('Error al procesar el pago:', err);
                        reject(false);
                    }
                    resolve(true);
                }
            );
        });
    }

    public async getAll(): Promise<Payment[]> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM payments ORDER BY created_at DESC';

            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Error al obtener los pagos:', err);
                    reject([]);
                }
                resolve(rows as Payment[]);
            });
        });
    }

    public async getById(id: number): Promise<Payment | null> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM payments WHERE id = ?';

            this.db.get(query, [id], (err, row) => {
                if (err) {
                    console.error('Error al obtener el pago:', err);
                    reject(null);
                }
                resolve(row as Payment || null);
            });
        });
    }

    public async getTotal(): Promise<number> {
        return new Promise((resolve, reject) => {
            const query = 'SELECT SUM(amount) as total FROM payments WHERE status = "completed"';
            
            this.db.get(query, [], (err, row: { total: number }) => {
                if (err) {
                    console.error('Error al obtener el total de pagos:', err);
                    reject(0);
                }
                resolve(row.total || 0);
            });
        });
    }

    public async getMonthlyData(): Promise<{ days: number[]; amounts: number[] }> {
        return new Promise((resolve, reject) => {
            // Obtener la fecha actual en formato YYYY-MM-DD
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0];
            
            const query = `
                SELECT 
                    strftime('%d', created_at) as day,
                    SUM(amount) as daily_amount
                FROM payments
                WHERE 
                    (strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') OR
                    DATE(created_at) = ?) AND
                    status = 'completed'
                GROUP BY day
                ORDER BY day ASC
            `;

            this.db.all(query, [currentDate], (err, rows: { day: string; daily_amount: number }[]) => {
                if (err) {
                    console.error('Error al obtener los datos mensuales de pagos:', err);
                    reject({ days: [], amounts: [] });
                }
                
                // Verificar si hay datos para el día actual
                const currentDay = now.getDate().toString().padStart(2, '0');
                let hasCurrentDay = false;
                
                for (const row of rows) {
                    if ((row as { day: string }).day === currentDay) {
                        hasCurrentDay = true;
                        break;
                    }
                }
                
                // Si no hay datos para el día actual pero debería haberlos, forzar una consulta específica
                if (!hasCurrentDay) {
                    console.log('Verificando pagos específicamente para hoy:', currentDate);
                    const todayQuery = `
                        SELECT 
                            strftime('%d', created_at) as day,
                            SUM(amount) as daily_amount
                        FROM payments
                        WHERE 
                            DATE(created_at) = ? AND
                            status = 'completed'
                        GROUP BY day
                    `;
                    
                    this.db.all(todayQuery, [currentDate], (todayErr, todayRows: { day: string; daily_amount: number }[]) => {
                        if (todayErr) {
                            console.error('Error al verificar pagos de hoy:', todayErr);
                        } else if (todayRows.length > 0) {
                            // Combinar los resultados
                            rows = [...rows, ...todayRows.filter((tr: { day: string; daily_amount: number }) => !rows.some((r: { day: string; daily_amount: number }) => r.day === tr.day))];
                        }
                        
                        const days = rows.map(row => parseInt(row.day));
                        const amounts = rows.map(row => row.daily_amount);
                        resolve({ days, amounts });
                    });
                } else {
                    const days = rows.map(row => parseInt(row.day));
                    const amounts = rows.map(row => row.daily_amount);
                    resolve({ days, amounts });
                }
            });
        });
    }

    public async getDailyData(): Promise<any> {
        return new Promise((resolve, reject) => {
            // Obtener el mes y año actual
            const now = new Date();
            const currentMonth = now.getMonth() + 1; // Los meses en JS son 0-indexed
            const currentYear = now.getFullYear();
            const currentDate = now.toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD
            
            // Consulta para obtener pagos por día del mes actual
            const query = `
                SELECT 
                    strftime('%d', created_at) as day,
                    COUNT(*) as count,
                    DATE(created_at) as date
                FROM payments
                WHERE 
                    ((strftime('%m', created_at) = ? AND
                    strftime('%Y', created_at) = ?) OR
                    DATE(created_at) = ?) AND
                    status = 'completed'
                GROUP BY day
                ORDER BY day ASC
            `;

            this.db.all(query, [
                currentMonth.toString().padStart(2, '0'), 
                currentYear.toString(),
                currentDate
            ], (err, rows: { day: string; count: number; date: string }[]) => {
                if (err) {
                    console.error('Error al obtener los datos diarios de pagos:', err);
                    reject([]);
                    return;
                }
                
                // Verificar si hay datos para el día actual
                const currentDay = now.getDate().toString().padStart(2, '0');
                let hasCurrentDay = false;
                
                for (const row of rows) {
                    if ((row as { day: string }).day === currentDay) {
                        hasCurrentDay = true;
                        break;
                    }
                }
                
                // Si no hay datos para el día actual pero debería haberlos, forzar una consulta específica
                if (!hasCurrentDay) {
                    console.log('Verificando pagos específicamente para hoy:', currentDate);
                    const todayQuery = `
                        SELECT 
                            strftime('%d', created_at) as day,
                            COUNT(*) as count,
                            DATE(created_at) as date
                        FROM payments
                        WHERE 
                            DATE(created_at) = ? AND
                            status = 'completed'
                        GROUP BY day
                    `;
                    
                    this.db.all(todayQuery, [currentDate], (todayErr, todayRows: { day: string; count: number; date: string }[]) => {
                        if (todayErr) {
                            console.error('Error al verificar pagos de hoy:', todayErr);
                        } else if (todayRows.length > 0) {
                            // Combinar los resultados
                            rows = [...rows, ...todayRows.filter((tr: { day: string; count: number; date: string }) => !rows.some((r: { day: string; count: number; date: string }) => r.day === tr.day))];
                        }
                        
                        resolve(rows);
                    });
                } else {
                    resolve(rows);
                }
            });
        });
    }
}