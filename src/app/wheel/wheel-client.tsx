"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

interface Participant {
  id: number;
  telegram_user_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  created_at: string;
}

interface WheelClientProps {
  user: User;
}

export default function WheelClient({ user }: WheelClientProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [rotation, setRotation] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchParticipants();
  }, []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const spinWheel = () => {
    if (participants.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    // Générer un angle de rotation aléatoire (minimum 5 tours complets)
    const spins = 5 + Math.random() * 5; // Entre 5 et 10 tours
    const randomAngle = Math.random() * 360;
    const totalRotation = spins * 360 + randomAngle;

    setRotation((prev) => prev + totalRotation);

    // Calculer le gagnant basé sur l'angle final
    setTimeout(() => {
      const finalAngle = (rotation + totalRotation) % 360;
      const segmentAngle = 360 / participants.length;
      const winnerIndex =
        Math.floor((360 - finalAngle) / segmentAngle) % participants.length;

      setWinner(participants[winnerIndex]);
      setIsSpinning(false);
    }, 4000); // 4 secondes d'animation
  };

  const getDisplayName = (participant: Participant) => {
    if (participant.username) return `@${participant.username}`;
    return `${participant.first_name}${
      participant.last_name ? " " + participant.last_name : ""
    }`;
  };

  const generateWheelColors = (count: number) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = ((i * 360) / count) % 360;
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
  };

  const colors = generateWheelColors(participants.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                ← Retour au Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-white">
                🎡 Tirage au Sort
              </h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Qui va être le gagnant ? 🏆
          </h2>
          <p className="text-xl text-white/80">
            {participants.length} participant
            {participants.length > 1 ? "s" : ""} inscrit
            {participants.length > 1 ? "s" : ""}
          </p>
        </div>

        {participants.length === 0 ? (
          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-12">
              <h3 className="text-2xl font-bold text-white mb-4">
                Aucun participant pour le moment
              </h3>
              <p className="text-white/80 mb-6">
                Les utilisateurs doivent envoyer &quot;GO&quot; au bot Telegram
                pour participer
              </p>
              <Button
                onClick={fetchParticipants}
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                Actualiser la liste
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-8">
            {/* Roue */}
            <div className="relative">
              {/* Indicateur de gagnant */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
              </div>

              {/* Roue */}
              <div
                ref={wheelRef}
                className="w-96 h-96 rounded-full border-8 border-white shadow-2xl relative overflow-hidden"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning
                    ? "transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                    : "none",
                }}
              >
                {participants.map((participant, index) => {
                  const angle = (360 / participants.length) * index;
                  const nextAngle = (360 / participants.length) * (index + 1);

                  return (
                    <div
                      key={participant.id}
                      className="absolute inset-0"
                      style={{
                        background: `conic-gradient(from ${angle}deg, ${
                          colors[index]
                        } 0deg, ${colors[index]} ${
                          360 / participants.length
                        }deg, transparent ${360 / participants.length}deg)`,
                        clipPath: `polygon(50% 50%, ${
                          50 + 50 * Math.cos(((angle - 90) * Math.PI) / 180)
                        }% ${
                          50 + 50 * Math.sin(((angle - 90) * Math.PI) / 180)
                        }%, ${
                          50 + 50 * Math.cos(((nextAngle - 90) * Math.PI) / 180)
                        }% ${
                          50 + 50 * Math.sin(((nextAngle - 90) * Math.PI) / 180)
                        }%)`,
                      }}
                    >
                      <div
                        className="absolute text-white font-bold text-sm"
                        style={{
                          top: `${
                            50 -
                            30 *
                              Math.cos(
                                ((angle + 360 / participants.length / 2 - 90) *
                                  Math.PI) /
                                  180
                              )
                          }%`,
                          left: `${
                            50 +
                            30 *
                              Math.sin(
                                ((angle + 360 / participants.length / 2 - 90) *
                                  Math.PI) /
                                  180
                              )
                          }%`,
                          transform: `translate(-50%, -50%) rotate(${
                            angle + 360 / participants.length / 2
                          }deg)`,
                          textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                        }}
                      >
                        {getDisplayName(participant).length > 12
                          ? getDisplayName(participant).substring(0, 12) + "..."
                          : getDisplayName(participant)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bouton de tirage */}
            <Button
              onClick={spinWheel}
              disabled={isSpinning}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 text-xl rounded-full shadow-lg transform transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpinning ? "Tirage en cours..." : "🎲 LANCER LE TIRAGE"}
            </Button>

            {/* Résultat */}
            {winner && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center animate-bounce">
                <h3 className="text-3xl font-bold text-white mb-4">
                  🎉 Et le gagnant est...
                </h3>
                <div className="bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl text-2xl">
                  {getDisplayName(winner)}
                </div>
                <p className="text-white/80 mt-4">Félicitations ! 🏆</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={fetchParticipants}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Actualiser la liste
              </Button>
              {winner && (
                <Button
                  onClick={() => {
                    setWinner(null);
                    setRotation(0);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Nouveau tirage
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
