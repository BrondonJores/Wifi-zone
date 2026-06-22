import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log(' Démarrage du seed...\n');

  // -------------------------------------------------------
  // 1. ADMIN PAR DÉFAUT
  // -------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    console.log(`Admin déjà existant: ${adminEmail}. Mise à jour de ses permissions...`);
    await prisma.admin.update({
      where: { email: adminEmail },
      data: { permissions: ['*'] }
    });
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        permissions: ['*']
      },
    });
    console.log(`Admin créé avec succès !`);
    console.log(`   Email    : ${adminEmail}`);
    console.log(`    Password : ${adminPassword}`);
    console.log(`   ID Admin : ${admin.id}`);

    // -------------------------------------------------------
    // 2. ROUTEUR DE DÉMO
    // -------------------------------------------------------
    const router = await prisma.router.create({
      data: {
        adminId: admin.id,
        name: 'Biyem Assi - Zone A',
        ipAddress: '192.168.88.1',
        apiPort: 8728,
        apiUser: 'admin',
        apiPassword: '', // À remplir avec le vrai mot de passe Mikrotik
      },
    });
    console.log(`\nRouteur de démo créé: "${router.name}" (ID: ${router.id})`);

    // -------------------------------------------------------
    // 3. FORFAITS DE DÉMO
    // -------------------------------------------------------
    const tariffs = await prisma.tariff.createMany({
      data: [
        {
          routerId: router.id,
          name: 'Pass 2 Heures',
          price: 100,
          duration: 120,
          profileName: '2H_Profile',
        },
        {
          routerId: router.id,
          name: 'Pass Journée',
          price: 500,
          duration: 1440,
          profileName: '1DAY_Profile',
        },
        {
          routerId: router.id,
          name: 'Pass Semaine',
          price: 2000,
          duration: 10080,
          profileName: '1WEEK_Profile',
        },
        {
          routerId: router.id,
          name: 'Pass Mensuel',
          price: 5000,
          duration: 43200,
          profileName: '1MONTH_Profile',
        },
      ],
    });
    console.log(` ${tariffs.count} forfaits de démo créés`);

    console.log('\n' + '='.repeat(50));
    console.log('SEED TERMINÉ ! Votre application est prête.');
    console.log('='.repeat(50));
    console.log('\n RÉCAPITULATIF DE CONNEXION :');
    console.log(`   URL Dashboard : http://164.90.214.219`);
    console.log(`   Email         : ${adminEmail}`);
    console.log(`   Mot de passe  : ${adminPassword}`);
    console.log('\nIMPORTANT : Changez le mot de passe après la première connexion !');
  }
}

main()
  .catch((e) => {
    console.error(' Erreur durant le seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
