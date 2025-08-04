import { NextRequest, NextResponse } from 'next/server'
import { setTelegramWebhook, getTelegramWebhookInfo } from '@/lib/telegram'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { webhookUrl } = await request.json()

    if (!webhookUrl) {
      return NextResponse.json({ error: 'URL webhook requise' }, { status: 400 })
    }

    const result = await setTelegramWebhook(webhookUrl)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la configuration du webhook:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const result = await getTelegramWebhookInfo()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de la récupération des infos webhook:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}