import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Vérifier que l'utilisateur est authentifié
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer tous les participants
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id, telegram_user_id, first_name, last_name, username, created_at')
      .order('created_at', { ascending: true })

    if (participantsError) {
      console.error('Erreur lors de la récupération des participants:', participantsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des participants' }, { status: 500 })
    }

    return NextResponse.json({ participants: participants || [] })
  } catch (error) {
    console.error('Erreur lors de la récupération des participants:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}