import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PaymentsModel, Payment } from '../models/PaymentsModel';

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

            // Crear objeto de pago (evitando almacenar datos sensibles de tarjeta)
            const payment: Payment = {
                email: req.body.email,
                cardholder_name: req.body.cardholder_name,
                amount: parseFloat(req.body.amount),
                currency: req.body.currency,
                service_type: req.body.service_type,
                status: 'completed'
            };

            // Simular procesamiento de pago y guardar registro
            const success = await this.paymentsModel.create(payment);

            if (success) {
                res.status(200).json({ message: 'Pago procesado exitosamente' });
            } else {
                res.status(500).json({ message: 'Error al procesar el pago' });
            }
        } catch (error) {
            console.error('Error en PaymentsController.add:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
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