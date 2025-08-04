// Test complet du webhook Telegram
const testTelegramWebhook = async () => {
  console.log('🧪 === TEST WEBHOOK TELEGRAM COMPLET ===\n');
  
  // 1. Test de base de l'endpoint
  console.log('1️⃣ Test de l\'endpoint webhook...');
  try {
    const response = await fetch('https://bigwater-bw3j.vercel.app/api/webhook/telegram', {
      method: 'GET'
    });
    console.log(`   Status GET: ${response.status} (devrait être 405 - Method Not Allowed)`);
  } catch (e) {
    console.log(`   Erreur GET: ${e.message}`);
  }
  
  // 2. Test avec message GO
  console.log('\n2️⃣ Test avec message "GO"...');
  const testMessage = {
    update_id: Date.now(),
    message: {
      message_id: 1,
      from: {
        id: 999888777,
        is_bot: false,
        first_name: "TestUser",
        last_name: "Debug",
        username: "testdebug"
      },
      chat: {
        id: 999888777,
        type: "private",
        first_name: "TestUser",
        last_name: "Debug",
        username: "testdebug"
      },
      date: Math.floor(Date.now() / 1000),
      text: "GO"
    }
  };
  
  try {
    const response = await fetch('https://bigwater-bw3j.vercel.app/api/webhook/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TelegramBot (like TwitterBot)'
      },
      body: JSON.stringify(testMessage)
    });
    
    console.log(`   Status POST: ${response.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    const responseText = await response.text();
    console.log(`   Response: ${responseText}`);
    
    if (response.ok) {
      console.log('   ✅ Webhook semble fonctionner !');
    } else {
      console.log('   ❌ Webhook ne fonctionne pas');
    }
  } catch (e) {
    console.log(`   💥 Erreur: ${e.message}`);
  }
  
  // 3. Test avec message différent (ne devrait pas être traité)
  console.log('\n3️⃣ Test avec message "Hello" (ne devrait pas être traité)...');
  const testMessage2 = { ...testMessage };
  testMessage2.message.text = "Hello";
  testMessage2.update_id = Date.now() + 1;
  
  try {
    const response = await fetch('https://bigwater-bw3j.vercel.app/api/webhook/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TelegramBot (like TwitterBot)'
      },
      body: JSON.stringify(testMessage2)
    });
    
    console.log(`   Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`   Response: ${responseText}`);
  } catch (e) {
    console.log(`   Erreur: ${e.message}`);
  }
  
  // 4. Vérifier la configuration du webhook Telegram
  console.log('\n4️⃣ Vérification de la configuration Telegram...');
  console.log('   URL configurée: https://bigwater-bw3j.vercel.app/api/webhook/telegram');
  console.log('   Bot: @GratteurBarge_bot');
  console.log('   ℹ️  Assurez-vous que le bot Telegram pointe vers cette URL exacte');
  
  console.log('\n🔍 === DIAGNOSTIC ===');
  console.log('Si le webhook retourne 405, le problème peut être :');
  console.log('- La route n\'est pas déployée correctement sur Vercel');
  console.log('- Il y a un problème de configuration dans next.config.ts');
  console.log('- Les variables d\'environnement ne sont pas configurées');
  
  console.log('\n📋 Variables d\'environnement requises sur Vercel :');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('- TELEGRAM_BOT_TOKEN');
};

testTelegramWebhook();