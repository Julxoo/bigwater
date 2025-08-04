import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WheelClient from './wheel-client'

export default async function WheelPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <WheelClient user={user} />
}