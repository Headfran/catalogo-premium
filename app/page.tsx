"use client";

import { useMemo, useState } from "react";
import "./styles.css";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  lineId: string;
};

const WHATSAPP_NUMBER = "584120000000";
const INSTAGRAM_URL = "https://instagram.com/kasacasport";

const productLines = [
  { id: "todas", name: "Todas" },
  { id: "retro", name: "Retro" },
  { id: "fan", name: "Fan" },
  { id: "jugador", name: "Jugador" },
  { id: "ninos", name: "Niños" },
  { id: "formula1", name: "Fórmula 1" },
  { id: "basket", name: "Basket" },
];

const products: Product[] = [
  {
    id: 1,
    name: "Camiseta Retro Classic",
    description: "Diseño clásico para verdaderos amantes del fútbol.",
    price: 25,
    image: "/productos/producto-1.jpg",
    lineId: "retro",
  },
  {
    id: 2,
    name: "Camiseta Fan Local",
    description: "Lleva tus colores contigo a todas partes.",
    price: 28,
    image: "/productos/producto-2.jpg",
    lineId: "fan",
  },
  {
    id: 3,
    name: "Camiseta Pro Player",
    description: "Rendimiento máximo y tecnología de ventilación.",
    price: 45,
    image: "/productos/producto-3.jpg",
    lineId: "jugador",
  },
  {
    id: 4,
    name: "Kit Infantil Local",
    description: "Para los más pequeños de la casa.",
    price: 30,
    image: "/productos/producto-4.jpg",
    lineId: "ninos",
  },
  {
    id: 5,
    name: "Polo Racing Team",
    description: "Siente la velocidad con nuestra línea de motor.",
    price: 35,
    image: "/productos/producto-5.jpg",
    lineId: "formula1",
  },
  {
    id: 6,
    name: "Jersey Basket Pro",
    description: "Corte holgado ideal para la cancha.",
    price: 27,
    image: "/productos/producto-6.jpg",
    lineId: "basket",
  }
];

export default function Home() {
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  
  const [activeLine, setActiveLine] = useState("todas");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const total = useMemo(
    () => cart.reduce((sum, product) => sum + product.price, 0),
    [cart]
  );

  const filteredProducts = useMemo(() => {
    if (activeLine === "todas") return products;
    return products.filter((product) => product.lineId === activeLine);
  }, [activeLine]);

  function openProduct(product: Product) {
    setSelectedProduct(product);
  }

  function closeProduct() {
    setSelectedProduct(null);
  }

  function addProduct(product: Product) {
    setCart((current) => [...current, product]);
    setSelectedProduct(null);
    setCartOpen(true);
  }

  function consultProductOnWhatsApp(product: Product) {
    const message = `Hola Kasaca Sport 👋\n\nQuiero consultar por este producto:\n\n${product.name}\nPrecio: $${product.price.toFixed(2)}\n\n¿Podrían darme más información y disponibilidad?`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function removeProduct(index: number) {
    setCart((current) => current.filter((_, i) => i !== index));
  }

  function sendWhatsApp() {
    if (!cart.length) return;

    const order = cart
      .map(
        (product, index) =>
          `${index + 1}. ${product.name} — $${product.price.toFixed(2)}`
      )
      .join("\n");

    const message = `Hola Kasaca Sport 👋\n\nQuiero realizar el siguiente pedido:\n\n${order}\n\n━━━━━━━━━━━━━━━━\nTotal: $${total.toFixed(2)}\n\nQuedo atento/a para confirmar mi pedido.`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank");
  }

  return (
    <main className="ks-page">
      <header className="ks-header">
        <div className="ks-container ks-nav">
          
          {/* --- NUEVO DISEÑO DE LOGO TIPO SKETCH --- */}
          <div className="ks-logo-wrapper">
            <img src="/k.jpg" alt="KS Logo" className="ks-header-icon" />
            <div className="ks-logo-text">Kasaca Sport</div>
          </div>
          {/* ---------------------------------------- */}

          <div className="ks-actions">
            <button
              className="ks-cart-button"
              onClick={() => setCartOpen(true)}
            >
               🛒 
              {cart.length > 0 && (
                <span className="ks-count">{cart.length}</span>
              )}
            </button>
          </div>
        </div>
      </header>
      <section className="ks-hero">
        <div className="ks-container ks-hero-grid">
          <div>
            <div className="ks-pill">
              <span className="ks-dot" />
              Nuevas colecciones disponibles
            </div>

            <h1 className="ks-title">
              ¡Viste
              <br />
              <span>Tu Pasión!</span>
            </h1>

            <p className="ks-description">
              XXXXXXXXXXXXXXXXXXXXXXXXXX
            </p>

            <div className="ks-hero-buttons">
              <a className="ks-primary" href="#catalogo">
                Explorar catálogo
              </a>

              <a
                className="ks-secondary"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver Instagram
              </a>
            </div>
          </div>

          {/* --- RECUADRO DE IMAGEN COMPLETA --- */}
          <div className="ks-visual">
            <img 
              src="/ks.jpg" 
              alt="Kasaca Sport" 
              className="ks-visual-cover" 
            />
          </div>
          {/* ----------------------------------- */}
        </div>
      </section>

      <section id="catalogo" className="ks-container ks-catalog">
        <div className="ks-catalog-head">
          <div className="ks-catalog-copy">
            <p className="ks-eyebrow">Explora nuestras colecciones</p>
            <h2 className="ks-section-title">Catálogo</h2>
            <p className="ks-section-description">
              Selecciona una línea y descubre sus productos.
            </p>
          </div>

          {/* Buscador visual: sin funcionalidad todavía */}
          <div className="ks-search" role="search">
            <svg
              className="ks-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              className="ks-search-input"
              type="search"
              placeholder="Buscar producto..."
              aria-label="Buscar producto"
            />
          </div>
        </div>

        <div className="ks-lines-container">
          {productLines.map((line) => (
            <button
              key={line.id}
              className={`ks-line-btn ${activeLine === line.id ? "active" : ""}`}
              onClick={() => setActiveLine(line.id)}
            >
              {line.name}
            </button>
          ))}
        </div>

        <div className="ks-grid">
          {filteredProducts.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", padding: "20px 0" }}>
              Próximamente más productos en esta línea.
            </p>
          ) : (
            filteredProducts.map((product) => (
              <article
                className="ks-card ks-card-clickable"
                key={product.id}
                onClick={() => openProduct(product)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openProduct(product);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Ver detalles de ${product.name}`}
              >
                <div className="ks-image">
                  <img src={product.image} alt={product.name} />
                  <div className="ks-badge">Kasaca Sport</div>
                  <div className="ks-view-product">
                    Ver detalles <span aria-hidden="true">↗</span>
                  </div>
                </div>

                <div className="ks-info">
                  <h3 className="ks-product-name">{product.name}</h3>

                  <p className="ks-product-description">
                    {product.description}
                  </p>

                  <div className="ks-product-bottom">
                    <div>
                      <div className="ks-price-label">Precio</div>
                      <div className="ks-price">
                        ${product.price.toFixed(2)}
                      </div>
                    </div>

                    <button
                      className="ks-add"
                      onClick={(event) => {
                        event.stopPropagation();
                        addProduct(product);
                      }}
                      aria-label={`Agregar ${product.name}`}
                    >
                      <span className="ks-add-text">Agregar</span>
                      <span aria-hidden="true">+</span>
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="ks-container">
        <div className="ks-social">
          <p className="ks-eyebrow">Síguenos</p>

          <h3>
            Kasaca Sport
            <br />
            también está en Instagram.
          </h3>

          <a
            className="ks-primary"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            @xxxxxxx →
          </a>
        </div>
      </section>

      <footer className="ks-footer">
        <p className="ks-thanks">GRACIAS.</p>

        <p className="ks-footer-text">
          Más que una marca, somos apasionados por el deporte igual que tú. ¡Gracias por confiar en nosotros desde cada rincón de Venezuela y acompañarnos en este camino!
        </p>

        <div className="ks-copy">KASACA SPORT © 2026</div>
      </footer>

      {cart.length > 0 && !cartOpen && (
        <button
          className="ks-floating"
          onClick={() => setCartOpen(true)}
        >
          🛒 {cart.length}{" "}
          {cart.length === 1 ? "producto" : "productos"} • $
          {total.toFixed(2)}
        </button>
      )}

      {selectedProduct && (
        <div
          className="ks-product-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProduct();
            }
          }}
        >
          <article
            className="ks-product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ks-product-modal-title"
          >
            <button
              className="ks-product-modal-close"
              onClick={closeProduct}
              aria-label="Cerrar detalles del producto"
            >
              ×
            </button>

            <div className="ks-product-modal-image-wrap">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="ks-product-modal-image"
              />
              <span className="ks-product-modal-badge">Kasaca Sport</span>
            </div>

            <div className="ks-product-modal-content">
              <p className="ks-eyebrow">Detalle del producto</p>

              <h2 id="ks-product-modal-title" className="ks-product-modal-title">
                {selectedProduct.name}
              </h2>

              <p className="ks-product-modal-description">
                {selectedProduct.description}
              </p>

              <div className="ks-product-modal-price">
                ${selectedProduct.price.toFixed(2)}
              </div>

              <div className="ks-product-modal-actions">
                <button
                  className="ks-product-modal-whatsapp"
                  onClick={() => consultProductOnWhatsApp(selectedProduct)}
                >
                  <svg
                    className="ks-whatsapp-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M20.52 3.48A11.79 11.79 0 0 0 12.01 0C5.5 0 .2 5.3.2 11.81c0 2.08.54 4.11 1.57 5.9L.1 24l6.46-1.69a11.84 11.84 0 0 0 5.45 1.33h.01c6.51 0 11.81-5.3 11.81-11.81 0-3.15-1.22-6.12-3.31-8.35ZM12.02 21.7h-.01a9.84 9.84 0 0 1-5.02-1.37l-.36-.22-3.83 1 1.02-3.73-.24-.38a9.83 9.83 0 0 1-1.51-5.19C2.07 6.36 6.53 1.9 12.02 1.9c2.66 0 5.16 1.04 7.04 2.92a9.89 9.89 0 0 1 2.92 7.03c0 5.49-4.47 9.85-9.96 9.85Zm5.43-7.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.89-.79-1.5-1.77-1.68-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.5 1.7.64.71.23 1.35.2 1.86.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
                    />
                  </svg>
                  Consultar por WhatsApp
                </button>

                <button
                  className="ks-product-modal-cart"
                  onClick={() => addProduct(selectedProduct)}
                >
                  Agregar al carrito
                  <span aria-hidden="true">+</span>
                </button>
              </div>
            </div>
          </article>
        </div>
      )}

      {cartOpen && (
        <div
          className="ks-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCartOpen(false);
            }
          }}
        >
          <aside className="ks-panel">
            <div className="ks-panel-header">
              <div>
                <p className="ks-eyebrow">Tu selección</p>
                <h2 className="ks-panel-title">Carrito</h2>
              </div>

              <button
                className="ks-close"
                onClick={() => setCartOpen(false)}
                aria-label="Cerrar carrito"
              >
                ×
              </button>
            </div>

            <div className="ks-items">
              {cart.length === 0 ? (
                <div className="ks-empty">
                  <div style={{ fontSize: 42 }}>🛒</div>
                  <strong
                    style={{
                      color: "#fff",
                      marginTop: 14,
                      fontSize: 14,
                    }}
                  >
                    Tu carrito está vacío
                  </strong>
                  <div style={{ marginTop: 8 }}>
                    Agrega productos del catálogo para comenzar tu pedido.
                  </div>
                </div>
              ) : (
                cart.map((product, index) => (
                  <div className="ks-item" key={`${product.id}-${index}`}>
                    <img src={product.image} alt={product.name} />

                    <div className="ks-item-info">
                      <div className="ks-item-name">{product.name}</div>
                      <div className="ks-item-price">
                        ${product.price.toFixed(2)}
                      </div>
                    </div>

                    <button
                      className="ks-remove"
                      onClick={() => removeProduct(index)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="ks-panel-footer">
              <div className="ks-total">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>

              <button
                className="ks-whatsapp"
                onClick={sendWhatsApp}
                disabled={cart.length === 0}
              >
                Enviar pedido por WhatsApp →
              </button>

              <p className="ks-note">
                Tu selección se enviará directamente a Kasaca Sport para
                confirmar el pedido.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}