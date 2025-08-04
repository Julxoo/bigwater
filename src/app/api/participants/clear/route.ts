import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // Vérifier que l'utilisateur est authentifié
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vider la table des participants
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .neq('id', 0) // Supprime tous les enregistrements

    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    console.log('Table participants vidée par l\'admin')
    return NextResponse.json({ success: true, message: 'Table vidée avec succès' })

  } catch (error) {
    console.error('Erreur lors du vidage de la table:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}