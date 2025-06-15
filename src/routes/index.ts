import express from 'express';
import { body } from 'express-validator';
import { ContactsController } from '../controllers/ContactsController';
import { PaymentsController } from '../controllers/PaymentsController';
import { AuthController } from '../controllers/AuthController';
import { verifyRecaptcha } from '../middleware/recaptcha';
import { requireAuth, requireGuest, requireAdmin } from '../middleware/auth';

const router = express.Router();
const contactsController = new ContactsController();
const paymentsController = new PaymentsController();
const authController = new AuthController();

// Middleware para procesar datos del formulario
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Rutas de contacto
router.post(['/contact/add', '/api/contact'],
    [
        body('email').isEmail().normalizeEmail(),
        body('name').trim().notEmpty(),
        body('message').trim().notEmpty().optional(),
        body('comment').trim().notEmpty().optional(),
        body('service').trim().notEmpty().optional(),
        body('phone').trim().optional()
    ],
    verifyRecaptcha,
    contactsController.add.bind(contactsController)
);

// Rutas de autenticación
router.get('/auth/login', requireGuest, authController.showLogin.bind(authController));
router.post('/auth/login', requireGuest, authController.login.bind(authController));
router.get('/auth/logout', requireAuth, authController.logout.bind(authController));
router.get('/auth/register', requireAdmin, authController.showRegister.bind(authController));
router.post('/auth/register', requireAdmin, [
    body('username').trim().isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('email').optional().isEmail().normalizeEmail(),
    body('display_name').optional().trim()
], authController.register.bind(authController));

// Rutas de Google OAuth
router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleCallback.bind(authController));

// API de autenticación
router.get('/api/auth/check', authController.checkAuth.bind(authController));

// Rutas protegidas de administración
router.get('/admin', requireAuth, authController.showAdmin.bind(authController));
router.get('/admin/contacts', requireAuth, contactsController.index.bind(contactsController));
router.get('/contacts', requireAuth, contactsController.index.bind(contactsController));

// Rutas de pago
router.post('/payment/add',
    [
        body('email').isEmail().normalizeEmail(),
        body('cardholder_name').trim().notEmpty(),
        body('amount').isFloat({ min: 0.01 }),
        body('currency').isIn(['EUR', 'USD', 'VES']),
        body('service_type').trim().notEmpty(),
        body('card_number').trim().notEmpty(),
        body('cvv').trim().isLength({ min: 3, max: 4 }),
        body('expiration_month').isInt({ min: 1, max: 12 }),
        body('expiration_year').isInt({ min: new Date().getFullYear() })
    ],
    paymentsController.add.bind(paymentsController)
);

router.get('/admin/payments', requireAuth, paymentsController.index.bind(paymentsController));
router.get('/payments', requireAuth, paymentsController.index.bind(paymentsController));

// Rutas de API para estadísticas (protegidas)
router.get('/api/contacts/count', requireAuth, contactsController.getCount.bind(contactsController));
router.get('/api/contacts/monthly', requireAuth, contactsController.getMonthlyData.bind(contactsController));
router.get('/api/contacts/combined', requireAuth, contactsController.getCombinedData.bind(contactsController));
router.get('/api/contacts/daily', requireAuth, contactsController.getDailyData.bind(contactsController));
router.get('/api/payments/total', requireAuth, paymentsController.getTotal.bind(paymentsController));
router.get('/api/payments/monthly', requireAuth, paymentsController.getMonthlyData.bind(paymentsController));
router.get('/api/payments/daily', requireAuth, paymentsController.getDailyData.bind(paymentsController));



export default router;
