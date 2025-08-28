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
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [customPhotoUrl, setCustomPhotoUrl] = useState("");
  const [isCustomLoading, setIsCustomLoading] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(
    null
  );
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

  const sendCustomMessage = async () => {
    if (participants.length === 0) {
      alert("Aucun participant à qui envoyer le message");
      return;
    }

    if (!customMessage.trim()) {
      alert("Veuillez saisir un message");
      return;
    }

    const photoText = customPhotoUrl.trim() ? " avec photo" : "";
    if (
      !confirm(
        `Êtes-vous sûr de vouloir envoyer ce message personnalisé${photoText} à tous les ${participants.length} participants ?`
      )
    ) {
      return;
    }

    setIsCustomLoading(true);
    try {
      const response = await fetch("/api/broadcast-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: customMessage,
          photoUrl: customPhotoUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(
            `Message personnalisé envoyé avec succès à ${data.successCount}/${
              data.totalParticipants
            } participants${data.hasPhoto ? " avec photo" : ""}`
          );
          // Réinitialiser le formulaire
          setCustomMessage("");
          setCustomPhotoUrl("");
          setShowCustomMessage(false);
        } else {
          alert(`Erreur: ${data.message}`);
        }
      } else {
        const errorData = await response.json();
        alert(
          `Erreur: ${errorData.error || "Erreur lors de l'envoi du message"}`
        );
      }
    } catch (error) {
      console.error("Erreur lors du broadcast personnalisé:", error);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setIsCustomLoading(false);
    }
  };

  // Fonctions de formatage de texte
  const insertFormatting = (
    startTag: string,
    endTag: string,
    placeholder: string = ""
  ) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = customMessage.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newText =
      customMessage.substring(0, start) +
      startTag +
      textToInsert +
      endTag +
      customMessage.substring(end);

    setCustomMessage(newText);

    // Remettre le focus et la sélection
    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
        const newStart = start + startTag.length;
        const newEnd = newStart + textToInsert.length;
        textareaRef.setSelectionRange(newStart, newEnd);
      }
    }, 0);
  };

  const makeBold = () => insertFormatting("<b>", "</b>", "texte en gras");
  const makeItalic = () => insertFormatting("<i>", "</i>", "texte en italique");
  const insertLink = () => {
    const url = prompt("Entrez l'URL du lien:");
    if (url) {
      insertFormatting(`<a href="${url}">`, "</a>", "texte du lien");
    }
  };
  const insertEmoji = (emoji: string) => {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const newText =
      customMessage.substring(0, start) +
      emoji +
      customMessage.substring(start);
    setCustomMessage(newText);

    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
        textareaRef.setSelectionRange(
          start + emoji.length,
          start + emoji.length
        );
      }
    }, 0);
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

        {/* 4. Messages - Section étendue */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          {/* Message prédéfini */}
          <Button
            onClick={broadcastMessage}
            className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-4 font-semibold"
            disabled={participants.length === 0 || isLoading}
          >
            {isLoading
              ? "📤 Envoi en cours..."
              : "📤 Envoyer le message: fin de Live"}
          </Button>

          {/* Bouton pour afficher/masquer le message personnalisé */}
          <Button
            onClick={() => setShowCustomMessage(!showCustomMessage)}
            variant="outline"
            className="w-full py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            disabled={participants.length === 0}
          >
            {showCustomMessage
              ? "🔼 Masquer message personnalisé"
              : "🔽 Message personnalisé"}
          </Button>
        </div>

        {/* 5. Interface de message personnalisé - Intégrée */}
        {showCustomMessage && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-4 border-l-4 border-blue-500">
            <h3 className="font-bold text-gray-900 text-lg flex items-center">
              ✏️ Message personnalisé
            </h3>

            {/* Zone de texte pour le message */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Votre message
              </label>

              {/* Boutons de formatage */}
              <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border">
                <Button
                  type="button"
                  onClick={makeBold}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs font-bold"
                  disabled={isCustomLoading}
                >
                  <b>B</b>
                </Button>
                <Button
                  type="button"
                  onClick={makeItalic}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs italic"
                  disabled={isCustomLoading}
                >
                  <i>I</i>
                </Button>
                <Button
                  type="button"
                  onClick={insertLink}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={isCustomLoading}
                >
                  🔗 Lien
                </Button>

                <div className="border-l border-gray-300 h-8 mx-1"></div>

                {/* Emojis populaires */}
                <Button
                  type="button"
                  onClick={() => insertEmoji("🎉")}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={isCustomLoading}
                >
                  🎉
                </Button>
                <Button
                  type="button"
                  onClick={() => insertEmoji("🎯")}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={isCustomLoading}
                >
                  🎯
                </Button>
                <Button
                  type="button"
                  onClick={() => insertEmoji("🍀")}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={isCustomLoading}
                >
                  🍀
                </Button>
                <Button
                  type="button"
                  onClick={() => insertEmoji("⚡")}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={isCustomLoading}
                >
                  ⚡
                </Button>
                <Button
                  type="button"
                  onClick={() => insertEmoji("🎰")}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={isCustomLoading}
                >
                  🎰
                </Button>
              </div>

              <textarea
                ref={setTextareaRef}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Écrivez votre message ici...\n\nUtilisez les boutons ci-dessus pour formater votre texte !"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                disabled={isCustomLoading}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{customMessage.length} caractères</span>
                <span className="text-blue-600">
                  💡 Sélectionnez du texte puis cliquez sur B ou I pour le
                  formater
                </span>
              </div>
            </div>

            {/* URL de la photo (optionnel) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                URL de la photo (optionnel)
              </label>
              <input
                type="url"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="https://exemple.com/image.jpg"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCustomLoading}
              />
              {customPhotoUrl && (
                <div className="text-xs text-green-600">
                  📸 Photo sera incluse dans le message
                </div>
              )}
            </div>

            {/* Aperçu */}
            {customMessage.trim() && (
              <div className="bg-gray-50 p-3 rounded-lg border">
                <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  👀 Aperçu du message
                </div>
                <div className="text-sm text-gray-900 bg-white p-3 rounded border shadow-sm">
                  {customPhotoUrl.trim() && (
                    <div className="flex items-center text-xs text-blue-600 mb-2 bg-blue-50 p-2 rounded">
                      📸{" "}
                      <span className="ml-1">
                        Photo incluse:{" "}
                        {customPhotoUrl.length > 40
                          ? customPhotoUrl.substring(0, 40) + "..."
                          : customPhotoUrl}
                      </span>
                    </div>
                  )}
                  <div
                    className="whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: customMessage.replace(/\n/g, "<br>"),
                    }}
                  />
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <Button
                onClick={sendCustomMessage}
                className="flex-1 bg-green-600 hover:bg-green-700 py-3"
                disabled={
                  !customMessage.trim() ||
                  isCustomLoading ||
                  participants.length === 0
                }
              >
                {isCustomLoading
                  ? "📤 Envoi en cours..."
                  : "📤 Envoyer le message personnalisé"}
              </Button>
              <Button
                onClick={() => {
                  setCustomMessage("");
                  setCustomPhotoUrl("");
                }}
                variant="outline"
                className="px-4 py-3"
                disabled={isCustomLoading}
              >
                🗑️
              </Button>
            </div>
          </div>
        )}

        {/* 6. Liste - Optimisée pour scroll mobile */}
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
