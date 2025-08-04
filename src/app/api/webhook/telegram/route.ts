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

    // Essayer d'insérer l'utilisateur (ignore si déjà présent grâce à UNIQUE)
    const { error } = await supabase.from("participants").insert({
      telegram_user_id: message.from.id,
      first_name: message.from.first_name,
      last_name: message.from.last_name,
      username: message.from.username,
    });

    // Si l'utilisateur existe déjà, mettre à jour ses infos
    if (error && error.code === "23505") {
      // Code d'erreur PostgreSQL pour violation de contrainte unique
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
    } else if (!error) {
      console.log(
        `Nouveau participant ajouté: ${message.from.first_name} (ID: ${message.from.id})`
      );
    } else {
      console.error("Erreur lors de l'ajout du participant:", error);
      return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur webhook Telegram:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
