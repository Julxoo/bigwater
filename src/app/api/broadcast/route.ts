import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Fonction pour envoyer une photo avec un message Telegram
async function sendTelegramPhoto(chatId: number, photoUrl: string, caption: string, parseMode: string = 'HTML') {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN non configuré");
    return false;
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
        parse_mode: parseMode,
      }),
    });

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
    const supabase = await createClient();

    // Récupérer tous les participants
    const { data: participants, error } = await supabase
      .from("participants")
      .select("telegram_user_id, first_name")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des participants:", error);
      return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Aucun participant trouvé" 
      });
    }

    // Message prédéfini avec lien hypertexte HTML
    const message = `Hey toi ! 🫵🏼
Si t'as pas eu la chance d'être tiré aux sorts par le Gratteur Barge ce soir, tu auras peut être plus de chance sur OscarSpin ! L'un des meilleurs casinos en ligne du moment

Avec dépôts et retraits bancaires instantanés ⚡ 

Tes premiers dépôts sont DOUBLÉS, tu dépose 100€ tu joues avec 250€ sur tes 3 premiers dépôts 

Si t'es pas encore inscrit, voilà le lien du casino 🎰 :

<a href="https://www.ontrklnk.com/visit/?bta=48158&nci=6538&afp10=Telegram&utm_campaign=TG">OscarSpin Casino</a>`;

    // URL de l'image (vous pouvez changer cette URL)
    const photoUrl = "https://i.postimg.cc/vcT5kGY7/image.png";

    let successCount = 0;
    let failCount = 0;

    // Envoyer le message à tous les participants
    for (const participant of participants) {
      const success = await sendTelegramPhoto(
        participant.telegram_user_id,
        photoUrl,
        message,
        'HTML'
      );
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Petit délai pour éviter de surcharger l'API Telegram
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Messages envoyés: ${successCount} succès, ${failCount} échecs`);

    return NextResponse.json({
      success: true,
      totalParticipants: participants.length,
      successCount,
      failCount,
      message: `Messages envoyés à ${successCount}/${participants.length} participants`
    });

  } catch (error) {
    console.error("Erreur lors du broadcast:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}