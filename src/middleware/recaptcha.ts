import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export const verifyRecaptcha = async (req: Request, res: Response, next: NextFunction) => {
    const recaptchaResponse = req.body['g-recaptcha-response'];

    if (!recaptchaResponse) {
        return res.status(400).json({
            success: false,
            errors: [{
                field: 'recaptcha',
                message: 'Por favor, verifica que no eres un robot'
            }]
        });
    }

    try {
        const verifyURL = 'https://www.google.com/recaptcha/api/siteverify';
        const response = await axios.post(
            `${verifyURL}?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaResponse}`,
            {},
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        if (response.data.success) {
            next();
        } else {
            return res.status(400).json({
                success: false,
                errors: [{
                    field: 'recaptcha',
                    message: 'La verificación de reCAPTCHA ha fallado'
                }]
            });
        }
    } catch (error) {
        console.error('Error al verificar reCAPTCHA:', error);
        return res.status(500).json({
            success: false,
            errors: [{
                field: 'recaptcha',
                message: 'Error al verificar reCAPTCHA'
            }]
        });
    }
};