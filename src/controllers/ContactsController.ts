import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ContactsModel, Contact } from '../models/ContactsModel';

export class ContactsController {
    private contactsModel = new ContactsModel();
    private readonly DEFAULT_IP = '0.0.0.0';
    
    /**
     * Obtiene la dirección IP real del cliente
     * @param req Objeto de solicitud Express
     * @returns Dirección IP del cliente
     */
    private getClientIp(req: Request): string {
        // Intentar obtener la IP de los encabezados de proxy
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
            // x-forwarded-for puede contener múltiples IPs separadas por comas
            const ips = Array.isArray(xForwardedFor) 
                ? xForwardedFor[0] 
                : xForwardedFor.split(',')[0];
            return ips.trim();
        }
        
        // Intentar obtener de otros encabezados comunes
        const xRealIp = req.headers['x-real-ip'];
        if (xRealIp) {
            return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
        }
        
        // Obtener de req.ip (Express) o req.socket.remoteAddress (Node.js)
        const ip = req.ip || (req.socket && req.socket.remoteAddress);
        
        // Si la IP es ::1 (localhost en IPv6), devolver 127.0.0.1 (localhost en IPv4)
        if (ip === '::1') {
            return '127.0.0.1';
        }
        
        return ip || this.DEFAULT_IP;
    }

    private validateContact(req: Request): { isValid: boolean; errors: any[] } {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return {
                isValid: false,
                errors: errors.array().map(error => ({
                    field: error.type === 'field' ? error.path : error.type,
                    message: error.msg
                }))
            };
        }

        if (!req.body.email?.trim() || !req.body.name?.trim()) {
            return {
                isValid: false,
                errors: [{
                    field: !req.body.email?.trim() ? 'email' : 'name',
                    message: 'El correo electrónico y el nombre son obligatorios'
                }]
            };
        }

        return { isValid: true, errors: [] };
    }

    private sanitizeContact(req: Request): Contact {
        return {
            email: req.body.email.trim().toLowerCase(),
            name: req.body.name.trim(),
            comment: (req.body.comment || req.body.message || '').trim(),
            service: (req.body.service || '').trim(),
            ip_address: this.getClientIp(req)
        };
    }

    public async getMonthlyData(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.contactsModel.getMonthlyData();
            res.json(data);
        } catch (error) {
            this.handleError(error, res, 'Error al obtener los datos mensuales de contactos');
        }
    }
    
    /**
     * Obtiene los datos combinados de contactos y pagos para el gráfico
     * @param req Solicitud Express
     * @param res Respuesta Express
     */
    public async getCombinedData(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.contactsModel.getCombinedMonthlyData();
            res.json(data);
        } catch (error) {
            this.handleError(error, res, 'Error al obtener los datos combinados para el gráfico');
        }
    }

    public async getDailyData(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.contactsModel.getDailyData();
            res.json({ data });
        } catch (error) {
            this.handleError(error, res, 'Error al obtener los datos diarios de contactos');
        }
    }

    public async getCount(req: Request, res: Response): Promise<void> {
        try {
            const count = await this.contactsModel.getCount();
            res.json({ count });
        } catch (error) {
            this.handleError(error, res, 'Error al obtener el conteo de contactos');
        }
    }

    private handleError(error: any, res: Response, customMessage?: string): void {
        console.error('Error en ContactsController:', error);
        const errorResponse = {
            success: false,
            message: customMessage || 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
        res.status(500).json(errorResponse);
    }

    public async add(req: Request, res: Response): Promise<void> {
        try {
            const validation = this.validateContact(req);
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    errors: validation.errors
                });
                return;
            }

            const contact = this.sanitizeContact(req);
            const success = await this.contactsModel.create(contact);

            if (!success) {
                throw new Error('Error al guardar el contacto en la base de datos');
            }

            res.status(201).json({
                success: true,
                message: 'Contacto guardado exitosamente'
            });
        } catch (error) {
            this.handleError(error, res);
        }
    }

    public async index(req: Request, res: Response): Promise<void> {
        try {
            const contacts = await this.contactsModel.getAll();
            const isJsonRequest = req.headers.accept?.includes('application/json');

            if (isJsonRequest) {
                res.json({
                    success: true,
                    data: contacts
                });
                return;
            }

            res.render('admin/contacts', { 
                contacts,
                success: true
            });
        } catch (error) {
            const errorMessage = 'Error al obtener los contactos';
            
            if (req.headers.accept?.includes('application/json')) {
                this.handleError(error, res, errorMessage);
                return;
            }

            res.render('admin/contacts', { 
                contacts: [],
                error: errorMessage
            });
        }
    }
}