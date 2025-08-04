"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface Stats {
  totalParticipants: number;
}

interface Participant {
  id: number;
  telegram_user_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  created_at: string;
}

export default function DashboardClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalParticipants: 0 });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [webhookStatus, setWebhookStatus] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
    fetchParticipants();
    fetchWebhookInfo();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch("/api/participants");
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des participants:", error);
    }
  };

  const fetchWebhookInfo = async () => {
    try {
      const response = await fetch("/api/telegram/setup-webhook");
      if (response.ok) {
        const data = await response.json();
        if (data.result?.url) {
          setWebhookStatus("✅ Configuré");
        } else {
          setWebhookStatus("❌ Non configuré");
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des infos webhook:", error);
      setWebhookStatus("❌ Erreur");
    }
  };

  const setupWebhook = async () => {
    const url = `${window.location.origin}/api/webhook/telegram`;
    try {
      const response = await fetch("/api/telegram/setup-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: url }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setWebhookStatus("✅ Configuré");
          alert(
            "Webhook configuré avec succès! Le bot peut maintenant répondre aux messages."
          );
        } else {
          alert(`Erreur: ${data.description}`);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la configuration:", error);
      alert("Erreur lors de la configuration du webhook");
    }
  };

  const clearParticipants = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir vider la liste des participants ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/participants/clear", {
        method: "POST",
      });

      if (response.ok) {
        alert("Liste des participants vidée avec succès!");
        fetchStats(); // Rafraîchir les stats
        fetchParticipants(); // Rafraîchir la liste
      } else {
        alert("Erreur lors du vidage de la liste");
      }
    } catch (error) {
      console.error("Erreur lors du vidage:", error);
      alert("Erreur lors du vidage de la liste");
    }
  };

  const getDisplayName = (participant: Participant) => {
    if (participant.username) return `@${participant.username}`;
    return `${participant.first_name}${
      participant.last_name ? " " + participant.last_name : ""
    }`;
  };

  const copyToClipboard = () => {
    const names = participants.map((p) => getDisplayName(p)).join("\n");
    navigator.clipboard
      .writeText(names)
      .then(() => {
        alert("Liste copiée dans le presse-papiers !");
      })
      .catch(() => {
        alert("Erreur lors de la copie");
      });
  };

  const broadcastMessage = async () => {
    if (participants.length === 0) {
      alert("Aucun participant à qui envoyer le message");
      return;
    }

    if (
      !confirm(
        `Êtes-vous sûr de vouloir envoyer le message promotionnel à tous les ${participants.length} participants ?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/broadcast", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(
            `Message envoyé avec succès à ${data.successCount}/${data.totalParticipants} participants`
          );
        } else {
          alert(`Erreur: ${data.message}`);
        }
      } else {
        alert("Erreur lors de l'envoi du message");
      }
    } catch (error) {
      console.error("Erreur lors du broadcast:", error);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      {/* Header mobile optimisé */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <Button
          onClick={handleLogout}
          disabled={isLoading}
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50 text-sm px-3 py-1"
        >
          Déconnexion
        </Button>
      </div>

      <div className="space-y-3">
        {/* 1. Nombre de participants - Plus grand sur mobile */}
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-1">
            {stats.totalParticipants}
          </h2>
          <p className="text-gray-600 text-lg">participants</p>
        </div>

        {/* 2. Webhook - Compact pour mobile */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Webhook:</span>
              <span className="text-sm font-medium">{webhookStatus}</span>
            </div>
            <Button
              onClick={setupWebhook}
              className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2"
            >
              Config
            </Button>
          </div>
        </div>

        {/* 3. Actions - Boutons pleine largeur sur mobile */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <Button
            onClick={copyToClipboard}
            className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
            disabled={participants.length === 0}
          >
            📋 Copier la liste
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                fetchStats();
                fetchParticipants();
                fetchWebhookInfo();
              }}
              variant="outline"
              className="py-3"
            >
              🔄 Actualiser
            </Button>
            <Button
              onClick={clearParticipants}
              className="bg-red-600 hover:bg-red-700 py-3"
            >
              🗑️ Vider
            </Button>
          </div>
        </div>

        {/* 4. Message - Bouton très visible sur mobile */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <Button
            onClick={broadcastMessage}
            className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-4 font-semibold"
            disabled={participants.length === 0 || isLoading}
          >
            {isLoading ? "📤 Envoi en cours..." : "📤 Envoyer le message"}
          </Button>
        </div>

        {/* 5. Liste - Optimisée pour scroll mobile */}
        {participants.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">
              Liste des participants
            </h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-500 font-mono w-10 flex-shrink-0">
                    #{index + 1}
                  </span>
                  <span className="text-gray-900 font-medium text-base">
                    {getDisplayName(participant)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-600 mb-4 text-lg">Aucun participant</p>
            <Button
              onClick={() => {
                fetchStats();
                fetchParticipants();
              }}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3"
            >
              Actualiser
            </Button>
          </div>
        )}

        {/* Espace en bas pour éviter que le contenu soit coupé */}
        <div className="h-6"></div>
      </div>
    </div>
  );
}
