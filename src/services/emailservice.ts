import nodemailer from 'nodemailer';
import { Contact } from '../models/ContactsModel';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Verifica que las variables de entorno estén definidas
        const requiredEnvVars = [
            'EMAIL_USER',
            'EMAIL_PASS',
            'EMAIL_TO'
        ];
        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingEnvVars.length > 0) {
            throw new Error(`Faltan variables de entorno: ${missingEnvVars.join(', ')}`);
        }

        console.log('Inicializando Nodemailer con las siguientes configuraciones:');
        console.log('Email User:', process.env.EMAIL_USER);
        console.log('Email Pass:', process.env.EMAIL_PASS ? '**** (oculta)' : 'No definida');
        console.log('To Email:', process.env.EMAIL_TO);

        // Crear el transporter de Nodemailer
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    public async sendContactNotification(contactData: Contact): Promise<{ success: boolean; error?: any }> {
        try {
            const { email, name, comment, ip_address, country, service, created_at = new Date().toISOString() } = contactData;

            // Crear el HTML del correo con la estética de la página
            const htmlContent = this.createEmailTemplate({
                fullName: name,
                email,
                service: service || 'No especificado',
                message: comment,
                ipAddress: ip_address,
                country: country || 'No disponible',
                createdAt: new Date(created_at).toLocaleString()
            });

            const mailOptions = {
                from: `"3D Print Lab" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_TO,
                subject: `Nuevo contacto: ${name} - ${service || 'Consulta general'}`,
                html: htmlContent
            };

            console.log('Enviando correo con los siguientes parámetros:', {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject
            });

            const info = await this.transporter.sendMail(mailOptions);

            console.log('Correo enviado con éxito:', info.messageId);
            return { success: true };
        } catch (error: any) {
            console.error('Error al enviar el correo:', error);
            return { success: false, error: error.message };
        }
    }

    private createEmailTemplate(data: {
        fullName: string;
        email: string;
        service: string;
        message: string;
        ipAddress: string;
        country: string;
        createdAt: string;
    }): string {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nuevo Contacto - 3D Print Lab</title>
            <style>
                body {
                    font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #1A1A1A;
                    background-color: #F5F5F5;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #FFFFFF;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #3B4D71;
                    color: #FFFFFF;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content {
                    padding: 20px;
                }
                .footer {
                    background-color: #F5F5F5;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-radius: 0 0 10px 10px;
                }
                h1 {
                    color: #FFFFFF;
                    margin: 0;
                    font-family: 'Sora', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                h2 {
                    color: #3B4D71;
                    border-bottom: 2px solid #D4AF37;
                    padding-bottom: 10px;
                    font-family: 'Sora', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .info-row {
                    margin-bottom: 15px;
                }
                .label {
                    font-weight: bold;
                    color: #3B4D71;
                }
                .message-box {
                    background-color: #E6E6FA;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                }
                .highlight {
                    color: #D4AF37;
                    font-weight: bold;
                }
                .logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 10px;
                }
                .logo-text {
                    font-size: 24px;
                    font-weight: bold;
                    margin-left: 10px;
                    font-family: 'Space Grotesk', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">
                        <span class="logo-text">3D Print Lab</span>
                    </div>
                    <h1>Nuevo Contacto Recibido</h1>
                </div>
                <div class="content">
                    <h2>Información del Contacto</h2>
                    <div class="info-row">
                        <span class="label">Nombre:</span> ${data.fullName}
                    </div>
                    <div class="info-row">
                        <span class="label">Email:</span> ${data.email}
                    </div>
                    <div class="info-row">
                        <span class="label">Servicio:</span> ${data.service}
                    </div>
                    <div class="info-row">
                        <span class="label">País:</span> ${data.country}
                    </div>
                    <div class="info-row">
                        <span class="label">IP:</span> ${data.ipAddress}
                    </div>
                    <div class="info-row">
                        <span class="label">Fecha:</span> ${data.createdAt}
                    </div>
                    <div class="message-box">
                        <span class="label">Mensaje:</span>
                        <p>${data.message}</p>
                    </div>
                </div>
                <div class="footer">
                    <p>Este es un correo automático enviado desde el formulario de contacto de 3D Print Lab.</p>
                    <p>© ${new Date().getFullYear()} 3D Print Lab. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}