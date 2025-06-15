import { PaymentsModel, Payment } from "./models/PaymentsModel";
import { ContactsModel, Contact } from "./models/ContactsModel";
import { UserModel } from "./models/UserModel";

async function seedTestData() {
  // Esperar un poco para asegurar que las tablas estén creadas
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const paymentsModel = new PaymentsModel();
  const contactsModel = new ContactsModel();
  const userModel = new UserModel();

  // Crear usuario administrador por defecto (solo si no existe)
  try {
    const existingAdmin = await userModel.findByUsername('admin');
    if (!existingAdmin) {
      await userModel.create({
        username: 'admin',
        password: '123',
        email: 'admin@3dprintlab.com',
        display_name: 'Administrador'
      });
      console.log('✅ Usuario administrador creado desde seedTestData: admin/123');
    } else {
      console.log('ℹ️  Usuario administrador ya existe (desde seedTestData)');
    }
  } catch (error) {
    console.error('Error al crear usuario administrador desde seedTestData:', error);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Datos de ejemplo
  const emails = ["test1@email.com", "test2@email.com", "test3@email.com"];
  const names = ["Juan Pérez", "Ana Gómez", "Carlos Ruiz"];
  const comments = ["Comentario de prueba", "Otro comentario", "Consulta de servicio"];
  const services = ["Servicio A", "Servicio B", "Servicio C"];
  const cardholders = ["Juan Pérez", "Ana Gómez", "Carlos Ruiz"];
  const currencies = ["USD", "EUR", "MXN"];
  const serviceTypes = ["Plan Básico", "Plan Premium", "Plan Pro"];

  for (let day = 1; day <= daysInMonth; day++) {
    // Fecha específica para el día
    const date = new Date(year, month, day, 12, 0, 0); // Mediodía para evitar problemas de zona horaria
    const created_at = date.toISOString();

    // Contacto de prueba
    const contact: Contact = {
      email: emails[day % emails.length],
      name: names[day % names.length],
      comment: comments[day % comments.length],
      ip_address: `192.168.1.${day}`,
      service: services[day % services.length],
      created_at
    };
    await contactsModel.create(contact);

    // Pago de prueba
    const payment: Payment = {
      email: emails[day % emails.length],
      cardholder_name: cardholders[day % cardholders.length],
      amount: Math.floor(Math.random() * 1000) + 100, // Entre 100 y 1099
      currency: currencies[day % currencies.length],
      service_type: serviceTypes[day % serviceTypes.length],
      status: "completed",
      created_at
    };
    await paymentsModel.create(payment);

    console.log(`Día ${day}: Contacto y pago insertados.`);
  }

  console.log("\n¡Datos de prueba insertados para todos los días del mes!");
}

seedTestData().catch((err) => {
  console.error("Error al insertar datos de prueba:", err);
});
