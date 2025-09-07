import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Fonction pour envoyer un message Telegram simple
async function sendTelegramMessage(
  chatId: number,
  text: string,
  parseMode: string = "HTML"
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN non configuré");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: parseMode,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Erreur envoi message à ${chatId}:`, errorData);
      return false;
    } else {
      console.log(`Message envoyé à ${chatId}`);
      return true;
    }
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message à ${chatId}:`, error);
    return false;
  }
}

// Fonction pour envoyer une photo avec un message Telegram
async function sendTelegramPhoto(
  chatId: number,
  photoUrl: string,
  caption: string,
  parseMode: string = "HTML"
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN non configuré");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: caption,
          parse_mode: parseMode,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Erreur envoi photo à ${chatId}:`, errorData);
      return false;
    } else {
      console.log(`Photo envoyée à ${chatId}`);
      return true;
    }
  } catch (error) {
    console.error(`Erreur lors de l'envoi de la photo à ${chatId}:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { message, photoUrl } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Le message ne peut pas être vide",
        },
        { status: 400 }
      );
    }

    // Récupérer tous les participants de l'historique complet
    const { data: participants, error } = await supabase
      .from("all_participants")
      .select("telegram_user_id, first_name")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des participants historiques:", error);
      return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Aucun participant trouvé dans l'historique",
      });
    }

    let successCount = 0;
    let failCount = 0;

    // Envoyer le message à tous les participants de l'historique
    for (const participant of participants) {
      let success = false;

      if (photoUrl && photoUrl.trim().length > 0) {
        // Envoyer avec photo
        success = await sendTelegramPhoto(
          participant.telegram_user_id,
          photoUrl.trim(),
          message.trim(),
          "HTML"
        );
      } else {
        // Envoyer message simple
        success = await sendTelegramMessage(
          participant.telegram_user_id,
          message.trim(),
          "HTML"
        );
      }

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Petit délai pour éviter de surcharger l'API Telegram
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `Messages personnalisés historique envoyés: ${successCount} succès, ${failCount} échecs`
    );

    return NextResponse.json({
      success: true,
      totalParticipants: participants.length,
      successCount,
      failCount,
      message: `Messages envoyés à ${successCount}/${participants.length} participants de l'historique complet`,
      hasPhoto: !!(photoUrl && photoUrl.trim().length > 0),
    });
  } catch (error) {
    console.error("Erreur lors du broadcast personnalisé historique:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}