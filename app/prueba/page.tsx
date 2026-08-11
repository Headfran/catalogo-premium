"use client"

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { crearProductoPrueba } from "@/actions/productos";

export default function PaginaPrueba() {
   const [loading, setLoading] = useState(false);

   // Estado para guardar la URL de la vista previa
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

   // Referencia al input file para poder limpiarlo
   const fileInputRef = useRef<HTMLInputElement>(null);

   // Función que se ejecuta cuando el usuario selecciona una foto
   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const objectUrl = URL.createObjectURL(file);
         setPreviewUrl(objectUrl);
      } else {
         setPreviewUrl(null);
      }
   };

   // Función para quitar la foto selecciona
   const clearImage = () => {
      setPreviewUrl(null);
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
   };

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);

      const form = e.currentTarget;
      const formData = new FormData(form);

      // Interceptar la imagen
      const fileInput = form.elements.namedItem("imagen") as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (file) {
         try {
            // 2. Opciones de compresión: Máximo 200KB, formato WebP
            const options = {
               maxSizeMB: 0.2,
               maxWidthOrHeight: 1024,
               useWebWorker: true,
               fileType: "image/webp"
            };

            // Comprimir
            const compressedFile = await imageCompression(file, options);

            // Reemplazar la imagen original por la optimizada en el FormData
            const newFileName = compressedFile.name.replace(/\.[^/.]+$/, ".webp");
            formData.set("imagen", compressedFile, newFileName);
         } catch (error) {
            console.error("Error al comprimir la imagen:", error);
            alert("Hubo un problema optimizando la imagen.");
            setLoading(false);
            return;
         }
      }

      // Enviar a la Server Action
      const result = await crearProductoPrueba(formData);

      if (result.success) {
         alert("¡Producto y foto añadidos con éxito!");
         form.reset();
         clearImage();
      } else {
         alert("Error: " + result.error);
      }

      setLoading(false);
   };

   return (
      <main className="min-h-screen p-8 flex flex-col items-center justify-center bg-gray-50 text-gray-900">
         <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Añadir Producto</h1>

            {/* El formulario ejecuta la Server Action directamente */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
               <div className="flex flex-col gap-1">
                  <label className="font-medium text-sm">Nombre del Producto</label>
                  <input
                     type="text"
                     name="nombre"
                     placeholder="Ej: Camisa Ovejita"
                     className="border border-gray-300 p-2 rounded focus:outline-blue-500"
                     required
                  />
               </div>

               <div className="flex flex-col gap-1">
                  <input
                     type="number"
                     name="precio"
                     step="0.01"
                     placeholder="Ej. 15.50"
                     className="border border-gray-300 p-2 rounded focus:outline-blue-500"
                     required
                  />
               </div>

               <div className="flex flex-col gap-1">
                  <label className="font-medium text-sm">Descripción</label>
                  <textarea
                     name="descripcion"
                     placeholder="Detalles del producto..."
                     className="border border-gray-300 p-2 rounded focus:outline-blue-500 resize-none"
                     rows={3}
                  />
               </div>

               <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm">Foto del Producto</label>

                  {previewUrl && (
                     <div className="relative w-full h-48 bg-gray-100 rounded border border-gray-200 overflow-hidden mb-2 group">
                        <img
                           src={previewUrl}
                           alt="Vista previa"
                           className="w-full h-full object-contain"
                        />
                        <button
                           type="button"
                           onClick={clearImage}
                           className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                           title="Quitar imagen"
                        >
                           ✕
                        </button>
                     </div>
                  )}

                  <input type="file" name="imagen" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="border border-gray-300 p-2 rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
               >
                  {loading ? "Comprimiendo y guardando..." : "Guardar Producto"}
               </button>
            </form>
         </div>
      </main>
   );
}
