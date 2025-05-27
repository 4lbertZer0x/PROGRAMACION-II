import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PaymentsModel, Payment } from '../models/PaymentsModel';
import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Interfaz para la respuesta de la API de FakePayment
interface FakePaymentResponse {
    status?: string;
    transaction_id?: string;
    message?: string;
}

export class PaymentsController {
    private paymentsModel = new PaymentsModel();

    public async add(req: Request, res: Response): Promise<void> {
        try {
            // Validar los datos del formulario
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            // Obtener API key desde variables de entorno
            const apiKey = process.env.FAKEPAYMENT_API || '';
            if (!apiKey) {
                console.error('Error: FAKEPAYMENT_API no está configurada');
                res.status(500).json({ message: 'Error de configuración del servidor' });
                return;
            }

            // Preparar datos para enviar a la API de FakePayment
            const paymentData = {
                amount: parseFloat(req.body.amount),
                'card-number': req.body.card_number.replace(/\s+/g, ''),
                cvv: parseInt(req.body.cvv),
                'expiration-month': parseInt(req.body.expiration_month),
                'expiration-year': parseInt(req.body.expiration_year),
                'full-name': req.body.cardholder_name,
                currency: req.body.currency,
                description: `Pago por servicio: ${req.body.service_type}`,
                reference: `ref-${Date.now()}`
            };

            // Realizar solicitud a la API de FakePayment
            const response: AxiosResponse<FakePaymentResponse> = await axios.post('https://fakepayment.onrender.com/payments', paymentData, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            // Procesar respuesta de la API
            let paymentStatus = 'completed';
            let responseMessage = 'Pago procesado exitosamente';

            // Verificar la respuesta según la documentación de FakePayment
            if (response.data && typeof response.data === 'object' && 'status' in response.data && response.data.status) {
                if (response.data.status === 'REJECTED') {
                    paymentStatus = 'rejected';
                    responseMessage = 'Pago rechazado por el procesador';
                } else if (response.data.status === 'ERROR') {
                    paymentStatus = 'error';
                    responseMessage = 'Error en el procesamiento del pago';
                } else if (response.data.status === 'INSUFFICIENT') {
                    paymentStatus = 'insufficient_funds';
                    responseMessage = 'Fondos insuficientes';
                }
            }

            // Crear objeto de pago (evitando almacenar datos sensibles de tarjeta)
            const payment: Payment = {
                email: req.body.email,
                cardholder_name: req.body.cardholder_name,
                amount: parseFloat(req.body.amount),
                currency: req.body.currency,
                service_type: req.body.service_type,
                status: paymentStatus,
                transaction_id: response.data && typeof response.data === 'object' && 'transaction_id' in response.data ? response.data.transaction_id : null
            };

            // Guardar registro del pago en la base de datos
            const success = await this.paymentsModel.create(payment);

            if (success) {
                res.status(200).json({ 
                    message: responseMessage,
                    status: paymentStatus,
                    transaction_id: payment.transaction_id
                });
            } else {
                res.status(500).json({ message: 'Error al registrar el pago' });
            }
        } catch (error) {
            console.error('Error en PaymentsController.add:', error);
            let errorMessage = 'Error interno del servidor';
            
            // Manejar errores específicos de la API
            if (error && typeof error === 'object' && 'response' in error && error.response && 
                typeof error.response === 'object' && 'data' in error.response && error.response.data &&
                typeof error.response.data === 'object' && 'message' in error.response.data) {
                errorMessage = `Error: ${error.response.data.message || 'Error en la comunicación con el procesador de pagos'}`;
            }
            
            res.status(500).json({ message: errorMessage });
        }
    }

    public async index(req: Request, res: Response): Promise<void> {
        try {
            const payments = await this.paymentsModel.getAll();
            res.render('admin/payments', { payments });
        } catch (error) {
            console.error('Error en PaymentsController.index:', error);
            res.status(500).json({ message: 'Error al obtener los pagos' });
        }
    }

    public async getTotal(req: Request, res: Response): Promise<void> {
        try {
            const total = await this.paymentsModel.getTotal();
            res.json({ total });
        } catch (error) {
            console.error('Error en PaymentsController.getTotal:', error);
            res.status(500).json({ message: 'Error al obtener el total de pagos' });
        }
    }

    public async getMonthlyData(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.paymentsModel.getMonthlyData();
            res.json(data);
        } catch (error) {
            console.error('Error en PaymentsController.getMonthlyData:', error);
            res.status(500).json({ message: 'Error al obtener los datos mensuales' });
        }
    }

    public async getDailyData(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.paymentsModel.getDailyData();
            res.json({ data });
        } catch (error) {
            console.error('Error en PaymentsController.getDailyData:', error);
            res.status(500).json({ message: 'Error al obtener los datos diarios de pagos' });
        }
    }
}