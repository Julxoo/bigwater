'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'

interface DashboardClientProps {
  user: User
}

interface Stats {
  totalParticipants: number
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<Stats>({ totalParticipants: 0 })
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookStatus, setWebhookStatus] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
    fetchWebhookInfo()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error)
    }
  }

  const fetchWebhookInfo = async () => {
    try {
      const response = await fetch('/api/telegram/setup-webhook')
      if (response.ok) {
        const data = await response.json()
        if (data.result?.url) {
          setWebhookUrl(data.result.url)
          setWebhookStatus('Configuré')
        } else {
          setWebhookStatus('Non configuré')
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos webhook:', error)
    }
  }

  const setupWebhook = async () => {
    const url = `${window.location.origin}/api/webhook/telegram`
    try {
      const response = await fetch('/api/telegram/setup-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.ok) {
          setWebhookUrl(url)
          setWebhookStatus('Configuré')
          alert('Webhook configuré avec succès!')
        } else {
          alert(`Erreur: ${data.description}`)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la configuration:', error)
      alert('Erreur lors de la configuration du webhook')
    }
  }

  const clearParticipants = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider la liste des participants ? Cette action est irréversible.')) {
      return
    }

    try {
      const response = await fetch('/api/participants/clear', {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Liste des participants vidée avec succès!')
        fetchStats() // Rafraîchir les stats
      } else {
        alert('Erreur lors du vidage de la liste')
      }
    } catch (error) {
      console.error('Erreur lors du vidage:', error)
      alert('Erreur lors du vidage de la liste')
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Panneau d'accueil
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Connecté en tant que <strong>{user.email}</strong>
              </span>
              <Button
                onClick={handleLogout}
                disabled={isLoading}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Bienvenue sur votre tableau de bord !
              </h2>
              <p className="text-gray-600 mb-8">
                Votre interface d'administration est prête. Vous pouvez maintenant commencer à développer vos fonctionnalités.
              </p>
              
              {/* Stats Card */}
              <div className="flex justify-center mt-8">
                <div className="bg-white overflow-hidden shadow rounded-lg w-80">
                  <div className="p-8">
                    <div className="flex items-center justify-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">👥</span>
                        </div>
                      </div>
                      <div className="ml-6">
                        <dl>
                          <dt className="text-lg font-medium text-gray-500">
                            Total des participants
                          </dt>
                          <dd className="text-3xl font-bold text-gray-900">
                            {stats.totalParticipants}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Telegram */}
              <div className="mt-12">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configuration Telegram Bot
                </h3>
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Webhook Status</h4>
                      <p className="text-sm text-gray-600">
                        Status: <span className={webhookStatus === 'Configuré' ? 'text-green-600' : 'text-red-600'}>
                          {webhookStatus}
                        </span>
                      </p>
                      {webhookUrl && (
                        <p className="text-xs text-gray-500 mt-1">URL: {webhookUrl}</p>
                      )}
                    </div>
                    <Button 
                      onClick={setupWebhook}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Configurer Webhook
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Bot:</strong> @GratteurBarge_bot</p>
                    <p><strong>Lien:</strong> <a href="https://t.me/GratteurBarge_bot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">t.me/GratteurBarge_bot</a></p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Actions rapides
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={fetchStats}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Actualiser les données
                  </Button>
                  <Button 
                    onClick={clearParticipants}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Vider la liste des participants
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}