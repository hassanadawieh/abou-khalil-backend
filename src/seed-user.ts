import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserSeeder } from './database/seeders/user.seeder';

async function seedUser() {
  const app = await NestFactory.create(AppModule);
  const userSeeder = app.get(UserSeeder);

  try {
    console.log('--- Seeding Default Admin User ---');
    await userSeeder.seed();
    console.log('\n✓ User seed completed successfully');
    await app.close();
  } catch (error) {
    console.error('User seed failed:', error);
    await app.close();
    process.exit(1);
  }
}

void seedUser();
