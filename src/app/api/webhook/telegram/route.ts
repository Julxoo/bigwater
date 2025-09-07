import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    date: number;
    text?: string;
  };
}

// Fonction pour envoyer un message Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN non configuré");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur envoi message Telegram:", errorData);
    } else {
      console.log(`Message envoyé à ${chatId}: ${text}`);
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
  }
}

// Fonction pour envoyer une photo avec un message Telegram
async function sendTelegramPhoto(chatId: number, photoUrl: string, caption: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN non configuré");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur envoi photo Telegram:", errorData);
    } else {
      console.log(`Photo envoyée à ${chatId} avec caption: ${caption}`);
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de la photo:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();

    // Vérifier qu'il y a un message avec du texte
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    const messageText = message.text!.trim().toLowerCase();

    // Filtrer seulement les messages "GO" (insensible à la casse)
    if (messageText !== "go") {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    let isNewParticipant = false;

    // Vérifier si l'utilisateur existe déjà dans la table temporaire
    const { data: existingUser } = await supabase
      .from("participants")
      .select("id")
      .eq("telegram_user_id", message.from.id)
      .single();

    // TOUJOURS enregistrer/mettre à jour dans la table persistante
    const { error: allParticipantsError } = await supabase
      .from("all_participants")
      .upsert({
        telegram_user_id: message.from.id,
        first_name: message.from.first_name,
        last_name: message.from.last_name,
        username: message.from.username,
        last_participation: new Date().toISOString(),
      }, {
        onConflict: 'telegram_user_id'
      });

    if (allParticipantsError) {
      console.error("Erreur lors de l'ajout dans all_participants:", allParticipantsError);
    }

    if (existingUser) {
      // Utilisateur existe déjà dans la table temporaire, mettre à jour ses infos
      await supabase
        .from("participants")
        .update({
          first_name: message.from.first_name,
          last_name: message.from.last_name,
          username: message.from.username,
        })
        .eq("telegram_user_id", message.from.id);

      console.log(
        `Utilisateur existant mis à jour: ${message.from.first_name} (ID: ${message.from.id})`
      );
      
      // Envoyer message "déjà inscrit" (sans photo)
      await sendTelegramMessage(
        message.chat.id,
        `Salut ${message.from.first_name} ! 👋\n\nTu es déjà inscrit(e) au tirage au sort ! 🎯\n\nTu peux maintenant attendre le résultat du tirage. Bonne chance ! 🍀`
      );
    } else {
      // Nouvel utilisateur dans la table temporaire
      const { error } = await supabase.from("participants").insert({
        telegram_user_id: message.from.id,
        first_name: message.from.first_name,
        last_name: message.from.last_name,
        username: message.from.username,
      });

      if (error) {
        console.error("Erreur lors de l'ajout du participant:", error);
        await sendTelegramMessage(
          message.chat.id,
          `Désolé ${message.from.first_name}, une erreur s'est produite lors de ton inscription. Réessaie plus tard ! 😅`
        );
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
      }

      console.log(
        `Nouveau participant ajouté: ${message.from.first_name} (ID: ${message.from.id})`
      );
      isNewParticipant = true;

      // Envoyer message de confirmation d'inscription avec photo
      await sendTelegramPhoto(
        message.chat.id,
        "https://i.postimg.cc/vcT5kGY7/image.png",
        `Félicitations ${message.from.first_name} ! 🎉\n\nTon inscription au tirage au sort est confirmée ! ✅\n\nTu peux maintenant attendre le résultat du tirage. Bonne chance ! 🍀`
      );
    }

    return NextResponse.json({ 
      ok: true, 
      isNewParticipant,
      userId: message.from.id 
    });
  } catch (error) {
    console.error("Erreur webhook Telegram:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
