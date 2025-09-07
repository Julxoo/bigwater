"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Stats {
  totalParticipants: number;
  totalAllParticipants: number;
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
  const [stats, setStats] = useState<Stats>({ totalParticipants: 0, totalAllParticipants: 0 });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [webhookStatus, setWebhookStatus] = useState("");
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [customPhotoUrl, setCustomPhotoUrl] = useState("");
  const [showBroadcastOptions, setShowBroadcastOptions] = useState(false);
  const [customPhotoFile, setCustomPhotoFile] = useState<File | null>(null);
  const [isCustomLoading, setIsCustomLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
        `Êtes-vous sûr de vouloir vider la liste des participants du tirage actuel ?\n\nCela supprimera ${stats.totalParticipants} participants du tirage en cours.\nL'historique complet (${stats.totalAllParticipants} participants) sera préservé.\n\nCette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/participants/clear", {
        method: "POST",
      });

      if (response.ok) {
        alert("Liste des participants du tirage actuel vidée avec succès!\n\nL'historique complet est préservé.");
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

  const broadcastMessage = async (targetType: 'current' | 'all') => {
    const targetCount = targetType === 'current' ? participants.length : stats.totalAllParticipants;
    const targetDescription = targetType === 'current' ? 'participants du tirage actuel' : 'participants de l\'historique complet';
    
    if (targetCount === 0) {
      alert(`Aucun ${targetDescription} à qui envoyer le message`);
      return;
    }

    if (
      !confirm(
        `Êtes-vous sûr de vouloir envoyer le message "fin de Live" à tous les ${targetCount} ${targetDescription} ?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = targetType === 'current' ? "/api/broadcast" : "/api/broadcast-all";
      const response = await fetch(endpoint, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(
            `Message envoyé avec succès à ${data.successCount}/${data.totalParticipants} ${targetDescription}`
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
      setShowBroadcastOptions(false);
    }
  };

  const sendCustomMessage = async (targetType: 'current' | 'all') => {
    const targetCount = targetType === 'current' ? participants.length : stats.totalAllParticipants;
    const targetDescription = targetType === 'current' ? 'participants du tirage actuel' : 'participants de l\'historique complet';
    
    if (targetCount === 0) {
      alert(`Aucun ${targetDescription} à qui envoyer le message`);
      return;
    }

    if (!customMessage.trim()) {
      alert("Veuillez saisir un message");
      return;
    }

    setIsCustomLoading(true);

    try {
      let finalPhotoUrl = customPhotoUrl;

      // Si on a un fichier local, l'uploader d'abord
      if (customPhotoFile && customPhotoUrl.startsWith("blob:")) {
        const uploadedUrl = await uploadPhoto(customPhotoFile);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
          // Nettoyer l'URL temporaire
          URL.revokeObjectURL(customPhotoUrl);
          setCustomPhotoUrl(uploadedUrl);
        } else {
          // Erreur d'upload, mais on peut continuer sans photo
          finalPhotoUrl = "";
        }
      }

      const photoText = finalPhotoUrl ? " avec photo" : "";
      if (
        !confirm(
          `Êtes-vous sûr de vouloir envoyer ce message personnalisé${photoText} à tous les ${targetCount} ${targetDescription} ?`
        )
      ) {
        setIsCustomLoading(false);
        return;
      }

      const endpoint = targetType === 'current' ? "/api/broadcast-custom" : "/api/broadcast-custom-all";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: customMessage,
          photoUrl: finalPhotoUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(
            `Message personnalisé envoyé avec succès à ${data.successCount}/${
              data.totalParticipants
            } ${targetDescription}${data.hasPhoto ? " avec photo" : ""}`
          );
          // Réinitialiser le formulaire
          setCustomMessage("");
          removePhoto();
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

  // Fonctions de gestion des fichiers
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    setCustomPhotoFile(file);
    // Créer une URL temporaire pour l'aperçu
    const tempUrl = URL.createObjectURL(file);
    setCustomPhotoUrl(tempUrl);
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const errorData = await response.json();
        alert(`Erreur upload: ${errorData.error}`);
        return null;
      }
    } catch (error) {
      console.error("Erreur upload photo:", error);
      alert("Erreur lors de l'upload de la photo");
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removePhoto = () => {
    if (customPhotoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(customPhotoUrl);
    }
    setCustomPhotoFile(null);
    setCustomPhotoUrl("");
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
        {/* 1. Statistiques - Cartes séparées sur mobile */}
        <div className="grid grid-cols-1 gap-3">
          {/* Participants actuels (tirage en cours) */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center border-l-4 border-blue-500">
            <h2 className="text-4xl font-bold text-blue-600 mb-1">
              {stats.totalParticipants}
            </h2>
            <p className="text-gray-600 text-sm">participants au tirage actuel</p>
          </div>
          
          {/* Tous les participants (historique) */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center border-l-4 border-green-500">
            <h2 className="text-4xl font-bold text-green-600 mb-1">
              {stats.totalAllParticipants}
            </h2>
            <p className="text-gray-600 text-sm">participants au total (historique)</p>
          </div>
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
              🗑️ Vider tirage
            </Button>
          </div>
        </div>

        {/* 4. Messages - Section étendue */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          {/* Message prédéfini avec options */}
          {!showBroadcastOptions ? (
            <Button
              onClick={() => setShowBroadcastOptions(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-4 font-semibold"
              disabled={stats.totalParticipants === 0 && stats.totalAllParticipants === 0 || isLoading}
            >
              {isLoading
                ? "📤 Envoi en cours..."
                : "📤 Envoyer le message: fin de Live"}
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div className="text-center">
                <h4 className="font-semibold text-purple-800 mb-3">
                  Choisir les destinataires du message &quot;fin de Live&quot;
                </h4>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => broadcastMessage('current')}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                  disabled={stats.totalParticipants === 0 || isLoading}
                >
                  📤 Tirage actuel ({stats.totalParticipants} participants)
                </Button>
                
                <Button
                  onClick={() => broadcastMessage('all')}
                  className="w-full bg-green-600 hover:bg-green-700 py-3"
                  disabled={stats.totalAllParticipants === 0 || isLoading}
                >
                  📤 Historique complet ({stats.totalAllParticipants} participants)
                </Button>
              </div>
              
              <Button
                onClick={() => setShowBroadcastOptions(false)}
                variant="outline"
                className="w-full py-2 text-sm"
                disabled={isLoading}
              >
                ❌ Annuler
              </Button>
            </div>
          )}

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

            {/* Upload de photo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Photo (optionnel)
              </label>

              {!customPhotoFile && !customPhotoUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  } ${isCustomLoading ? "opacity-50" : ""}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isCustomLoading}
                  />
                  <div className="space-y-2">
                    <div className="text-4xl">📷</div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">
                        Cliquez pour choisir
                      </span>{" "}
                      ou glissez-déposez une image
                    </div>
                    <div className="text-xs text-gray-500">
                      JPG, PNG, GIF jusqu&apos;à 5MB
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {customPhotoUrl && (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={customPhotoUrl}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {customPhotoFile
                            ? customPhotoFile.name
                            : "Image sélectionnée"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customPhotoFile
                            ? `${(customPhotoFile.size / 1024 / 1024).toFixed(
                                1
                              )} MB`
                            : "Image prête"}
                        </div>
                        {isUploadingPhoto && (
                          <div className="text-xs text-blue-600 mt-1">
                            📎 Upload en cours...
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={removePhoto}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={isCustomLoading || isUploadingPhoto}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}

              {/* Option alternative: saisie d'URL */}
              {!customPhotoFile && !customPhotoUrl && (
                <div className="pt-2">
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                      🔗 Ou utiliser une URL d&apos;image
                    </summary>
                    <div className="mt-2">
                      <input
                        type="url"
                        placeholder="https://exemple.com/image.jpg"
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            setCustomPhotoUrl(e.target.value.trim());
                          }
                        }}
                        disabled={isCustomLoading}
                      />
                    </div>
                  </details>
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
                  {(customPhotoUrl || customPhotoFile) && (
                    <div className="flex items-start space-x-2 text-xs text-blue-600 mb-3 bg-blue-50 p-3 rounded">
                      <div className="flex-shrink-0">
                        {customPhotoUrl && (
                          <Image
                            src={customPhotoUrl}
                            alt="Aperçu photo"
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">📸 Photo incluse</div>
                        <div className="text-gray-600 truncate">
                          {customPhotoFile
                            ? customPhotoFile.name
                            : "Image depuis URL"}
                        </div>
                      </div>
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
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Choisir les destinataires :
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => sendCustomMessage('current')}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                  disabled={
                    !customMessage.trim() ||
                    isCustomLoading ||
                    stats.totalParticipants === 0
                  }
                >
                  {isCustomLoading
                    ? "📤 Envoi en cours..."
                    : `📤 Tirage actuel (${stats.totalParticipants})`}
                </Button>
                
                <Button
                  onClick={() => sendCustomMessage('all')}
                  className="w-full bg-green-600 hover:bg-green-700 py-3"
                  disabled={
                    !customMessage.trim() ||
                    isCustomLoading ||
                    stats.totalAllParticipants === 0
                  }
                >
                  {isCustomLoading
                    ? "📤 Envoi en cours..."
                    : `📤 Historique complet (${stats.totalAllParticipants})`}
                </Button>
              </div>
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
              Liste des participants (tirage actuel)
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
