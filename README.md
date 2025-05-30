# Documentación de Integración de Servicios Externos

## Geolocalización por IP
- Se integró la API de [ipstack](https://ipstack.com/) para identificar el país del usuario que completa el formulario de contacto.
- El país se almacena en la base de datos junto con los datos del contacto.
- El campo `country` fue añadido a la tabla `contacts` y al modelo correspondiente.
- La obtención del país se realiza automáticamente en el backend usando la IP del usuario.

## Variables de Entorno
- Se utiliza el paquete `dotenv` para gestionar credenciales sensibles.
- El archivo `.env` está incluido en `.gitignore` para evitar exponer información sensible.

## Instalación de dependencias
- Se añadió la dependencia `axios` para realizar peticiones HTTP a servicios externos.
- Se utiliza `nodemailer` para el envío de correos electrónicos.

## Integración con Fake Payment API
- Se ha integrado el servicio de [FakePayment API](https://fakepayment.onrender.com/) para procesar pagos en el formulario.
- La integración permite procesar pagos con diferentes tipos de tarjetas de crédito (Visa, Mastercard, etc.).
- Se almacena el ID de transacción devuelto por la API en la base de datos para referencia futura.

### Configuración
1. Se ha añadido la variable de entorno `FAKEPAYMENT_API_KEY` en el archivo `.env` para almacenar la clave de API de forma segura.
2. Se ha actualizado el controlador de pagos para realizar solicitudes a la API externa.
3. Se ha modificado el formulario de pagos para incluir todos los campos requeridos por la API.

### Tarjetas de prueba
Para realizar pruebas, se pueden utilizar las siguientes tarjetas:
- Visa: 4111111111111111
- Mastercard: 5555555555554444
- American Express: 378282246310005

### Códigos de respuesta
- APPROVED: Pago aprobado
- REJECTED: Pago rechazado (código 002)
- ERROR: Error en el procesamiento (código 003)
- INSUFFICIENT: Fondos insuficientes (código 004)

## Google reCAPTCHA
- Se ha integrado Google reCAPTCHA v2 para proteger el formulario de contacto contra bots y spam.
- La validación se realiza tanto en el cliente como en el servidor.

### Configuración
1. Se han añadido las variables de entorno `RECAPTCHA_SECRET_KEY` y `RECAPTCHA_SITE_KEY` en el archivo `.env`.
2. Se ha implementado un middleware de verificación en `src/middleware/recaptcha.ts` que valida la respuesta del reCAPTCHA antes de procesar el formulario.
3. Se ha añadido el widget de reCAPTCHA en el formulario de contacto en `views/index.ejs`.

### Implementación
- **Frontend**: El widget se muestra en el formulario y se valida antes de enviar los datos.
- **Backend**: El middleware verifica la respuesta del reCAPTCHA con la API de Google antes de procesar la solicitud.

## Google Analytics
- Se ha integrado Google Analytics para realizar un seguimiento del tráfico y comportamiento de los usuarios en el sitio web.

### Configuración
1. Se ha añadido la variable de entorno `GA_MEASUREMENT_ID` en el archivo `.env`.
2. Se ha implementado el script de seguimiento de Google Analytics en `views/index.ejs`.

### Implementación
- El script de Google Analytics se carga condicionalmente si existe la variable de entorno `GA_MEASUREMENT_ID`.
- Se utiliza el método de etiquetado global (gtag.js) para el seguimiento.

## Servicio de Correo Electrónico
- Se ha implementado un servicio de notificación por correo electrónico utilizando Nodemailer.
- Cada vez que un usuario completa el formulario de contacto, se envía una notificación por correo electrónico.

### Configuración
1. Se han añadido las variables de entorno `EMAIL_USER`, `EMAIL_PASS` y `EMAIL_TO` en el archivo `.env`.
2. Se ha implementado el servicio de correo electrónico en `src/services/emailservice.ts`.

### Implementación
- **Transporter**: Se configura Nodemailer para utilizar el servicio de Gmail con las credenciales proporcionadas.
- **Plantilla de correo**: Se ha creado una plantilla HTML personalizada que sigue la estética del sitio web.
- **Datos incluidos**: El correo incluye toda la información del contacto (nombre, email, mensaje, servicio, IP, país y fecha).
- **Manejo de errores**: Se implementa un manejo adecuado de errores para garantizar la fiabilidad del servicio.
