"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Product, LineItem } from "@/lib/catalog";
import {
   FaShoppingCart,
   FaUser,
   FaSearch,
   FaPlus,
   FaTimes,
   FaWhatsapp,
   FaInstagram,
   FaArrowRight,
   FaChevronLeft,
   FaChevronRight,
   FaExternalLinkAlt,
   FaTrash,
   FaBan
} from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";

import "./styles.css";

type CartItem = Product & {
   size: string;
};

type GroupedCartItem = {
   product: Product;
   size: string;
   quantity: number;
};

type CarouselSlide = {
   id: "logo" | "futbol" | "formula1" | "basket" | "beisbol";
   label: string;
   eyebrow?: string;
   image: string;
};

const WHATSAPP_NUMBER = "+584220335656";
const INSTAGRAM_URL = "https://www.instagram.com/kasaca_sport?igsh=dHplMW5kOXc3OXdv&utm_source=qr";
const TIKTOK_URL = "https://www.tiktok.com/@kasaca.sport?_r=1&_t=ZS-991uaLEpEH9";
const ITEMS_PER_PAGE = 12;

const carouselSlides: CarouselSlide[] = [
   {
      id: "logo",
      label: "Kasaca Sport",
      eyebrow: "Kasaca Sport",
      image: "/ks.jpg",
   },
   {
      id: "futbol",
      label: "Fútbol",
      image: "/f.jpg",
   },
   {
      id: "formula1",
      label: "Fórmula 1",
      eyebrow: "Formula Racing",
      image: "/f1.jpg",
   },
   {
      id: "basket",
      label: "Basket",
      image: "/f2.jpg",
   },
   {
      id: "beisbol",
      label: "Béisbol",
      image: "/f3.jpg",
   },
];

interface CatalogClientProps {
   initialProducts: Product[];
   lines: LineItem[];
   exchangeRate?: number;
}

function formatBs(amount: number): string {
   return new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
   }).format(amount);
}

function isFootballLine(lineName: string): boolean {
   if (!lineName) return false;
   const name = lineName.toLowerCase();
   return (
      name.includes("retro") ||
      name.includes("fan") ||
      name.includes("jugador") ||
      name.includes("fútbol") ||
      name.includes("futbol")
   );
}

export default function CatalogClient({
   initialProducts,
   lines,
   exchangeRate = 0
}: CatalogClientProps) {
   const [cart, setCart] = useState<CartItem[]>([]);
   const [cartOpen, setCartOpen] = useState(false);

   const [activeLine, setActiveLine] = useState("todas");
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
   const [selectedSize, setSelectedSize] = useState("");

   const [currentPage, setCurrentPage] = useState(1);

   const [carouselIndex, setCarouselIndex] = useState(0);
   const [carouselPaused, setCarouselPaused] = useState(false);
   const carouselTouchStartX = useRef<number | null>(null);
   const carouselSwiped = useRef(false);

   useEffect(() => {
      if (carouselPaused) return;

      const timer = window.setInterval(() => {
         setCarouselIndex((current) => (current + 1) % carouselSlides.length);
      }, 4200);

      return () => window.clearInterval(timer);
   }, [carouselPaused]);

   const activeCarouselSlide = carouselSlides[carouselIndex];

   function handleCarouselFilter(slide: CarouselSlide) {
      if (slide.id === "futbol") {
         setActiveLine("futbol");
      } else if (slide.id === "logo") {
         setActiveLine("todas");
      } else {
         const lineMatch = lines.find((l) =>
            l.name.toLowerCase().includes(slide.label.toLowerCase()) ||
            slide.label.toLowerCase().includes(l.name.toLowerCase())
         );
         setActiveLine(lineMatch ? lineMatch.id : "todas");
      }

      window.setTimeout(() => {
         document.getElementById("catalogo")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
         });
      }, 40);
   }

   function handleCarouselTouchStart(event: React.TouchEvent<HTMLDivElement>) {
      if (window.matchMedia("(max-width: 600px)").matches) {
         carouselTouchStartX.current = event.touches[0]?.clientX ?? null;
         carouselSwiped.current = false;
      }
   }

   function handleCarouselTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
      if (!window.matchMedia("(max-width: 600px)").matches) return;

      const startX = carouselTouchStartX.current;
      const endX = event.changedTouches[0]?.clientX;

      if (startX === null || endX === undefined) return;

      const distance = endX - startX;
      if (Math.abs(distance) < 50) return;

      carouselSwiped.current = true;

      if (distance < 0) {
         setCarouselIndex((current) => (current + 1) % carouselSlides.length);
      } else {
         setCarouselIndex((current) => (current - 1 + carouselSlides.length) % carouselSlides.length);
      }

      window.setTimeout(() => {
         carouselSwiped.current = false;
      }, 350);

      carouselTouchStartX.current = null;
   }

   const groupedCart = useMemo(() => {
      const map = new Map<string, GroupedCartItem>();
      cart.forEach((item) => {
         const key = `${item.id}-${item.size}`;
         if (map.has(key)) {
            map.get(key)!.quantity += 1;
         } else {
            map.set(key, { product: item, size: item.size, quantity: 1 });
         }
      });
      return Array.from(map.values());
   }, [cart]);

   const total = useMemo(
      () => cart.reduce((sum, product) => sum + product.price, 0),
      [cart]
   );

   const filteredProducts = useMemo(() => {
      return initialProducts.filter((product) => {
         let matchesLine = false;

         if (activeLine === "todas") {
            matchesLine = true;
         } else if (activeLine === "futbol") {
            matchesLine =
               isFootballLine(product.lineName) ||
               product.lineNames.some(isFootballLine);
         } else {
            matchesLine =
               product.lineId === activeLine ||
               product.lineIds.includes(activeLine);
         }

         const q = searchQuery.trim().toLowerCase();
         const matchesSearch =
            !q ||
            product.name.toLowerCase().includes(q) ||
            product.description.toLowerCase().includes(q) ||
            product.lineName.toLowerCase().includes(q);

         return matchesLine && matchesSearch;
      });
   }, [initialProducts, activeLine, searchQuery]);

   useEffect(() => {
      setCurrentPage(1);
   }, [activeLine, searchQuery]);

   const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

   const paginatedProducts = useMemo(() => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
   }, [filteredProducts, currentPage]);

   function changePage(newPage: number) {
      if (newPage < 1 || newPage > totalPages) return;
      setCurrentPage(newPage);

      document.getElementById("catalogo")?.scrollIntoView({
         behavior: "smooth",
         block: "start",
      });
   }

   function openProduct(product: Product) {
      setSelectedProduct(product);
      setSelectedSize(product.sizes[0] ?? "");
   }

   function closeProduct() {
      setSelectedProduct(null);
      setSelectedSize("");
   }

   function addProduct(product: Product, size = selectedSize || product.sizes[0] || "") {
      if (product.soldOut) return;
      setCart((current) => [...current, { ...product, size }]);
      setSelectedProduct(null);
      setSelectedSize("");
      setCartOpen(true);
   }

   function consultProductOnWhatsApp(product: Product) {
      const size = selectedSize || product.sizes[0] || "Sin talla seleccionada";
      const bsPrice = exchangeRate > 0 ? ` (Bs. ${formatBs(product.price * exchangeRate)})` : "";

      const imageUrl = product.image.startsWith("http")
         ? product.image
         : `${typeof window !== "undefined" ? window.location.origin : ""}${product.image}`;

      const message = `👋 *CONSULTA DE PRODUCTO - KASACA SPORT*\n\nHola, quisiera más información sobre este producto:\n\n👕 *${product.name}*\n• *Precio:* $${product.price.toFixed(2)}\n\n¿Tienen disponibilidad para envío/entrega inmediata?`;

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
   }

   function removeProduct(id: number, size: string) {
      setCart((current) => {
         const index = current.findIndex((item) => item.id === id && item.size === size);
         if (index === -1) return current;
         const updated = [...current];
         updated.splice(index, 1);
         return updated;
      });
   }

   function sendWhatsApp() {
      if (!groupedCart.length) return;

      const origin = typeof window !== "undefined" ? window.location.origin : "";

      const itemsText = groupedCart
         .map((item, index) => {
            const subtotalUsd = item.product.price * item.quantity;
            const unitBs = exchangeRate > 0 ? ` (Bs. ${formatBs(item.product.price * exchangeRate)})` : "";
            const subBs = exchangeRate > 0 ? ` (Bs. ${formatBs(subtotalUsd * exchangeRate)})` : "";

            const imageUrl = item.product.image.startsWith("http")
               ? item.product.image
               : `${origin}${item.product.image}`;

            let block = `${index + 1}️⃣ *${item.product.name}*\n`;
            block += `   • *Cantidad:* ${item.quantity}\n`;
            block += `   • *Talla:* ${item.size}\n`;
            block += `   • *Precio Unit.:* $${item.product.price.toFixed(2)}${unitBs}\n`;
            block += `   • *Subtotal:* $${subtotalUsd.toFixed(2)}${subBs}\n`;
            block += `   🖼️ *Foto:* ${imageUrl}`;

            return block;
         })
         .join("\n\n");

      const totalBsText = exchangeRate > 0 ? `\n🇻🇪 *TOTAL EN BS.:* Bs. ${formatBs(total * exchangeRate)}` : "";
      const rateText = exchangeRate > 0 ? `\n📊 *Tasa Ref. BCV:* Bs. ${formatBs(exchangeRate)} / $` : "";

      const message = `🛍️ *NUEVO PEDIDO - KASACA SPORT*\n━━━━━━━━━━━━━━━━━━━━━\n\n📌 *PRODUCTOS SOLICITADOS:*\n\n${itemsText}\n\n━━━━━━━━━━━━━━━━━━━━━\n💵 *TOTAL USD:* $${total.toFixed(2)}${totalBsText}${rateText}\n━━━━━━━━━━━━━━━━━━━━━\n\n📍 *DATOS PARA LA ENTREGA:*\n• *Nombre y Apellido:* \n• *Cédula:* \n• *Teléfono:* \n• *Ciudad / Ubicación:* \n• *Método de Entrega:* (Entrega Gratis Maracay / Envío Nacional)\n\nQuedo atento/a para confirmar el pago y coordinar. ¡Gracias!`;

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
   }

   return (
      <main className="ks-page">
         {/* HEADER */}
         <header className="ks-header">
            <div className="ks-container ks-nav">
               <div className="ks-logo-wrapper">
                  <img src="/k.jpg" alt="KS Logo" className="ks-header-icon" />
                  <div className="ks-logo-text">Kasaca Sport</div>
               </div>

               <div className="ks-actions">
                  <a
                     className="ks-user-button"
                     href="/login"
                     aria-label="Iniciar sesión"
                     title="Iniciar sesión"
                  >
                     <FaUser />
                  </a>

                  <button
                     className="ks-cart-button"
                     onClick={() => setCartOpen(true)}
                     aria-label="Abrir carrito"
                  >
                     <FaShoppingCart />
                     {cart.length > 0 && <span className="ks-count">{cart.length}</span>}
                  </button>
               </div>
            </div>
         </header>

         {/* HERO */}
         <section className="ks-hero">
            <div className="ks-container ks-hero-grid">
               <div>
                  <div className="ks-pill">
                     <span className="ks-dot" />
                     Colecciones disponibles
                  </div>

                  <h1 className="ks-title">
                     ¡Viste
                     <br />
                     <span>Tu Pasión!</span>
                  </h1>

                  <p className="ks-description">
                     Somos Tienda Online, Ubicados en Maracay, Estado Aragua.
                     ¡Realizamos entregas GRATIS en la Zona Centro de Maracay, y Envíos a Nivel Nacional!
                  </p>

                  <div className="ks-hero-buttons">
                     <a className="ks-primary" href="#catalogo">
                        Explorar catálogo <FaArrowRight style={{ marginLeft: 6, fontSize: 12 }} />
                     </a>

                     <a
                        className="ks-secondary"
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                     >
                        <FaInstagram style={{ marginRight: 6 }} /> Ver Instagram
                     </a>
                  </div>
               </div>

               {/* CARRUSEL */}
               <div
                  className="ks-visual ks-carousel"
                  onMouseEnter={() => setCarouselPaused(true)}
                  onMouseLeave={() => setCarouselPaused(false)}
                  onTouchStart={handleCarouselTouchStart}
                  onTouchEnd={handleCarouselTouchEnd}
               >
                  <button
                     type="button"
                     className="ks-carousel-main-action"
                     onClick={() => handleCarouselFilter(activeCarouselSlide)}
                  >
                     <div className="ks-carousel-media">
                        <img
                           key={activeCarouselSlide.id}
                           src={activeCarouselSlide.image}
                           alt={activeCarouselSlide.label}
                           className="ks-visual-cover ks-carousel-image"
                        />
                     </div>

                     <div className="ks-carousel-shade" />

                     {activeCarouselSlide.id !== "logo" && (
                        <div className="ks-carousel-copy">
                           {activeCarouselSlide.eyebrow && (
                              <span className="ks-carousel-eyebrow">
                                 {activeCarouselSlide.eyebrow}
                              </span>
                           )}
                           <strong>{activeCarouselSlide.label}</strong>
                           <span className="ks-carousel-cta">
                              Explorar colección <FaExternalLinkAlt style={{ marginLeft: 4, fontSize: 10 }} />
                           </span>
                        </div>
                     )}
                  </button>

                  <button
                     type="button"
                     className="ks-carousel-arrow ks-carousel-arrow-left"
                     onClick={(e) => {
                        e.stopPropagation();
                        setCarouselIndex((curr) => (curr - 1 + carouselSlides.length) % carouselSlides.length);
                     }}
                     aria-label="Anterior"
                  >
                     <FaChevronLeft />
                  </button>

                  <button
                     type="button"
                     className="ks-carousel-arrow ks-carousel-arrow-right"
                     onClick={(e) => {
                        e.stopPropagation();
                        setCarouselIndex((curr) => (curr + 1) % carouselSlides.length);
                     }}
                     aria-label="Siguiente"
                  >
                     <FaChevronRight />
                  </button>

                  <div className="ks-carousel-dots">
                     {carouselSlides.map((slide, index) => (
                        <span
                           key={slide.id}
                           className={`ks-carousel-dot ${index === carouselIndex ? "active" : ""}`}
                        />
                     ))}
                  </div>
               </div>
            </div>
         </section>

         {/* CATÁLOGO */}
         <section id="catalogo" className="ks-container ks-catalog">
            <div className="ks-catalog-head">
               <div className="ks-catalog-copy">
                  <p className="ks-eyebrow">Explora nuestras colecciones</p>
                  <h2 className="ks-section-title">Catálogo</h2>
                  <p className="ks-section-description">
                     {activeLine === "futbol"
                        ? "Fútbol · Retro · Fan · Jugador"
                        : "Selecciona una línea y descubre sus productos."}
                  </p>
               </div>

               {/* BUSCADOR INTERACTIVO */}
               <div className="ks-search" role="search">
                  <FaSearch className="ks-search-icon" />
                  <input
                     className="ks-search-input"
                     type="search"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Buscar camiseta..."
                     aria-label="Buscar camiseta"
                  />
               </div>
            </div>

            {/* BOTONES DE LÍNEAS */}
            <div className="ks-lines-container">
               {lines.map((line) => {
                  const isSelected = activeLine === line.id;
                  const isGroupActive = activeLine === "futbol" && isFootballLine(line.name);

                  return (
                     <button
                        key={line.id}
                        className={`ks-line-btn ${isSelected ? "active" : ""} ${isGroupActive ? "group-active" : ""}`}
                        onClick={() => setActiveLine(line.id)}
                     >
                        {line.name}
                     </button>
                  );
               })}
            </div>

            {/* GRID DE PRODUCTOS */}
            <div className="ks-grid">
               {paginatedProducts.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.5)", padding: "30px 0", gridColumn: "1/-1" }}>
                     Próximamente más productos en esta línea.
                  </p>
               ) : (
                  paginatedProducts.map((product) => (
                     <article
                        className={`ks-card ks-card-clickable ${product.soldOut ? "sold-out" : ""}`}
                        key={product.id}
                        onClick={() => openProduct(product)}
                     >
                        <div className="ks-image">
                           <img src={product.image} alt={product.name} />
                           <div className="ks-badge">Kasaca Sport</div>
                           {product.soldOut ? (
                              <div className="ks-sold-out-badge">Agotada</div>
                           ) : (
                              <div className="ks-view-product">
                                 Ver detalles <FaExternalLinkAlt style={{ marginLeft: 4, fontSize: 10 }} />
                              </div>
                           )}
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
                                 {exchangeRate > 0 && (
                                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: "700" }}>
                                       Bs. {formatBs(product.price * exchangeRate)}
                                    </div>
                                 )}
                              </div>

                              <button
                                 className="ks-add"
                                 disabled={product.soldOut}
                                 onClick={(event) => {
                                    event.stopPropagation();
                                    addProduct(product);
                                 }}
                              >
                                 <span className="ks-add-text">
                                    {product.soldOut ? "Agotada" : "Agregar"}
                                 </span>
                                 {product.soldOut ? (
                                    <FaBan style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }} />
                                 ) : (
                                    <FaPlus style={{ fontSize: 10 }} />
                                 )}
                              </button>
                           </div>
                        </div>
                     </article>
                  ))
               )}
            </div>

            {/* PAGINACIÓN COMPONENTE */}
            {totalPages > 1 && (
               <div className="ks-pagination-wrap">
                  <div className="ks-pagination-info">
                     Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} de {filteredProducts.length} productos
                  </div>

                  <div className="ks-pagination">
                     <button
                        className="ks-page-btn"
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                     >
                        Anterior
                     </button>

                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                           key={page}
                           className={`ks-page-btn ${currentPage === page ? "active" : ""}`}
                           onClick={() => changePage(page)}
                        >
                           {page}
                        </button>
                     ))}

                     <button
                        className="ks-page-btn"
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                     >
                        Siguiente
                     </button>
                  </div>
               </div>
            )}
         </section>

         {/* SECCIÓN TIKTOK */}
         <section className="ks-container">
            <div className="ks-social">
               <p className="ks-eyebrow">Síguenos</p>

               <h3>
                  Síguenos
                  <br />
                  tambien por TikTok.
               </h3>

               <a
                  className="ks-primary"
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
               >
                  <FaTiktok style={{ marginRight: 8, fontSize: 16 }} />
                  @kasaca.sport
                  <FaArrowRight style={{ marginLeft: 6, fontSize: 12 }} />
               </a>
            </div>
         </section>

         {/* FOOTER */}
         <footer className="ks-footer">
            <p className="ks-thanks">GRACIAS.</p>

            <p className="ks-footer-text">
               Más que una marca, somos apasionados por el deporte igual que tú. ¡Gracias por confiar en nosotros desde cada rincón de Venezuela y acompañarnos en este camino!
            </p>

            <div className="ks-copy">KASACA SPORT © 2026</div>
         </footer>

         {/* CARRITO FLOTANTE */}
         {cart.length > 0 && !cartOpen && (
            <button className="ks-floating" onClick={() => setCartOpen(true)}>
               <FaShoppingCart style={{ marginRight: 6 }} /> {cart.length}{" "}
               {cart.length === 1 ? "producto" : "productos"} • ${total.toFixed(2)}
               {exchangeRate > 0 && ` (Bs. ${formatBs(total * exchangeRate)})`}
            </button>
         )}

         {/* MODAL DETALLE DE PRODUCTO */}
         {selectedProduct && (
            <div
               className="ks-product-modal-overlay"
               onMouseDown={(e) => {
                  if (e.target === e.currentTarget) closeProduct();
               }}
            >
               <article className="ks-product-modal">
                  <button className="ks-product-modal-close" onClick={closeProduct}>
                     <FaTimes />
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

                     <h2 className="ks-product-modal-title">
                        {selectedProduct.name}
                     </h2>

                     <p className="ks-product-modal-description">
                        {selectedProduct.description}
                     </p>

                     <div className="ks-product-size">
                        <div className="ks-product-size-label">Talla</div>
                        <div className="ks-product-size-options">
                           {selectedProduct.sizes.map((size) => (
                              <button
                                 type="button"
                                 key={size}
                                 className={`ks-size-option ${selectedSize === size ? "active" : ""}`}
                                 onClick={() => setSelectedSize(size)}
                              >
                                 {size}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="ks-product-modal-price">
                        ${selectedProduct.price.toFixed(2)}
                        {exchangeRate > 0 && (
                           <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.48)", fontWeight: "700" }}>
                              Bs. {formatBs(selectedProduct.price * exchangeRate)}
                           </div>
                        )}
                     </div>

                     <div className="ks-product-modal-actions">
                        <button
                           className="ks-product-modal-whatsapp"
                           onClick={() => consultProductOnWhatsApp(selectedProduct)}
                        >
                           <FaWhatsapp style={{ fontSize: 18, marginRight: 6 }} /> Consultar por WhatsApp
                        </button>

                        <button
                           className="ks-product-modal-cart"
                           disabled={selectedProduct.soldOut}
                           onClick={() => addProduct(selectedProduct)}
                        >
                           {selectedProduct.soldOut ? "Agotada" : "Agregar al carrito"}
                           {!selectedProduct.soldOut && <FaPlus style={{ marginLeft: 6 }} />}
                        </button>
                     </div>
                  </div>
               </article>
            </div>
         )}

         {/* SIDEBAR DEL CARRITO */}
         {cartOpen && (
            <div
               className="ks-overlay"
               onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setCartOpen(false);
               }}
            >
               <aside className="ks-panel">
                  <div className="ks-panel-header">
                     <div>
                        <p className="ks-eyebrow">Tus Productos</p>
                        <h2 className="ks-panel-title">Carrito</h2>
                     </div>

                     <button className="ks-close" onClick={() => setCartOpen(false)}>
                        <FaTimes />
                     </button>
                  </div>

                  <div className="ks-items">
                     {groupedCart.length === 0 ? (
                        <div className="ks-empty">
                           <FaShoppingCart style={{ fontSize: 42, color: "#4b5563" }} />
                           <strong style={{ color: "#fff", marginTop: 14, fontSize: 14 }}>
                              Tu carrito está vacío
                           </strong>
                           <div style={{ marginTop: 8 }}>
                              Agrega productos del catálogo para comenzar tu pedido.
                           </div>
                        </div>
                     ) : (
                        groupedCart.map((item) => {
                           const subtotal = item.product.price * item.quantity;
                           return (
                              <div className="ks-item" key={`${item.product.id}-${item.size}`}>
                                 <img src={item.product.image} alt={item.product.name} />

                                 <div className="ks-item-info">
                                    <div className="ks-item-name">{item.product.name}</div>
                                    <div className="ks-item-size">
                                       Talla {item.size} • Cantidad: <strong>{item.quantity}</strong>
                                    </div>
                                    <div className="ks-item-price">
                                       ${subtotal.toFixed(2)}
                                       {exchangeRate > 0 && (
                                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginLeft: "6px" }}>
                                             (Bs. {formatBs(subtotal * exchangeRate)})
                                          </span>
                                       )}
                                    </div>
                                 </div>

                                 <button
                                    className="ks-remove"
                                    onClick={() => removeProduct(item.product.id, item.size)}
                                    title="Quitar uno"
                                 >
                                    <FaTrash style={{ fontSize: 12 }} />
                                 </button>
                              </div>
                           );
                        })
                     )}
                  </div>

                  <div className="ks-panel-footer">
                     <div className="ks-total">
                        <span>Total</span>
                        <div style={{ textAlign: "right" }}>
                           <strong>${total.toFixed(2)}</strong>
                           {exchangeRate > 0 && (
                              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: "700" }}>
                                 Bs. {formatBs(total * exchangeRate)}
                              </div>
                           )}
                        </div>
                     </div>

                     <button
                        className="ks-whatsapp"
                        onClick={sendWhatsApp}
                        disabled={cart.length === 0}
                     >
                        <FaWhatsapp style={{ fontSize: 18, marginRight: 6 }} /> Enviar pedido por WhatsApp
                     </button>

                     <p className="ks-note">
                        Tu selección se enviará directamente a Kasaca Sport para confirmar el pedido.
                     </p>
                  </div>
               </aside>
            </div>
         )}
      </main>
   );
}
