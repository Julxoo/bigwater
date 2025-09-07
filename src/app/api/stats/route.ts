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

    // Compter le nombre de participants dans la table temporaire (pour le tirage actuel)
    const { count: totalParticipants } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })

    // Compter le nombre total de participants dans la table persistante
    const { count: totalAllParticipants } = await supabase
      .from('all_participants')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      totalParticipants: totalParticipants || 0,
      totalAllParticipants: totalAllParticipants || 0
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}