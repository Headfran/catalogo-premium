"use server";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verificarAutenticacion() {
  const cookieStore = await cookies();

  const supabaseUserClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabaseUserClient.auth.getUser();

  if (error || !user) {
    throw new Error("No tienes autorización para realizar esta operación.");
  }

  return user;
}

function extraerPathStorage(url: string, bucket = "productos"): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.substring(index + marker.length);
}

export async function guardarProducto(formData: FormData) {
  try {
    await verificarAutenticacion();

    const id = formData.get("id") ? Number(formData.get("id")) : null;
    const nombre = formData.get("nombre") as string;
    const descripcion = formData.get("descripcion") as string;
    const precio = Number(formData.get("precio"));
    const lineaId = formData.get("linea_id") as string;
    const tallasJson = formData.get("tallas") as string;
    const tallasNombres: string[] = tallasJson ? JSON.parse(tallasJson) : [];
    const agotado = formData.get("agotado") === "true";
    const imagenFile = formData.get("imagen") as File | null;

    let imagen_url = (formData.get("imagen_actual") as string) || "";
    let imagenAnteriorUrl: string | null = null;

    if (id && imagenFile && imagenFile.size > 0 && typeof imagenFile !== "string") {
      const { data: prodActual } = await supabaseAdmin
        .from("productos")
        .select("imagen_url")
        .eq("id", id)
        .single();

      if (prodActual) {
        imagenAnteriorUrl = prodActual.imagen_url;
      }
    }

    if (imagenFile && imagenFile.size > 0 && typeof imagenFile !== "string") {
      const fileName = `${Date.now()}_${imagenFile.name.replace(/\s+/g, "_")}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("productos")
        .upload(fileName, imagenFile, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error al subir la imagen:", uploadError);
        return { success: false, error: "Error al subir la imagen al servidor." };
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("productos")
        .getPublicUrl(fileName);

      imagen_url = publicUrlData.publicUrl;
    }

    let productoId = id;

    if (productoId) {
      const { error: updateError } = await supabaseAdmin
        .from("productos")
        .update({
          nombre,
          descripcion,
          precio,
          imagen_url,
          agotado,
        })
        .eq("id", productoId);

      if (updateError) throw updateError;
    } else {
      const { data: newProd, error: insertError } = await supabaseAdmin
        .from("productos")
        .insert([
          {
            nombre,
            descripcion,
            precio,
            imagen_url,
            agotado,
          },
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;
      productoId = newProd.id;
    }

    if (lineaId) {
      await supabaseAdmin.from("productos_lineas").delete().eq("producto_id", productoId);
      await supabaseAdmin.from("productos_lineas").insert([
        {
          producto_id: productoId,
          linea_id: Number(lineaId),
        },
      ]);
    }

    if (tallasNombres.length > 0) {
      const { data: tallasDB } = await supabaseAdmin
        .from("tallas")
        .select("id, nombre")
        .in("nombre", tallasNombres);

      if (tallasDB && tallasDB.length > 0) {
        await supabaseAdmin.from("productos_tallas").delete().eq("producto_id", productoId);

        const rels = tallasDB.map((t) => ({
          producto_id: productoId,
          talla_id: t.id,
        }));

        await supabaseAdmin.from("productos_tallas").insert(rels);
      }
    }

    if (imagenAnteriorUrl && imagenAnteriorUrl !== imagen_url) {
      const oldPath = extraerPathStorage(imagenAnteriorUrl);
      if (oldPath) {
        await supabaseAdmin.storage.from("productos").remove([oldPath]);
      }
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error en guardarProducto:", error);
    return { success: false, error: error.message || "Error al procesar el producto." };
  }
}

export async function eliminarProductos(ids: number[]) {
  try {
    await verificarAutenticacion();

    if (!ids || ids.length === 0) {
      return { success: false, error: "No se seleccionaron productos para eliminar." };
    }

    const { data: productosABorrar, error: fetchError } = await supabaseAdmin
      .from("productos")
      .select("id, imagen_url")
      .in("id", ids);

    if (fetchError) throw fetchError;

    const pathsStorageToDelete = (productosABorrar || [])
      .map((prod) => extraerPathStorage(prod.imagen_url))
      .filter((path): path is string => Boolean(path));

    // Eliminar referencias en tablas pivot
    await supabaseAdmin.from("productos_lineas").delete().in("producto_id", ids);
    await supabaseAdmin.from("productos_tallas").delete().in("producto_id", ids);

    // Borrar de la base de datos
    const { error: deleteDbError } = await supabaseAdmin
      .from("productos")
      .delete()
      .in("id", ids);

    if (deleteDbError) throw deleteDbError;

    // Borrar imágenes del bucket
    if (pathsStorageToDelete.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("productos")
        .remove(pathsStorageToDelete);

      if (storageError) {
        console.error("Error al borrar imágenes de Storage:", storageError);
      }
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error en eliminarProductos:", error);
    return { success: false, error: error.message || "Error al eliminar el producto." };
  }
}

export async function cambiarEstadoAgotado(ids: number[], soldOut: boolean) {
  try {
    await verificarAutenticacion();

    const { error } = await supabaseAdmin
      .from("productos")
      .update({ agotado: soldOut })
      .in("id", ids);

    if (error) throw error;

    revalidatePath("/");

    return { success: true };
  } catch (err: any) {
    console.error("Error al cambiar estado de agotado:", err);
    return { success: false, error: err.message };
  }
}
