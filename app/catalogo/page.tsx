import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export default async function Catalogo() {
   // Hacer la consulta al componente
   const { data: productos, error } = await supabase.from('productos').select('*').order('id', { ascending: false });

   if (error) {
      console.error("Error al cargar productos", error);
      return <div className="p-8 text-red-500">Error al cargar el catálogo.</div>;
   }

   return (
      <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
         <h1 className="text-3xl font-bold mb-8 text-center">Nuestro Catálogo</h1>

         {/* Grid de tarjetas de productos */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl mx-auto">
            {productos?.length === 0 ? (
               <p className="col-span-full text-center text-gray-500">No hay productos todavía.</p>
            ) : (
               productos?.map((producto) => (
                  <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                     {producto.imagen_url ? (
                        <div className="w-full h-48 relative overflow-hidden bg-gray-200">
                           <img
                              src={producto.imagen_url}
                              alt={producto.nombre}
                              className="w-full h-full object-cover"
                           />
                        </div>
                     ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                           <span className="text-gray-400">Sin imagen</span>
                        </div>
                     )}

                     <div className="p-4">
                        <h2 className="text-xl font-semibold mb-2">{producto.nombre}</h2>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                           {producto.descripcion}
                        </p>
                        <div className="flex justify-between items-center">
                           <span className="text-2xl font-bold text-green-600">
                              ${producto.precio}
                           </span>
                           <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                              Añadir
                           </button>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </main>
   );
}
