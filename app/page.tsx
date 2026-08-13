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

  const total = useMemo(
    () => cart.reduce((sum, product) => sum + product.price, 0),
    [cart]
  );

  const filteredProducts = useMemo(() => {
    if (activeLine === "todas") return products;
    return products.filter((product) => product.lineId === activeLine);
  }, [activeLine]);

  function addProduct(product: Product) {
    setCart((current) => [...current, product]);
    setCartOpen(true);
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
            <a
              className="ks-instagram"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>

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
              Descubre la colección KasacaSport. Camisetas, conjuntos y
              diseños seleccionados para quienes viven el deporte y llevan
              su pasión con orgullo.
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
              <article className="ks-card" key={product.id}>
                <div className="ks-image">
                  <img src={product.image} alt={product.name} />
                  <div className="ks-badge">KasacaSport</div>
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
                      onClick={() => addProduct(product)}
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
            KasacaSport
            <br />
            también está en Instagram.
          </h3>

          <a
            className="ks-primary"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            @kasacasport →
          </a>
        </div>
      </section>

      <footer className="ks-footer">
        <p className="ks-thanks">GRACIAS.</p>

        <p className="ks-footer-text">
          Más que una marca, somos apasionados por el deporte igual que tú. ¡Gracias por confiar en nosotros desde cada rincón de Venezuela y acompañarnos en este camino!
        </p>

        <div className="ks-copy">KASACASPORT © 2026</div>
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
                Tu selección se enviará directamente a KasacaSport para
                confirmar el pedido.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}