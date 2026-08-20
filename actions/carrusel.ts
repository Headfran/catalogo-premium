"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function guardarImagenCarrusel(id: number, imagenFile: File) {
  try {
    const fileName = `${Date.now()}_${imagenFile.name.replace(/\s+/g, "_")}`;

    // 1. Subir al nuevo bucket 'carrusel'
    const { error: uploadError } = await supabaseAdmin.storage
      .from("carrusel")
      .upload(fileName, imagenFile, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error al subir imagen del carrusel:", uploadError);
      return { success: false, error: "Error al subir la imagen." };
    }

    // 2. Obtener URL pública
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("carrusel")
      .getPublicUrl(fileName);

    const imagen_url = publicUrlData.publicUrl;

    // 3. Actualizar el registro en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from("carrusel")
      .update({ imagen_url })
      .eq("id", id);

    if (updateError) throw updateError;

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error en guardarImagenCarrusel:", error);
    return { success: false, error: error.message || "Error interno." };
  }
}
