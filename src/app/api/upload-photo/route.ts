import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const formData = await request.formData();
    const file = formData.get("photo") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image ne doit pas dépasser 5MB" },
        { status: 400 }
      );
    }

    // Générer un nom unique pour le fichier
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;
    const filePath = `broadcast-photos/${fileName}`;

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Erreur upload Supabase:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload de l'image" },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from("photos").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
