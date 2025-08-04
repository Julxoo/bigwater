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

interface Participant {
  id: number
  telegram_user_id: number
  first_name: string
  last_name?: string
  username?: string
  created_at: string
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<Stats>({ totalParticipants: 0 })
  const [participants, setParticipants] = useState<Participant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [webhookStatus, setWebhookStatus] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
    fetchParticipants()
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

  const fetchParticipants = async () => {
    try {
      const response = await fetch('/api/participants')
      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des participants:', error)
    }
  }

  const fetchWebhookInfo = async () => {
    try {
      const response = await fetch('/api/telegram/setup-webhook')
      if (response.ok) {
        const data = await response.json()
        if (data.result?.url) {
          setWebhookUrl(data.result.url)
          setWebhookStatus('✅ Configuré')
        } else {
          setWebhookStatus('❌ Non configuré')
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos webhook:', error)
      setWebhookStatus('❌ Erreur')
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
          setWebhookStatus('✅ Configuré')
          alert('Webhook configuré avec succès! Le bot peut maintenant répondre aux messages.')
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
        fetchParticipants() // Rafraîchir la liste
      } else {
        alert('Erreur lors du vidage de la liste')
      }
    } catch (error) {
      console.error('Erreur lors du vidage:', error)
      alert('Erreur lors du vidage de la liste')
    }
  }

  const getDisplayName = (participant: Participant) => {
    if (participant.username) return `@${participant.username}`
    return `${participant.first_name}${
      participant.last_name ? ' ' + participant.last_name : ''
    }`
  }

  const exportForSpinTheWheel = () => {
    const names = participants.map(p => getDisplayName(p)).join('\n')
    const blob = new Blob([names], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `participants_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    const names = participants.map(p => getDisplayName(p)).join('\n')
    navigator.clipboard.writeText(names).then(() => {
      alert('Liste copiée dans le presse-papiers !')
    }).catch(() => {
      alert('Erreur lors de la copie')
    })
  }

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filtrer les participants selon le terme de recherche
  const filteredParticipants = participants.filter(participant => {
    if (!searchTerm) return true
    const displayName = getDisplayName(participant).toLowerCase()
    return displayName.includes(searchTerm.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Admin
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
          {/* Stats Summary */}
          <div className="mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {stats.totalParticipants} participant{stats.totalParticipants > 1 ? 's' : ''}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Inscrits via Telegram Bot
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Telegram Bot Configuration */}
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                🤖 Configuration Bot Telegram
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-blue-600 font-bold text-lg">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      <strong>Bot:</strong> @GratteurBarge_bot<br/>
                      <strong>Commande:</strong> Les utilisateurs doivent envoyer <code className="bg-blue-100 px-1 rounded">GO</code> au bot pour s&apos;inscrire<br/>
                      <strong>Lien:</strong> <a href="https://t.me/GratteurBarge_bot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">t.me/GratteurBarge_bot</a>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Status du Webhook</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {webhookStatus}
                  </p>
                  {webhookUrl && (
                    <p className="text-xs text-gray-500 mt-1 break-all">
                      URL: {webhookUrl}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={setupWebhook}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🔧 Configurer Webhook
                </Button>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                🎯 Export pour Spin the Wheel
              </h3>
              <p className="text-gray-600 mb-4">
                Exportez la liste des participants pour l&apos;importer dans <a href="https://spinthewheel.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">spinthewheel.io</a>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={exportForSpinTheWheel}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={participants.length === 0}
                >
                  📁 Télécharger (.txt)
                </Button>
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  disabled={participants.length === 0}
                >
                  📋 Copier
                </Button>
                <Button 
                  onClick={() => {
                    fetchStats()
                    fetchParticipants()
                    fetchWebhookInfo()
                  }}
                  variant="outline"
                >
                  🔄 Actualiser
                </Button>
                <Button 
                  onClick={clearParticipants}
                  className="bg-red-600 hover:bg-red-700 ml-auto"
                >
                  🗑️ Vider la liste
                </Button>
              </div>
            </div>
          </div>

          {/* Participants List */}
          {participants.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    📋 Liste des participants
                  </h3>
                  {participants.length > 10 && (
                    <div className="w-80">
                      <input
                        type="text"
                        placeholder="Rechercher un participant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
                
                {searchTerm && (
                  <p className="text-sm text-gray-600 mb-4">
                    {filteredParticipants.length} résultat{filteredParticipants.length > 1 ? 's' : ''} sur {participants.length}
                  </p>
                )}

                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredParticipants.map((participant) => {
                      const originalIndex = participants.findIndex(p => p.id === participant.id)
                      return (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 font-mono w-8">
                              #{(originalIndex + 1).toString().padStart(3, '0')}
                            </span>
                            <span className="text-gray-900 text-sm font-medium truncate">
                              {getDisplayName(participant)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {filteredParticipants.length === 0 && searchTerm && (
                    <div className="text-center text-gray-500 py-8">
                      Aucun participant trouvé pour &quot;{searchTerm}&quot;
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {participants.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Aucun participant
                </h3>
                <p className="text-gray-600 mb-4">
                  Les utilisateurs doivent envoyer &quot;GO&quot; au bot Telegram pour s&apos;inscrire
                </p>
                <Button 
                  onClick={() => {
                    fetchStats()
                    fetchParticipants()
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Actualiser
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}