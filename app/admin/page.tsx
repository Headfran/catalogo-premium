"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import "./admin.css";

type LineId =
  | "retro"
  | "fan"
  | "jugador"
  | "ninos"
  | "formula1"
  | "basket"
  | "beisbol";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  priceVES: number;
  image: string;
  lineId: LineId;
  sizes: string[];
  unavailableSizes: string[];
  soldOut: boolean;
};

const ADULT_SIZES = ["S", "M", "L", "XL", "2XL"];
const KIDS_SIZES = ["8", "10", "12", "14", "16"];
const STORAGE_KEY = "kasaca-admin-products";

const LINES: { id: LineId; name: string }[] = [
  { id: "retro", name: "Retro" },
  { id: "fan", name: "Fan" },
  { id: "jugador", name: "Jugador" },
  { id: "ninos", name: "Niños" },
  { id: "formula1", name: "Fórmula 1" },
  { id: "basket", name: "Basket" },
  { id: "beisbol", name: "Béisbol" },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Camiseta Retro Classic",
    description: "Diseño clásico para verdaderos amantes del fútbol.",
    price: 25,
    priceVES: 0,
    image: "/productos/producto-1.jpg",
    lineId: "retro",
    sizes: ADULT_SIZES,
    unavailableSizes: [],
    soldOut: false,
  },
  {
    id: 2,
    name: "Camiseta Fan Local",
    description: "Lleva tus colores contigo a todas partes.",
    price: 28,
    priceVES: 0,
    image: "/productos/producto-2.jpg",
    lineId: "fan",
    sizes: ADULT_SIZES,
    unavailableSizes: [],
    soldOut: false,
  },
  {
    id: 3,
    name: "Camiseta Pro Player",
    description: "Rendimiento máximo y tecnología de ventilación.",
    price: 45,
    priceVES: 0,
    image: "/productos/producto-3.jpg",
    lineId: "jugador",
    sizes: ADULT_SIZES,
    unavailableSizes: [],
    soldOut: false,
  },
  {
    id: 4,
    name: "Kit Infantil Local",
    description: "Para los más pequeños de la casa.",
    price: 30,
    priceVES: 0,
    image: "/productos/producto-4.jpg",
    lineId: "ninos",
    sizes: KIDS_SIZES,
    unavailableSizes: [],
    soldOut: false,
  },
  {
    id: 5,
    name: "Polo Racing Team",
    description: "Siente la velocidad con nuestra línea de motor.",
    price: 35,
    priceVES: 0,
    image: "/productos/producto-5.jpg",
    lineId: "formula1",
    sizes: ADULT_SIZES,
    unavailableSizes: [],
    soldOut: false,
  },
  {
    id: 6,
    name: "Jersey Basket Pro",
    description: "Corte holgado ideal para la cancha.",
    price: 27,
    priceVES: 0,
    image: "/productos/producto-6.jpg",
    lineId: "basket",
    sizes: ADULT_SIZES,
    unavailableSizes: [],
    soldOut: false,
  },
];

type FormState = Omit<Product, "id">;

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: 0,
  priceVES: 0,
  image: "",
  lineId: "retro",
  sizes: ADULT_SIZES,
  unavailableSizes: [],
  soldOut: false,
};

function sizesForLine(line: LineId) {
  return line === "ninos" ? KIDS_SIZES : ADULT_SIZES;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [lineFilter, setLineFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [draggingImage, setDraggingImage] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      const matchesLine =
        lineFilter === "all" || product.lineId === lineFilter;

      const matchesSize =
        sizeFilter === "all" ||
        product.sizes.includes(sizeFilter) &&
          !product.unavailableSizes.includes(sizeFilter);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "sold" ? product.soldOut : !product.soldOut);

      return matchesSearch && matchesLine && matchesSize && matchesStatus;
    });
  }, [products, search, lineFilter, sizeFilter, statusFilter]);

  function persist(next: Product[]) {
    setProducts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function openNew() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      sizes: ADULT_SIZES,
      unavailableSizes: [],
    });
    setMessage("");
    setEditorOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      priceVES: product.priceVES,
      image: product.image,
      lineId: product.lineId,
      sizes: product.sizes,
      unavailableSizes: product.unavailableSizes,
      soldOut: product.soldOut,
    });
    setMessage("");
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
    setMessage("");
  }

  function changeLine(lineId: LineId) {
    const sizes = sizesForLine(lineId);

    setForm((current) => ({
      ...current,
      lineId,
      sizes,
      unavailableSizes: current.unavailableSizes.filter((size) =>
        sizes.includes(size)
      ),
    }));
  }

  function toggleSize(size: string) {
    setForm((current) => ({
      ...current,
      unavailableSizes: current.unavailableSizes.includes(size)
        ? current.unavailableSizes.filter((item) => item !== size)
        : [...current.unavailableSizes, size],
    }));
  }

  function setImageFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Selecciona una imagen válida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        image: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleImageDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingImage(false);
    setImageFile(event.dataTransfer.files?.[0]);
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.description.trim()) {
      setMessage("Completa el nombre y la descripción.");
      return;
    }

    if (form.price <= 0 || form.priceVES < 0) {
      setMessage("Revisa los precios del producto.");
      return;
    }

    const next =
      editingId === null
        ? [...products, { ...form, id: Date.now() }]
        : products.map((product) =>
            product.id === editingId ? { ...product, ...form } : product
          );

    persist(next);
    setMessage(editingId === null ? "Producto agregado." : "Cambios guardados.");
    setTimeout(closeEditor, 350);
  }

  function deleteProduct(product: Product) {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return;

    persist(products.filter((item) => item.id !== product.id));
  }

  function toggleSoldOut(product: Product) {
    persist(
      products.map((item) =>
        item.id === product.id
          ? { ...item, soldOut: !item.soldOut }
          : item
      )
    );
  }

  const unavailableCount = products.filter((product) => product.soldOut).length;
  const allVisibleSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedIds.includes(product.id));

  function toggleSelected(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredProducts.some((product) => product.id === id))
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([...current, ...filteredProducts.map((product) => product.id)]),
    ]);
  }

  function deleteSelected() {
    if (!selectedIds.length) return;
    if (!window.confirm(`¿Eliminar ${selectedIds.length} producto(s) seleccionado(s)?`)) return;

    const next = products.filter((product) => !selectedIds.includes(product.id));
    persist(next);
    setSelectedIds([]);
    setMessage("Productos eliminados.");
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
          <button type="button" className="active">
            <span>▥</span> Stok de camisetas
          </button>

          <button
            type="button"
            className="admin-exit-item"
            onClick={() => {
              window.location.href = "http://localhost:3000/login";
            }}
          >
            <span>↪</span> Salir
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <small>KASACA SPORT © 2026</small>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div>
            
          </div>

          <div className="admin-top-actions">
            <button type="button" className="admin-icon-btn" aria-label="Notificaciones">
              
            </button>
            <button type="button" className="admin-avatar" aria-label="Administrador">
              A
            </button>
          </div>
        </header>

        <div className="admin-main">
          <div className="admin-title-row">
            <div>
              <h1>Gestión de Camisetas</h1>
              <p>Administra productos, precios, tallas y disponibilidad.</p>
            </div>

            <button type="button" className="admin-add-btn" onClick={openNew}>
              + Subir Nueva Camiseta
            </button>
          </div>

          <div className="admin-toolbar">
            <label className="admin-search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar camiseta..."
              />
            </label>

            <select
              value={lineFilter}
              onChange={(event) => setLineFilter(event.target.value)}
            >
              <option value="all">Categoría</option>
              {LINES.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>

            <select
              value={sizeFilter}
              onChange={(event) => setSizeFilter(event.target.value)}
            >
              <option value="all">Talla</option>
              {["S", "M", "L", "XL", "2XL", "8", "10", "12", "14", "16"].map(
                (size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                )
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Estado</option>
              <option value="available">En Stock</option>
              <option value="sold">Agotada</option>
            </select>

            {selectedIds.length > 0 && (
              <button
                type="button"
                className="admin-bulk-delete"
                onClick={deleteSelected}
              >
                <span aria-hidden="true">⌫ </span>
                Eliminar {selectedIds.length}
              </button>
            )}
          </div>

          <section className="admin-table-card">
            <div className="admin-table">
              <div className="admin-table-head">
                <div>
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                  />
                </div>
                <div>Imagen</div>
                <div>Nombre de la Camiseta</div>
                <div>Sección</div>
                <div>Precio USD</div>
                <div>Precio Bs</div>
                <div>Descripción</div>
                <div>Estado (Agotado)</div>
                <div>Acciones</div>
              </div>

              {filteredProducts.map((product) => (
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
                    />
                  </div>

                  <div className="admin-name-cell">
                    <strong>{product.name}</strong>
                    
                  </div>

                  <div className="admin-category">
                    {LINES.find((line) => line.id === product.lineId)?.name}
                  </div>

                  <div className="admin-price-cell">${product.price.toFixed(2)}</div>

                  <div className="admin-price-cell">
                    Bs. {product.priceVES?.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                    })}
                  </div>

                  <div className="admin-description-cell">
                    {product.description}
                  </div>

                  <div>
                    <button
                      type="button"
                      className={`admin-stock-toggle ${
                        product.soldOut ? "sold" : "available"
                      }`}
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
                      ✎
                    </button>

                    <button
                      type="button"
                      className="admin-delete-btn"
                      onClick={() => deleteProduct(product)}
                      title="Eliminar"
                      aria-label={`Eliminar ${product.name}`}
                    >
                      🗑
                    </button>
                  </div>
                </article>
              ))}

              {!filteredProducts.length && (
                <div className="admin-empty">
                  No hay productos que coincidan con los filtros.
                </div>
              )}
            </div>

            <div className="admin-table-footer">
              <span>Mostrando {filteredProducts.length} de {products.length} productos</span>
              <div>
                {selectedIds.length > 0 && <strong>{selectedIds.length} seleccionados · </strong>}
                <strong>{products.length}</strong> Productos ·{" "}
                <strong>{unavailableCount}</strong> Agotados
              </div>
            </div>
          </section>
        </div>
      </section>

      {editorOpen && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeEditor();
        }}>
          <form className="admin-editor-modal" onSubmit={saveProduct}>
            <div className="admin-modal-head">
              <div>
                <span>{editingId === null ? "NUEVA CAMISETA" : "EDITAR CAMISETA"}</span>
                <h2>{editingId === null ? "Subir nueva camiseta" : "Modificar camiseta"}</h2>
              </div>

              <button type="button" className="admin-close-btn" onClick={closeEditor}>
                ×
              </button>
            </div>

            <div className="admin-editor-grid">
              <label>
                Nombre
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>

              <label>
                Sección
                <select
                  value={form.lineId}
                  onChange={(event) => changeLine(event.target.value as LineId)}
                >
                  {LINES.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Precio USD
                <input
                  type="text"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: Number(event.target.value) })
                  }
                />
              </label>

              <label>
                Precio Bs
                <input
                  type="text"
                  min="0"
                  step="0.01"
                  value={form.priceVES}
                  onChange={(event) =>
                    setForm({ ...form, priceVES: Number(event.target.value) })
                  }
                />
              </label>

              <label className="full">
                Descripción
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>

              <div className="admin-upload-field full">
                <span className="admin-field-label">Imagen del producto</span>
                <label
                  className={`admin-dropzone ${draggingImage ? "dragging" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDraggingImage(true);
                  }}
                  onDragLeave={() => setDraggingImage(false)}
                  onDrop={handleImageDrop}
                >
                  {form.image ? (
                    <div className="admin-upload-preview">
                      <img src={form.image} alt="Vista previa del producto" />
                      <div>
                        <strong>Imagen lista</strong>
                        <span>Haz clic o arrastra otra para cambiarla</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="admin-upload-icon">↑</div>
                      <strong>Arrastra la imagen aquí</strong>
                      <span>o haz clic para seleccionar una imagen</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <div className="admin-editor-divider" />

            <div className="admin-editor-size-head">
              <div>
                <span>TALLAS</span>
                <h3>Disponibilidad por talla</h3>
              </div>

              <small>
                {form.lineId === "ninos"
                  ? "Niños: 8 · 10 · 12 · 14 · 16"
                  : "Adultos: S · M · L · XL · 2XL"}
              </small>
            </div>

            <div className="admin-size-grid">
              {form.sizes.map((size) => {
                const unavailable = form.unavailableSizes.includes(size);

                return (
                  <button
                    type="button"
                    key={size}
                    className={`admin-size-btn ${unavailable ? "off" : ""}`}
                    onClick={() => toggleSize(size)}
                  >
                    <strong>{size}</strong>
                    <span>{unavailable ? "Agotada" : "Disponible"}</span>
                  </button>
                );
              })}
            </div>

            <label className="admin-global-stock">
              <div>
                <strong>Producto agotado</strong>
                <span>Marca toda la camiseta como agotada.</span>
              </div>

              <input
                type="checkbox"
                checked={form.soldOut}
                onChange={(event) =>
                  setForm({ ...form, soldOut: event.target.checked })
                }
              />

              <i />
            </label>

            {message && <div className="admin-message">{message}</div>}

            <div className="admin-modal-actions">
              <button type="button" className="admin-cancel-btn" onClick={closeEditor}>
                Cancelar
              </button>
              <button type="submit" className="admin-save-btn">
                Guardar camiseta
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
