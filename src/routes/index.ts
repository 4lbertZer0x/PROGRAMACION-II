import express from 'express';
import { body } from 'express-validator';
import { ContactsController } from '../controllers/ContactsController';
import { PaymentsController } from '../controllers/PaymentsController';

const router = express.Router();
const contactsController = new ContactsController();
const paymentsController = new PaymentsController();

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
    contactsController.add.bind(contactsController)
);

router.get('/admin/contacts', contactsController.index.bind(contactsController));

// Rutas de pago
router.post('/payment/add',
    [
        body('email').isEmail().normalizeEmail(),
        body('cardholder_name').trim().notEmpty(),
        body('amount').isFloat({ min: 0.01 }),
        body('currency').isIn(['EUR', 'USD']),
        body('service_type').trim().notEmpty()
    ],
    paymentsController.add.bind(paymentsController)
);

router.get('/admin/payments', paymentsController.index.bind(paymentsController));

// Rutas de API para estadísticas
router.get('/api/contacts/count', contactsController.getCount.bind(contactsController));
router.get('/api/contacts/monthly', contactsController.getMonthlyData.bind(contactsController));
router.get('/api/contacts/combined', contactsController.getCombinedData.bind(contactsController));
router.get('/api/contacts/daily', contactsController.getDailyData.bind(contactsController));
router.get('/api/payments/total', paymentsController.getTotal.bind(paymentsController));
router.get('/api/payments/monthly', paymentsController.getMonthlyData.bind(paymentsController));
router.get('/api/payments/daily', paymentsController.getDailyData.bind(paymentsController));

// Ruta del panel de administración principal
router.get('/admin', (req, res) => {
    res.render('admin/admin');
});

export default router;