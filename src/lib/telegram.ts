const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

export interface TelegramSetWebhookResponse {
  ok: boolean
  result?: boolean
  description?: string
}

export async function setTelegramWebhook(webhookUrl: string): Promise<TelegramSetWebhookResponse> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message']
      }),
    })

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la configuration du webhook:', error)
    return { ok: false, description: 'Erreur réseau' }
  }
}

export async function getTelegramWebhookInfo() {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`)
    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des infos webhook:', error)
    return { ok: false, description: 'Erreur réseau' }
  }
}

export async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    })

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error)
    return { ok: false, description: 'Erreur réseau' }
  }
}