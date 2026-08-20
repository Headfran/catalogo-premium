"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { guardarProducto, eliminarProductos, cambiarEstadoAgotado } from "@/actions/productos";
import { guardarImagenCarrusel } from "@/actions/carrusel";
import {
   FaTshirt,
   FaSignOutAlt,
   FaSearch,
   FaTrashAlt,
   FaEdit,
   FaTrash,
   FaPlus,
   FaTimes,
   FaUpload,
   FaBell,
   FaBan,
   FaCheckCircle,
   FaSave
} from "react-icons/fa";

import "./admin.css";

type Product = {
   id: number;
   name: string;
   description: string;
   price: number;
   image: string;
   lineId: string;
   sizes: string[];
   unavailableSizes: string[];
   soldOut: boolean;
};

type LineItem = {
   id: string;
   name: string;
};

type SizeItem = {
   id: number;
   nombre: string;
   orden?: number;
   grupo?: {
      id: number;
      nombre: string;
   } | null;
};

type FormState = Omit<Product, "id">;

const EMPTY_FORM: FormState = {
   name: "",
   description: "",
   price: 0,
   image: "",
   lineId: "",
   sizes: [],
   unavailableSizes: [],
   soldOut: false,
};

type CarouselItem = {
   id: number | null;
   url: string | null;
   file: File | null;
   titulo: string;
};

const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
   const [products, setProducts] = useState<Product[]>([]);
   const [lines, setLines] = useState<LineItem[]>([]);
   const [allTallas, setAllTallas] = useState<SizeItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [bcvRate, setBcvRate] = useState<number | null>(null);

   const [search, setSearch] = useState("");
   const [lineFilter, setLineFilter] = useState("all");
   const [sizeFilter, setSizeFilter] = useState("all");
   const [statusFilter, setStatusFilter] = useState("all");

   const [currentPage, setCurrentPage] = useState(1);
   const [editorOpen, setEditorOpen] = useState(false);
   const [selectedIds, setSelectedIds] = useState<number[]>([]);
   const [draggingImage, setDraggingImage] = useState(false);
   const [editingId, setEditingId] = useState<number | null>(null);
   const [form, setForm] = useState<FormState>(EMPTY_FORM);
   const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
   const [imageFile, setImageFile] = useState<File | null>(null);
   const [loggingOut, setLoggingOut] = useState(false);

   const [carouselOpen, setCarouselOpen] = useState(false);
   const [savingCarousel, setSavingCarousel] = useState(false);
   const [carouselItems, setCarouselItems] = useState<CarouselItem[]>(
      Array(5).fill(null).map(() => ({ id: null, url: null, file: null, titulo: "Cargando..." }))
   );
   const [carouselDragging, setCarouselDragging] = useState<number | null>(null);

   const router = useRouter();

   // Cargar pestaña guardada al montar el componente
   useEffect(() => {
      const savedTab = localStorage.getItem("kasaca_admin_tab");
      if (savedTab === "carousel") {
         setCarouselOpen(true);
      }
   }, []);

   // Manejar cambio de pestaña
   const handleTabChange = (isCarousel: boolean) => {
      setCarouselOpen(isCarousel);
      localStorage.setItem("kasaca_admin_tab", isCarousel ? "carousel" : "stock");
   };

   useEffect(() => {
      fetch("https://ve.dolarapi.com/v1/dolares/oficial")
         .then((res) => res.json())
         .then((data) => {
            if (data && data.promedio) {
               setBcvRate(data.promedio);
            }
         })
         .catch((err) => console.error("Error al obtener la tasa BCV:", err));
   }, []);

   const fetchAdminData = async () => {
      setLoading(true);
      try {
         // Cargar líneas
         const { data: lineasData } = await supabase
            .from("lineas")
            .select("id, nombre")
            .order("id", { ascending: true });

         if (lineasData) {
            const mappedLines = lineasData.map((l) => ({ id: String(l.id), name: l.nombre }));
            setLines(mappedLines);
            if (mappedLines.length > 0 && !EMPTY_FORM.lineId) {
               EMPTY_FORM.lineId = mappedLines[0].id;
            }
         }

         // Cargar tallas
         const { data: tallasData } = await supabase
            .from("tallas")
            .select("id, nombre, orden, grupo ( id, nombre )")
            .order("orden", { ascending: true });

         if (tallasData) setAllTallas(tallasData as any);

         // Cargar carrusel desde la base de datos (solución de IDs)
         const { data: carruselData } = await supabase
            .from("carrusel")
            .select("id, titulo, imagen_url, orden")
            .order("orden", { ascending: true });

         if (carruselData) {
            setCarouselItems(() =>
               Array(5).fill(null).map((_, index) => {
                  // Tomamos los registros en el orden exacto en que vienen de la BD,
                  // sin importar qué número de ID u orden tengan guardado internamente.
                  const dbItem = carruselData[index];

                  if (dbItem) {
                     return {
                        id: dbItem.id,
                        url: dbItem.imagen_url,
                        titulo: dbItem.titulo || `Espacio ${index + 1}`,
                        file: null
                     };
                  }

                  return {
                     id: null,
                     url: null,
                     file: null,
                     titulo: `Espacio vacío`
                  };
               })
            );
         }

         // Cargar productos
         const { data: productosData, error } = await supabase
            .from("productos")
            .select(`
               id, nombre, descripcion, precio, imagen_url, agotado,
               productos_lineas ( linea_id, lineas ( id, nombre ) ),
               productos_tallas ( talla_id, tallas ( id, nombre, orden, grupo ( id, nombre ) ) )
            `)
            .order("id", { ascending: false });

         if (error) {
            toast.error("Error al cargar los productos de la base de datos.");
            return;
         }

         if (productosData) {
            const mappedProducts: Product[] = productosData.map((p: any) => {
               const firstLine = p.productos_lineas?.[0]?.lineas;
               const assignedSizes = (p.productos_tallas || [])
                  .map((pt: any) => pt.tallas?.nombre)
                  .filter(Boolean);

               return {
                  id: p.id,
                  name: p.nombre,
                  description: p.descripcion || "",
                  price: Number(p.precio) || 0,
                  image: p.imagen_url || "/placeholder.jpg",
                  lineId: firstLine ? String(firstLine.id) : "",
                  sizes: assignedSizes,
                  unavailableSizes: [],
                  soldOut: Boolean(p.agotado),
               };
            });
            setProducts(mappedProducts);
         }
      } catch (err) {
         console.error("Error inesperado:", err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchAdminData();
   }, []);

   const groupedTallas = useMemo(() => {
      const groups: Record<string, SizeItem[]> = {};
      allTallas.forEach((t) => {
         const groupName = t.grupo?.nombre || "General";
         if (!groups[groupName]) groups[groupName] = [];
         groups[groupName].push(t);
      });
      return groups;
   }, [allTallas]);

   const filteredProducts = useMemo(() => {
      const query = search.trim().toLowerCase();
      return products.filter((product) => {
         const matchesSearch = !query || product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query);
         const matchesLine = lineFilter === "all" || product.lineId === lineFilter;
         const matchesSize = sizeFilter === "all" || product.sizes.includes(sizeFilter);
         const matchesStatus = statusFilter === "all" || (statusFilter === "sold" ? product.soldOut : !product.soldOut);
         return matchesSearch && matchesLine && matchesSize && matchesStatus;
      });
   }, [products, search, lineFilter, sizeFilter, statusFilter]);

   useEffect(() => { setCurrentPage(1); }, [search, lineFilter, sizeFilter, statusFilter]);

   const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
   const paginatedProducts = useMemo(() => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
   }, [filteredProducts, currentPage]);

   function openNew() {
      setEditingId(null);
      setImageFile(null);
      const initialLine = lines.length > 0 ? lines[0].id : "";
      setForm({ ...EMPTY_FORM, lineId: initialLine, sizes: allTallas.map((t) => t.nombre), unavailableSizes: [] });
      setEditorOpen(true);
   }

   function openEdit(product: Product) {
      setEditingId(product.id);
      setImageFile(null);
      setForm({
         name: product.name, description: product.description, price: product.price,
         image: product.image, lineId: product.lineId, sizes: product.sizes,
         unavailableSizes: product.unavailableSizes, soldOut: product.soldOut,
      });
      setEditorOpen(true);
   }

   function closeEditor() {
      setEditorOpen(false);
      setEditingId(null);
      setImageFile(null);
   }

   function changeLine(lineId: string) { setForm((current) => ({ ...current, lineId })); }

   function toggleSize(sizeName: string) {
      setForm((current) => {
         const exists = current.sizes.includes(sizeName);
         return {
            ...current,
            sizes: exists ? current.sizes.filter((s) => s !== sizeName) : [...current.sizes, sizeName],
         };
      });
   }

   function handleFileSelect(file?: File) {
      if (!file) return;
      if (!file.type.startsWith("image/")) return toast.error("Selecciona un archivo de imagen válido.");
      setImageFile(file);
      setForm((current) => ({ ...current, image: URL.createObjectURL(file) }));
   }

   function handleImageDrop(event: React.DragEvent<HTMLLabelElement>) {
      event.preventDefault();
      setDraggingImage(false);
      handleFileSelect(event.dataTransfer.files?.[0]);
   }

   async function saveProduct(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!form.name.trim() || !form.description.trim()) return toast.error("Completa el nombre y la descripción.");
      if (form.price <= 0) return toast.error("El precio debe ser mayor a 0.");

      setSaving(true);
      const toastId = toast.loading("Optimizando imagen y guardando...");

      try {
         const formData = new FormData();
         if (editingId) formData.append("id", String(editingId));
         formData.append("nombre", form.name);
         formData.append("descripcion", form.description);
         formData.append("precio", String(form.price));
         formData.append("linea_id", form.lineId);
         formData.append("agotado", String(form.soldOut));
         formData.append("tallas", JSON.stringify(form.sizes));
         formData.append("imagen_actual", form.image);

         if (imageFile) {
            const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true, fileType: "image/webp" };
            const compressedFile = await imageCompression(imageFile, options);
            const newFileName = compressedFile.name.replace(/\.[^/.]+$/, ".webp");
            formData.append("imagen", compressedFile, newFileName);
         }

         const res = await guardarProducto(formData);

         if (res.success) {
            toast.success("¡Camiseta guardada con éxito!", { id: toastId });
            await fetchAdminData();
            setTimeout(closeEditor, 300);
         } else {
            toast.error("Error: " + res.error, { id: toastId });
         }
      } catch (err) {
         toast.error("Ocurrió un error al procesar la solicitud.", { id: toastId });
      } finally {
         setSaving(false);
      }
   }

   function deleteProduct(product: Product) {
      toast(`¿Eliminar "${product.name}"?`, {
         description: "Se eliminará la camiseta y su imagen de forma permanente.",
         action: {
            label: "Eliminar",
            onClick: async () => {
               const toastId = toast.loading("Eliminando camiseta...");
               const res = await eliminarProductos([product.id]);
               if (res.success) {
                  setProducts((prev) => prev.filter((item) => item.id !== product.id));
                  toast.success(`"${product.name}" eliminada correctamente.`, { id: toastId });
               } else {
                  toast.error("Error al eliminar: " + res.error, { id: toastId });
               }
            },
         },
      });
   }

   async function toggleSoldOut(product: Product) {
      const nextStatus = !product.soldOut;
      const toastId = toast.loading("Actualizando disponibilidad...");
      const res = await cambiarEstadoAgotado([product.id], nextStatus);
      if (res.success) {
         setProducts((prev) => prev.map((item) => item.id === product.id ? { ...item, soldOut: nextStatus } : item));
         toast.success(`Camiseta marcada como ${nextStatus ? "Agotada" : "En Stock"}.`, { id: toastId });
      } else {
         toast.error("Error al cambiar estado: " + res.error, { id: toastId });
      }
   }

   async function handleBulkSoldOut(soldOut: boolean) {
      if (!selectedIds.length) return;
      const statusText = soldOut ? "Agotadas" : "En Stock";
      const toastId = toast.loading(`Marcando ${selectedIds.length} producto(s) como ${statusText}...`);
      const res = await cambiarEstadoAgotado(selectedIds, soldOut);
      if (res.success) {
         setProducts((prev) => prev.map((product) => selectedIds.includes(product.id) ? { ...product, soldOut } : product));
         setSelectedIds([]);
         toast.success(`Productos marcados como ${statusText} con éxito.`, { id: toastId });
      } else {
         toast.error("Error al actualizar: " + res.error, { id: toastId });
      }
   }

   const unavailableCount = products.filter((product) => product.soldOut).length;
   const allVisibleSelected = paginatedProducts.length > 0 && paginatedProducts.every((product) => selectedIds.includes(product.id));

   function toggleSelected(id: number) {
      setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
   }

   function handleCarouselFile(index: number, file?: File) {
      if (!file) return;
      if (!file.type.startsWith("image/")) return toast.error("Selecciona un archivo de imagen válido.");

      const objectUrl = URL.createObjectURL(file);
      setCarouselItems((current) => {
         const next = [...current];
         if (next[index].url && next[index].file) URL.revokeObjectURL(next[index].url!);
         next[index] = { ...next[index], url: objectUrl, file };
         return next;
      });
   }

   function handleCarouselDrop(event: React.DragEvent<HTMLLabelElement>, index: number) {
      event.preventDefault();
      setCarouselDragging(null);
      handleCarouselFile(index, event.dataTransfer.files?.[0]);
   }

   function clearCarouselImage(index: number) {
      setCarouselItems((current) => {
         const next = [...current];
         if (next[index].url && next[index].file) URL.revokeObjectURL(next[index].url!);
         next[index] = { ...next[index], url: null, file: null };
         return next;
      });
   }

   async function saveCarousel() {
      setSavingCarousel(true);
      const toastId = toast.loading("Guardando imágenes del carrusel...");
      let hasErrors = false;

      try {
         for (const item of carouselItems) {
            if (item.file && item.id !== null) {
               const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1920, useWebWorker: true, fileType: "image/webp" };
               const compressed = await imageCompression(item.file, options);
               const newFileName = compressed.name.replace(/\.[^/.]+$/, ".webp");
               const finalFile = new File([compressed], newFileName, { type: "image/webp" });

               const res = await guardarImagenCarrusel(item.id, finalFile);
               if (!res.success) hasErrors = true;
            }
         }

         if (hasErrors) {
            toast.error("Ocurrió un error al guardar algunas imágenes.", { id: toastId });
         } else {
            toast.success("¡Carrusel actualizado con éxito!", { id: toastId });
            await fetchAdminData();
         }
      } catch (err) {
         toast.error("Error inesperado al guardar el carrusel.", { id: toastId });
      } finally {
         setSavingCarousel(false);
      }
   }

   const handleLogout = async () => {
      setLoggingOut(true);
      try {
         await supabase.auth.signOut();
         router.push("/login");
         router.refresh();
      } catch (err) {
         toast.error("Error al cerrar sesión.");
         setLoggingOut(false);
      }
   };

   function toggleSelectAll() {
      if (allVisibleSelected) {
         setSelectedIds((current) => current.filter((id) => !paginatedProducts.some((product) => product.id === id)));
         return;
      }
      setSelectedIds((current) => [...new Set([...current, ...paginatedProducts.map((product) => product.id)])]);
   }

   function deleteSelected() {
      if (!selectedIds.length) return;
      toast(`¿Eliminar ${selectedIds.length} producto(s)?`, {
         description: "Se borrarán permanentemente las camisetas seleccionadas con sus imágenes.",
         action: {
            label: "Eliminar todos",
            onClick: async () => {
               const toastId = toast.loading("Eliminando productos seleccionados...");
               const res = await eliminarProductos(selectedIds);
               if (res.success) {
                  setProducts((prev) => prev.filter((product) => !selectedIds.includes(product.id)));
                  setSelectedIds([]);
                  toast.success("Productos eliminados con éxito.", { id: toastId });
               } else {
                  toast.error("Error al eliminar: " + res.error, { id: toastId });
               }
            },
         },
      });
   }

   return (
      <main className="admin-page">
         <aside className="admin-sidebar">
            <div className="admin-sidebar-brand">
               <img src="/k.jpg" alt="Kasaca Sport" />
               <div>
                  <strong>Kasaca Sport</strong>
                  <span>Admin</span>
               </div>
            </div>

            <nav className="admin-nav">
               <button type="button" className={!carouselOpen ? "active" : ""} onClick={() => handleTabChange(false)}>
                  <FaTshirt className="admin-nav-icon" /> Stock de camisetas
               </button>

               <button type="button" className={carouselOpen ? "active" : ""} onClick={() => handleTabChange(true)}>
                  <FaUpload className="admin-nav-icon" /> Carrusel
               </button>

               <button type="button" className="admin-exit-item" onClick={handleLogout} disabled={loggingOut}>
                  <FaSignOutAlt className="admin-nav-icon" /> {loggingOut ? "Saliendo..." : "Salir"}
               </button>
            </nav>

            <div className="admin-sidebar-footer">
               <small>KASACA SPORT © 2026</small>
            </div>
         </aside>

         <section className="admin-content">
            <header className="admin-topbar">
               <div></div>
               <div className="admin-top-actions">
                  <button type="button" className="admin-icon-btn" aria-label="Notificaciones"><FaBell /></button>
                  <button type="button" className="admin-avatar" aria-label="Administrador">A</button>
               </div>
            </header>

            {carouselOpen ? (
               <div className="admin-carousel-panel">
                  <div className="admin-carousel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <span className="admin-carousel-kicker">GESTIÓN VISUAL</span>
                        <h1>Imágenes del Carrusel</h1>
                        <p>Sube las 5 imágenes que aparecerán en el carrusel principal de Kasaca Sport.</p>
                     </div>

                     <button
                        onClick={saveCarousel}
                        disabled={savingCarousel || !carouselItems.some(i => i.file)}
                        style={{
                           display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                           backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px',
                           fontWeight: 600, cursor: (savingCarousel || !carouselItems.some(i => i.file)) ? 'not-allowed' : 'pointer',
                           opacity: (savingCarousel || !carouselItems.some(i => i.file)) ? 0.5 : 1
                        }}
                     >
                        <FaSave /> {savingCarousel ? "Guardando..." : "Guardar Cambios"}
                     </button>
                  </div>

                  <div className="admin-carousel-grid">
                     {carouselItems.map((item, index) => (
                        <div className="admin-carousel-slot" key={index}>
                           <div className="admin-carousel-slot-top">
                              <span>Imagen {index + 1}</span>
                              <small>{item.titulo}</small>
                           </div>

                           <label
                              className={`admin-carousel-dropzone ${carouselDragging === index ? "dragging" : ""} ${item.url ? "has-image" : ""}`}
                              onDragOver={(event) => {
                                 event.preventDefault();
                                 setCarouselDragging(index);
                              }}
                              onDragLeave={() => setCarouselDragging(null)}
                              onDrop={(event) => handleCarouselDrop(event, index)}
                           >
                              {item.url ? (
                                 <>
                                    <img src={item.url} alt={`Vista previa carrusel ${index + 1}`} />
                                    <div className="admin-carousel-overlay">
                                       <span>Haz clic para cambiar</span>
                                    </div>
                                 </>
                              ) : (
                                 <div className="admin-carousel-empty">
                                    <FaUpload />
                                    <strong>Subir imagen</strong>
                                    <span>Arrastra aquí o haz clic</span>
                                 </div>
                              )}

                              <input
                                 type="file"
                                 accept="image/*"
                                 onChange={(event) => handleCarouselFile(index, event.target.files?.[0])}
                              />
                           </label>

                           {item.file && (
                              <button
                                 type="button"
                                 className="admin-carousel-remove"
                                 onClick={() => clearCarouselImage(index)}
                              >
                                 <FaTrashAlt /> Deshacer cambio
                              </button>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            ) : (
               <div className="admin-main">
                  <div className="admin-title-row">
                     <div>
                        <h1>Gestión de Camisetas</h1>
                        <p>Administra productos, precios, tallas y disponibilidad.</p>
                     </div>

                     <button type="button" className="admin-add-btn" onClick={openNew}>
                        <FaPlus /> Subir Nueva Camiseta
                     </button>
                  </div>

                  <div className="admin-toolbar">
                     <label className="admin-search-box">
                        <FaSearch className="search-icon" />
                        <input
                           value={search}
                           onChange={(event) => setSearch(event.target.value)}
                           placeholder="Buscar camiseta..."
                        />
                     </label>

                     <select value={lineFilter} onChange={(event) => setLineFilter(event.target.value)}>
                        <option value="all">Todas las Líneas</option>
                        {lines.map((line) => (
                           <option key={line.id} value={line.id}>{line.name}</option>
                        ))}
                     </select>

                     <select value={sizeFilter} onChange={(event) => setSizeFilter(event.target.value)}>
                        <option value="all">Todas las Tallas</option>
                        {allTallas.map((talla) => (
                           <option key={talla.id} value={talla.nombre}>
                              {talla.nombre} {talla.grupo?.nombre ? `(${talla.grupo.nombre})` : ""}
                           </option>
                        ))}
                     </select>

                     <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value="all">Estado</option>
                        <option value="available">En Stock</option>
                        <option value="sold">Agotada</option>
                     </select>

                     {selectedIds.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                           <button
                              type="button"
                              style={{
                                 padding: "8px 14px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.18)",
                                 color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.35)", fontWeight: "600",
                                 fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                              }}
                              onClick={() => handleBulkSoldOut(true)}
                              title="Marcar seleccionados como agotados"
                           >
                              <FaBan /> Agotadas ({selectedIds.length})
                           </button>

                           <button
                              type="button"
                              style={{
                                 padding: "8px 14px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.18)",
                                 color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.35)", fontWeight: "600",
                                 fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                              }}
                              onClick={() => handleBulkSoldOut(false)}
                              title="Marcar seleccionados como en stock"
                           >
                              <FaCheckCircle /> En Stock ({selectedIds.length})
                           </button>

                           <button type="button" className="admin-bulk-delete" onClick={deleteSelected}>
                              <FaTrashAlt /> Eliminar {selectedIds.length}
                           </button>
                        </div>
                     )}
                  </div>

                  <section className="admin-table-card">
                     <div className="admin-table">
                        <div className="admin-table-head">
                           <div>
                              <input
                                 type="checkbox"
                                 aria-label="Seleccionar todos los visibles"
                                 checked={allVisibleSelected}
                                 onChange={toggleSelectAll}
                              />
                           </div>
                           <div>Imagen</div>
                           <div>Nombre de la Camiseta</div>
                           <div>Sección / Línea</div>
                           <div>Precio USD</div>
                           <div>Precio Bs (BCV)</div>
                           <div>Descripción</div>
                           <div>Estado (Agotado)</div>
                           <div>Acciones</div>
                        </div>

                        {loading ? (
                           <div className="admin-empty">Cargando productos de la base de datos...</div>
                        ) : paginatedProducts.map((product) => (
                           <article className="admin-table-row" key={product.id}>
                              <div>
                                 <input
                                    type="checkbox"
                                    aria-label={`Seleccionar ${product.name}`}
                                    checked={selectedIds.includes(product.id)}
                                    onChange={() => toggleSelected(product.id)}
                                 />
                              </div>

                              <div>
                                 <img
                                    className="admin-product-image"
                                    src={product.image}
                                    alt={product.name}
                                    style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
                                    onClick={() => setLightboxImage({ url: product.image, title: product.name })}
                                    title="Haz clic para ampliar"
                                 />
                              </div>

                              <div className="admin-name-cell"><strong>{product.name}</strong></div>

                              <div className="admin-category">
                                 {lines.find((line) => line.id === product.lineId)?.name || "Sin Línea"}
                              </div>

                              <div className="admin-price-cell">${product.price.toFixed(2)}</div>

                              <div className="admin-price-cell">
                                 {bcvRate ? (
                                    `Bs. ${(product.price * bcvRate).toLocaleString("es-VE", {
                                       minimumFractionDigits: 2,
                                       maximumFractionDigits: 2,
                                    })}`
                                 ) : (
                                    <span className="text-gray-400 text-xs">Cargando Tasa...</span>
                                 )}
                              </div>

                              <div className="admin-description-cell">{product.description}</div>

                              <div>
                                 <button
                                    type="button"
                                    className={`admin-stock-toggle ${product.soldOut ? "sold" : "available"}`}
                                    onClick={() => toggleSoldOut(product)}
                                    aria-label={`Cambiar estado de ${product.name}`}
                                 >
                                    <span />
                                    {product.soldOut ? "Agotada" : "En Stock"}
                                 </button>
                              </div>

                              <div className="admin-row-actions">
                                 <button
                                    type="button"
                                    className="admin-edit-btn"
                                    onClick={() => openEdit(product)}
                                    title="Editar"
                                    aria-label={`Editar ${product.name}`}
                                 >
                                    <FaEdit />
                                 </button>

                                 <button
                                    type="button"
                                    className="admin-delete-btn"
                                    onClick={() => deleteProduct(product)}
                                    title="Eliminar"
                                    aria-label={`Eliminar ${product.name}`}
                                 >
                                    <FaTrash />
                                 </button>
                              </div>
                           </article>
                        ))}

                        {!loading && !filteredProducts.length && (
                           <div className="admin-empty">No hay productos que coincidan con los filtros.</div>
                        )}
                     </div>

                     <div className="admin-table-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", flexWrap: "wrap", gap: "12px" }}>
                        <span>
                           Mostrando {filteredProducts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} de {filteredProducts.length} productos
                        </span>

                        {totalPages > 1 && (
                           <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <button
                                 type="button"
                                 style={{
                                    padding: "6px 12px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", fontSize: "0.8rem",
                                    cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1
                                 }}
                                 onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                 disabled={currentPage === 1}
                              >
                                 Anterior
                              </button>

                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                 <button
                                    key={page}
                                    type="button"
                                    style={{
                                       padding: "6px 12px", borderRadius: "6px",
                                       background: currentPage === page ? "#ffffff" : "rgba(255, 255, 255, 0.05)",
                                       color: currentPage === page ? "#000000" : "#ffffff",
                                       border: "1px solid rgba(255, 255, 255, 0.1)",
                                       fontWeight: currentPage === page ? "bold" : "normal",
                                       fontSize: "0.8rem", cursor: "pointer"
                                    }}
                                    onClick={() => setCurrentPage(page)}
                                 >
                                    {page}
                                 </button>
                              ))}

                              <button
                                 type="button"
                                 style={{
                                    padding: "6px 12px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)", color: "#fff", fontSize: "0.8rem",
                                    cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1
                                 }}
                                 onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                 disabled={currentPage === totalPages}
                              >
                                 Siguiente
                              </button>
                           </div>
                        )}
                     </div>
                  </section>
               </div>
            )}
         </section>

         {editorOpen && (
            <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
               <form className="admin-editor-modal" onSubmit={saveProduct}>
                  <div className="admin-modal-head">
                     <div>
                        <span>{editingId === null ? "NUEVA CAMISETA" : "EDITAR CAMISETA"}</span>
                        <h2>{editingId === null ? "Subir nueva camiseta" : "Modificar camiseta"}</h2>
                     </div>
                     <button type="button" className="admin-close-btn" onClick={closeEditor}><FaTimes /></button>
                  </div>

                  <div className="admin-editor-grid">
                     <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>

                     <label>
                        Sección / Línea
                        <select value={form.lineId} onChange={(event) => changeLine(event.target.value)}>
                           {lines.map((line) => (<option key={line.id} value={line.id}>{line.name}</option>))}
                        </select>
                     </label>

                     <label className="full">
                        Precio USD
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price === 0 ? "" : form.price} onFocus={(event) => event.target.select()} onChange={(event) => setForm({ ...form, price: event.target.value === "" ? 0 : Number(event.target.value) })} required />
                     </label>

                     <label className="full">
                        Descripción
                        <textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                     </label>

                     <div className="admin-upload-field full">
                        <span className="admin-field-label">Imagen del producto</span>
                        <label className={`admin-dropzone ${draggingImage ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDraggingImage(true); }} onDragLeave={() => setDraggingImage(false)} onDrop={handleImageDrop}>
                           {form.image ? (
                              <div className="admin-upload-preview">
                                 <img src={form.image} alt="Vista previa del producto" />
                                 <div><strong>Imagen seleccionada</strong><span>Haz clic o arrastra otra para cambiarla</span></div>
                              </div>
                           ) : (
                              <><div className="admin-upload-icon"><FaUpload /></div><strong>Arrastra la imagen aquí</strong><span>o haz clic para seleccionar una imagen</span></>
                           )}
                           <input type="file" accept="image/*" onChange={(event) => handleFileSelect(event.target.files?.[0])} />
                        </label>
                     </div>
                  </div>

                  <div className="admin-editor-divider" />

                  <div className="admin-editor-size-head">
                     <div><span>TALLAS</span><h3>Disponibilidad por talla</h3></div>
                  </div>

                  {Object.keys(groupedTallas).length > 0 ? (
                     Object.entries(groupedTallas).map(([groupName, sizesGroup]) => (
                        <div key={groupName} style={{ marginBottom: "1.25rem" }}>
                           <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{groupName}</h4>
                           <div className="admin-size-grid">
                              {sizesGroup.map((talla) => {
                                 const isAvailable = form.sizes.includes(talla.nombre);
                                 return (
                                    <button type="button" key={talla.id} className={`admin-size-btn ${!isAvailable ? "off" : ""}`} onClick={() => toggleSize(talla.nombre)}>
                                       <strong>{talla.nombre}</strong><span>{isAvailable ? "Disponible" : "Agotada"}</span>
                                    </button>
                                 );
                              })}
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="admin-size-grid"><span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Cargando tallas desde la base de datos...</span></div>
                  )}

                  <label className="admin-global-stock">
                     <div><strong>Producto agotado</strong><span>Marca toda la camiseta como agotada.</span></div>
                     <input type="checkbox" checked={form.soldOut} onChange={(event) => setForm({ ...form, soldOut: event.target.checked })} />
                     <i />
                  </label>

                  <div className="admin-modal-actions">
                     <button type="button" className="admin-cancel-btn" onClick={closeEditor} disabled={saving}>Cancelar</button>
                     <button type="submit" className="admin-save-btn" disabled={saving}>{saving ? "Guardando..." : "Guardar camiseta"}</button>
                  </div>
               </form>
            </div>
         )}

         {lightboxImage && (
            <div className="admin-modal-backdrop" style={{ zIndex: 9999, backgroundColor: "rgba(0, 0, 0, 0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", animation: "lightboxFadeIn 0.25s ease-out forwards" }} onClick={() => setLightboxImage(null)}>
               <style>{`
                  @keyframes lightboxFadeIn { from { opacity: 0; } to { opacity: 1; } }
                  @keyframes lightboxZoomIn { from { opacity: 0; transform: scale(0.75); } to { opacity: 1; transform: scale(1); } }
               `}</style>
               <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center", animation: "lightboxZoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" style={{ position: "absolute", top: "-42px", right: "0px", color: "#ffffff", fontSize: "1.5rem", background: "rgba(255, 255, 255, 0.15)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s ease, transform 0.15s ease" }} onClick={() => setLightboxImage(null)} aria-label="Cerrar vista ampliada"><FaTimes /></button>
                  <img src={lightboxImage.url} alt={lightboxImage.title} style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)" }} />
                  <span style={{ color: "#ffffff", marginTop: "14px", fontSize: "1rem", fontWeight: 500, letterSpacing: "0.02em", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>{lightboxImage.title}</span>
               </div>
            </div>
         )}
      </main>
   );
}
