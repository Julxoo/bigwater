// Script de debug pour tester le webhook Telegram
const testWebhook = async () => {
  const webhookUrl = 'https://bigwater-bw3j.vercel.app/api/webhook/telegram';
  
  const testMessage = {
    update_id: 123456,
    message: {
      message_id: 1,
      from: {
        id: 987654321,
        is_bot: false,
        first_name: "Debug",
        last_name: "Test",
        username: "debugtest"
      },
      chat: {
        id: 987654321,
        type: "private",
        first_name: "Debug",
        last_name: "Test",
        username: "debugtest"
      },
      date: Math.floor(Date.now() / 1000),
      text: "GO"
    }
  };

  try {
    console.log('🚀 Envoi du message de test...');
    console.log('URL:', webhookUrl);
    console.log('Message:', JSON.stringify(testMessage, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Response:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook test réussi !');
    } else {
      console.log('❌ Webhook test échoué !');
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
};

// Test de l'API participants aussi
const testParticipantsAPI = async () => {
  const apiUrl = 'https://bigwater-bw3j.vercel.app/api/participants';
  
  try {
    console.log('\n🔍 Test de l\'API participants...');
    const response = await fetch(apiUrl);
    console.log('📊 Status:', response.status);
    
    if (response.status === 401) {
      console.log('🔒 API protégée par authentification (normal)');
    } else {
      const data = await response.text();
      console.log('📄 Response:', data);
    }
    
  } catch (error) {
    console.error('💥 Erreur API participants:', error);
  }
};

// Exécuter les tests
console.log('🧪 === DEBUG WEBHOOK TELEGRAM ===\n');
testWebhook().then(() => testParticipantsAPI());