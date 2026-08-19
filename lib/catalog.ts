// lib/catalog.ts
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// USAR CLIENTE PÚBLICO (ANON_KEY) PARA EL CATÁLOGO PÚBLICO
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  lineId: string;
  lineName: string;
  lineIds: string[];
  lineNames: string[];
  sizes: string[];
  soldOut: boolean;
};

export type LineItem = {
  id: string;
  name: string;
};

// CACHÉ DE LÍNEAS (1 hora)
export const getCachedLines = unstable_cache(
  async (): Promise<LineItem[]> => {
    try {
      const { data, error } = await supabase
        .from("lineas")
        .select("id, nombre")
        .order("id", { ascending: true });

      if (error || !data) return [{ id: "todas", name: "Todas" }];

      const mappedLines = data.map((l) => ({
        id: String(l.id),
        name: l.nombre,
      }));

      return [{ id: "todas", name: "Todas" }, ...mappedLines];
    } catch (err) {
      console.error("Error al obtener líneas:", err);
      return [{ id: "todas", name: "Todas" }];
    }
  },
  ["catalog-lines-cache"],
  { revalidate: 3600, tags: ["lines"] }
);

// CACHÉ DE PRODUCTOS (60 segundos)
export const getCachedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const { data, error } = await supabase
        .from("productos")
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          imagen_url,
          agotado,
          productos_lineas (
            linea_id,
            lineas ( id, nombre )
          ),
          productos_tallas (
            talla_id,
            tallas ( id, nombre, orden )
          )
        `)
        .order("id", { ascending: false });

      if (error || !data) return [];

      return data.map((p: any) => {
        const lineRels = p.productos_lineas || [];
        const lineIds = lineRels.map((pl: any) => String(pl.linea_id)).filter(Boolean);
        const lineNames = lineRels.map((pl: any) => pl.lineas?.nombre).filter(Boolean);

        const lineId = lineIds[0] || "";
        const lineName = lineNames[0] || "";

        // Ordenar tallas por su posición
        const rawSizes = (p.productos_tallas || [])
          .map((pt: any) => pt.tallas)
          .filter(Boolean)
          .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
          .map((t: any) => t.nombre);

        return {
          id: p.id,
          name: p.nombre,
          description: p.descripcion || "",
          price: Number(p.precio) || 0,
          image: p.imagen_url || "/placeholder.jpg",
          lineId,
          lineName,
          lineIds,
          lineNames,
          sizes: rawSizes.length > 0 ? rawSizes : ["Única"],
          soldOut: Boolean(p.agotado),
        };
      });
    } catch (err) {
      console.error("Error al obtener productos:", err);
      return [];
    }
  },
  ["catalog-products-cache"],
  { revalidate: 60, tags: ["products"] }
);
