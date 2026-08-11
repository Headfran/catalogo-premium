"use server"

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function crearProductoPrueba(formData: FormData) {
  // Extraer los dtos del formulario
  const nombre = formData.get("nombre") as string;
  const precio = Number(formData.get("precio"));
  const descripcion = formData.get("descripcion") as string;

  // Extraer la imgen del FormData
  const imagen = formData.get("imagen") as File | null;

  let imagen_url = "";

  // Si el usuario subió una imagen, la guardamos primero en Storage
  if (imagen && imagen.size > 0) {
    // Generar un nombre único para no sobrescribir fotos con el mismo nombre
    const fileName = `${Date.now()}_${imagen.name}`;

    // Subir al bucket llamado 'productos'
    const { data: uploadData, error: uploadError } = await supabase.storage.from("productos").upload(fileName, imagen);

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError);
      return { success: false, error: "No se pudo subir la imagen." };
    }

    // Obtener la URL pública de la imagen recién subida
    const { data: publicUrlData } = supabase.storage.from("productos").getPublicUrl(fileName);

    imagen_url = publicUrlData.publicUrl;
  }

  // Insertar en la tabla de l base de datos
  const { data, error } = await supabase
    .from("productos")
    .insert([{ nombre, precio, descripcion, imagen_url }]);

  // Manejar el resultado
  if (error) {
    console.error("Error en Supabase:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/prueba');
  return { success: true };
}
