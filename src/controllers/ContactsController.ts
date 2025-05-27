import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ContactsModel, Contact } from '../models/ContactsModel';
import { EmailService } from '../services/emailservice';
import axios from 'axios';

export class ContactsController {
    private contactsModel = new ContactsModel();
    private emailService = new EmailService();
    private readonly DEFAULT_IP = '0.0.0.0';

    /**
     * Obtiene la dirección IP real del cliente
     * @param req Objeto de solicitud Express
     * @returns Dirección IP del cliente
     */
    private getClientIp(req: Request): string {
        // Para pruebas locales, devolver una IP pública conocida
        if (process.env.NODE_ENV === 'development') {
            console.log('Entorno de desarrollo detectado, usando IP de prueba: 8.8.8.8');
            return '8.8.8.8'; // IP de Google DNS para pruebas
        }

        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
            const ips = Array.isArray(xForwardedFor)
                ? xForwardedFor[0]
                : xForwardedFor.split(',')[0];
            const ip = ips.trim();
            console.log('IP detectada desde x-forwarded-for:', ip);
            return ip;
        }

        const xRealIp = req.headers['x-real-ip'];
        if (xRealIp) {
            const ip = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
            console.log('IP detectada desde x-real-ip:', ip);
            return ip;
        }

        const ip = req.ip || (req.socket && req.socket.remoteAddress) || this.DEFAULT_IP;
        console.log('IP detectada desde req.ip o socket:', ip);
        return ip === '::1' ? '127.0.0.1' : ip;
    }

    /**
     * Valida los datos del contacto recibidos en la solicitud
     * @param req Objeto de solicitud Express
     * @returns Objeto con el resultado de la validación y los errores
     */
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

    /**
     * Obtiene el país basado en la IP usando ipstack, con ip-api como respaldo
     * @param ip Dirección IP del cliente
     * @returns Nombre del país o mensaje de error
     */
    private async getCountryByIp(ip: string): Promise<string> {
        // Lista de patrones para IPs privadas o localhost
        const privateIpPatterns = [
            /^127\.\d+\.\d+\.\d+$/, // 127.0.0.1
            /^10\.\d+\.\d+\.\d+$/, // 10.x.x.x
            /^192\.168\.\d+\.\d+$/, // 192.168.x.x
            /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/, // 172.16-31.x.x
            /^::1$/ // IPv6 localhost
        ];

        // Verificar si la IP es privada o localhost
        if (privateIpPatterns.some(pattern => pattern.test(ip))) {
            console.warn(`IP ${ip} es privada o localhost, no se consultará ipstack`);
            return 'No disponible';
        }

        try {
            const API_KEY = process.env.IPSTACK_API_KEY;
            if (!API_KEY) {
                console.error('Error: La API key de ipstack no está configurada en el entorno (.env)');
                return await this.getCountryFromFallback(ip);
            }

            const url = `http://api.ipstack.com/${ip}?access_key=${API_KEY}`; // Usa https:// en producción
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.data || typeof response.data !== 'object') {
                console.error('Error: Respuesta de API inválida o vacía', response.data);
                return await this.getCountryFromFallback(ip);
            }

            if (response.data.success === false && response.data.error) {
                const error = response.data.error;
                console.error('Error de ipstack:', JSON.stringify(error, null, 2));
                switch (error.code) {
                    case 101:
                        console.error('Error de autenticación: API key no proporcionada o inválida');
                        return await this.getCountryFromFallback(ip);
                    case 104:
                        console.error('Límite de uso mensual alcanzado');
                        return await this.getCountryFromFallback(ip);
                    case 105:
                        console.error('Plan de suscripción no permite esta funcionalidad');
                        return await this.getCountryFromFallback(ip);
                    case 106:
                        console.error('IP inválida');
                        return 'IP inválida';
                    default:
                        console.error(`Error de ipstack: ${error.info || error.type}`);
                        return await this.getCountryFromFallback(ip);
                }
            }

            if (response.data.country_name) {
                console.log(`País encontrado para IP ${ip}: ${response.data.country_name}`);
                return response.data.country_name;
            }

            console.error('Error: Respuesta sin país', JSON.stringify(response.data, null, 2));
            return await this.getCountryFromFallback(ip);
        } catch (error) {
            if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
                console.error('Error: Timeout al conectar con ipstack');
                return await this.getCountryFromFallback(ip);
            }
            console.error('Error al obtener el país por IP:', error);
            return await this.getCountryFromFallback(ip);
        }
    }

    /**
     * Servicio alternativo para obtener el país usando ip-api
     * @param ip Dirección IP del cliente
     * @returns Nombre del país o 'No disponible'
     */
    private async getCountryFromFallback(ip: string): Promise<string> {
        try {
            const response = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
            if (response.data.status === 'success' && response.data.country) {
                console.log(`País encontrado en ip-api para IP ${ip}: ${response.data.country}`);
                return response.data.country;
            }
            console.error('Error: Respuesta de ip-api sin país', JSON.stringify(response.data, null, 2));
            return 'No disponible';
        } catch (error) {
            console.error('Error al consultar ip-api:', error);
            return 'No disponible';
        }
    }

    /**
     * Sanitiza los datos del contacto recibidos
     * @param req Objeto de solicitud Express
     * @returns Objeto Contact sanitizado
     */
    private async sanitizeContact(req: Request): Promise<Contact> {
        const ip = this.getClientIp(req);
        const country = await this.getCountryByIp(ip);
        return {
            email: req.body.email.trim().toLowerCase(),
            name: req.body.name.trim(),
            comment: (req.body.comment || req.body.message || '').trim(),
            service: (req.body.service || '').trim(),
            ip_address: ip,
            country
        };
    }

    /**
     * Obtiene los datos mensuales de contactos
     * @param req Solicitud Express
     * @param res Respuesta Express
     */
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

    /**
     * Obtiene los datos diarios de contactos
     * @param req Solicitud Express
     * @param res Respuesta Express
     */
    public async getDailyData(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.contactsModel.getDailyData();
            res.json({ data });
        } catch (error) {
            this.handleError(error, res, 'Error al obtener los datos diarios de contactos');
        }
    }

    /**
     * Obtiene el conteo total de contactos
     * @param req Solicitud Express
     * @param res Respuesta Express
     */
    public async getCount(req: Request, res: Response): Promise<void> {
        try {
            const count = await this.contactsModel.getCount();
            res.json({ count });
        } catch (error) {
            this.handleError(error, res, 'Error al obtener el conteo de contactos');
        }
    }

    /**
     * Maneja errores y envía una respuesta de error
     * @param error Error capturado
     * @param res Respuesta Express
     * @param customMessage Mensaje de error personalizado
     */
    private handleError(error: any, res: Response, customMessage?: string): void {
        console.error('Error en ContactsController:', error);
        const errorResponse = {
            success: false,
            message: customMessage || 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
        res.status(500).json(errorResponse);
    }

    /**
     * Agrega un nuevo contacto
     * @param req Solicitud Express
     * @param res Respuesta Express
     */
    public async add(req: Request, res: Response): Promise<void> {
        try {
            const validation = this.validateContact(req);
            if (!validation.isValid) {
                res.status(400).json({ errors: validation.errors });
                return;
            }
            const contact = await this.sanitizeContact(req);
            const success = await this.contactsModel.create(contact);
            if (success) {
                // Enviar notificación por correo electrónico
                await this.emailService.sendContactNotification(contact);
                res.status(200).json({ message: 'Contacto guardado correctamente' });
            } else {
                res.status(500).json({ message: 'Error al guardar el contacto' });
            }
        } catch (error) {
            this.handleError(error, res, 'Error al procesar el contacto');
        }
    }

    /**
     * Obtiene todos los contactos y renderiza la vista o devuelve JSON
     * @param req Solicitud Express
     * @param res Respuesta Express
     */
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