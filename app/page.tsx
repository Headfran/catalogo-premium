import { getCachedLines, getCachedProducts, getCachedCarousel } from "@/lib/catalog";
import CatalogClient from "@/components/CatalogClient";

// Revalidación estática de la página cada 60 segundos
export const revalidate = 60;

// Función para obtener la tasa del dólar con revalidación de 6 horas
async function getBcvRate(): Promise<number> {
   try {
      const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
         next: { revalidate: 21600 }, // Cacheado por 6 horas (21.600 s)
      });

      if (!res.ok) return 0;
      const data = await res.json();
      return data.promedio || data.monto || 0;
   } catch (error) {
      console.error("Error al consultar tasa de cambio:", error);
      return 0;
   }
}

export default async function HomePage() {
   const [lines, products, exchangeRate, carousel] = await Promise.all([
      getCachedLines(),
      getCachedProducts(),
      getBcvRate(),
      getCachedCarousel(),
   ]);

   return (
      <CatalogClient
         initialProducts={products}
         lines={lines}
         exchangeRate={exchangeRate}
         initialCarousel={carousel}
      />
   );
}
