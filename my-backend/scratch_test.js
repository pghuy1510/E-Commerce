const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module.js');
const { AdminService } = require('./dist/admin/admin.service.js');
const { DataSource } = require('typeorm');

async function main() {
  console.log("Starting NestJS application context...");
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log("Context created. Getting AdminService...");
  const adminService = app.get(AdminService);
  
  const dataSource = adminService.dataSource;
  const order = await dataSource.getRepository('Order').findOne({ where: {}, order: { id: 'DESC' } });
  if (!order) {
    console.log("No orders found in database!");
    await app.close();
    return;
  }
  
  console.log(`Testing status update for order #ORD-${order.id}. Current status: ${order.status}`);
  try {
    const res = await adminService.updateOrderStatus(order.id, {
      status: 'confirmed', // let's try updating to confirmed
      note: "Test status update from script"
    });
    console.log("Success! Updated order:", res);
  } catch (error) {
    console.error("Failed to update status!");
    console.error(error);
  }
  
  await app.close();
}

main().catch(console.error);
