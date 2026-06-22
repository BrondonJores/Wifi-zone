import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
import crypto from 'crypto';

const API_URL = 'http://localhost:3000/api/payments/webhook/monetbil';

async function simulate() {
  const ref = process.argv[2];
  if (!ref) {
    console.error("❌ Veuillez fournir la référence de paiement.");
    console.error("Exemple: npm run simulate WIFI-12345");
    process.exit(1);
  }

  console.log(`\n🔄 Recherche de la transaction ${ref} en base de données...`);
  
  const transaction = await prisma.transaction.findUnique({
    where: { paymentRef: ref }
  });

  if (!transaction) {
    console.error(`❌ Transaction ${ref} introuvable en base.`);
    process.exit(1);
  }

  console.log(`✅ Transaction trouvée ! (Montant: ${transaction.amount} FCFA)`);
  console.log(`🚀 Envoi de la notification webhook SUCCESS à l'API (${API_URL})...`);

  try {
    const transaction_id = `MOCK-${Date.now()}`;
    const payload = {
      transaction_id,
      payment_ref: ref,
      status: 'success',
      amount: transaction.amount,
      currency: 'XAF',
      phone: transaction.phoneNumber
    };

    const secret = process.env.MONETBIL_SERVICE_SECRET || '';
    const dataString = `${ref}${transaction_id}${secret}`;
    const signature = crypto.createHmac('sha256', secret).update(dataString).digest('hex');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-monetbil-signature': signature
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log(`\n✅ Réponse de l'API (${response.status}) :`);
    console.log(data);
    console.log(`\n🎉 Simulation terminée avec succès ! Le voucher a été généré.`);
    console.log(`📱 Vérifiez votre écran de téléphone, le portail captif devrait vous connecter automatiquement !`);

  } catch (error: any) {
    console.error(`\n❌ Erreur lors de l'appel au webhook :`, error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simulate();
