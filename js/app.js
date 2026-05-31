/* =========================================================
   ICE_TECH — App logic (cart, rendering, interactions)
   ========================================================= */

const CART_KEY = "icetech_cart";

/* ---------- Cart store ---------- */
const Cart = {
  read() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  },
  write(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    Cart.updateBadge();
  },
  add(item) {
    const items = Cart.read();
    const key = item.id + "|" + item.material;
    const existing = items.find((i) => i.id + "|" + i.material === key);
    if (existing) existing.qty += item.qty;
    else items.push(item);
    Cart.write(items);
  },
  remove(index) {
    const items = Cart.read();
    items.splice(index, 1);
    Cart.write(items);
  },
  setQty(index, qty) {
    const items = Cart.read();
    if (items[index]) { items[index].qty = Math.max(1, qty); Cart.write(items); }
  },
  count() {
    return Cart.read().reduce((s, i) => s + i.qty, 0);
  },
  subtotal() {
    return Cart.read().reduce((s, i) => s + i.price * i.qty, 0);
  },
  updateBadge() {
    const el = document.querySelector("[data-cart-count]");
    if (el) {
      const c = Cart.count();
      el.textContent = c;
      el.style.display = c > 0 ? "grid" : "none";
    }
  },
};

/* ---------- Toast ---------- */
function toast(msg) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l3 6-9 12L3 9z"/></svg></span><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(14px)"; t.style.transition = "all .3s"; }, 2600);
  setTimeout(() => t.remove(), 3000);
}

/* ---------- Reusable templates ---------- */
function productCardHTML(p) {
  const compare = p.compare ? `<small style="text-decoration:line-through; margin-left:8px;">${formatXAF(p.compare)}</small>` : "";
  const badge = p.badge ? `<span class="product-badge">${p.badge}</span>` : "";
  return `
  <article class="product-card reveal" data-id="${p.id}">
    <a class="product-thumb" href="product.html?id=${p.id}">
      ${badge}
      <img src="assets/prod-${p.id}.png" alt="${p.name}" loading="lazy" onerror="this.remove()" />
    </a>
    <div class="product-info">
      <span class="ptag">${p.tag}</span>
      <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
      <span class="price">${formatXAF(p.price)} ${compare}</span>
      <div class="product-actions">
        <a class="btn btn-ghost" href="product.html?id=${p.id}">Details</a>
        <button class="btn btn-primary" data-quick-add="${p.id}">Add</button>
      </div>
    </div>
  </article>`;
}

function categoryCardHTML(c) {
  return `
  <a class="cat-card reveal" href="products.html?cat=${c.id}">
    <div class="cat-visual ${c.grad}">
      ${c.image ? `<img src="${c.image}" alt="${c.name}" loading="lazy" onerror="this.remove()" />` : ""}
    </div>
    <div class="cat-body">
      <h3>${c.name}</h3>
      <p>${c.sub}</p>
      <span class="arrow">↗</span>
    </div>
  </a>`;
}

/* ---------- Quick add wiring ---------- */
function wireQuickAdd(scope = document) {
  scope.querySelectorAll("[data-quick-add]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const p = getProduct(btn.dataset.quickAdd);
      if (!p) return;
      Cart.add({ id: p.id, name: p.name, glyph: p.glyph, price: p.price, material: p.materials[0], qty: 1 });
      toast(`${p.name} added to cart`);
    });
  });
}

/* ---------- Header / nav ---------- */
function initHeader() {
  Cart.updateBadge();
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || els.length === 0) {
    els.forEach((e) => e.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}

/* ---------- Consultation modal ---------- */
function initConsultModal() {
  const backdrop = document.querySelector("#consultModal");
  if (!backdrop) return;
  const open = () => backdrop.classList.add("open");
  const close = () => backdrop.classList.remove("open");
  document.querySelectorAll("[data-open-consult]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(); }));
  backdrop.querySelector("[data-close-consult]")?.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    close();
    toast("Consultation request sent — we'll call you back within 24h");
  });
}

/* ---------- HOME page ---------- */
function initHome() {
  const catGrid = document.querySelector("#homeCategories");
  if (catGrid) catGrid.innerHTML = CATEGORIES.map(categoryCardHTML).join("");

  const featGrid = document.querySelector("#homeFeatured");
  if (featGrid) featGrid.innerHTML = PRODUCTS.filter((p) => p.featured).slice(0, 4).map(productCardHTML).join("");

  wireQuickAdd();
}

/* ---------- CATALOG page ---------- */
function initCatalog() {
  const grid = document.querySelector("#catalogGrid");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  let activeCat = params.get("cat") || "all";
  let activeMat = "all";
  let sort = "featured";

  const catBar = document.querySelector("#catFilters");
  const matBar = document.querySelector("#matFilters");
  const countEl = document.querySelector("#catalogCount");
  const sortSel = document.querySelector("#sortSelect");
  const titleEl = document.querySelector("#catalogTitle");

  function renderFilters() {
    const cats = [{ id: "all", name: "All" }, ...CATEGORIES];
    catBar.innerHTML = cats.map((c) => `<button class="chip ${c.id === activeCat ? "active" : ""}" data-cat="${c.id}">${c.name}</button>`).join("");
    const mats = ["all", ...MATERIALS];
    matBar.innerHTML = mats.map((m) => `<button class="chip ${m === activeMat ? "active" : ""}" data-mat="${m}">${m === "all" ? "All" : m}</button>`).join("");
    catBar.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => { activeCat = b.dataset.cat; render(); }));
    matBar.querySelectorAll("[data-mat]").forEach((b) => b.addEventListener("click", () => { activeMat = b.dataset.mat; render(); }));
  }

  function render() {
    let list = PRODUCTS.filter((p) => activeCat === "all" || p.category === activeCat);
    if (activeMat !== "all") list = list.filter((p) => p.materials.includes(activeMat));
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);

    grid.innerHTML = list.length
      ? list.map(productCardHTML).join("")
      : `<p style="color:var(--muted); grid-column:1/-1; padding:40px 0;">No product matches these filters.</p>`;
    if (countEl) countEl.textContent = `${list.length} piece${list.length > 1 ? "s" : ""}`;
    if (titleEl) {
      const cat = CATEGORIES.find((c) => c.id === activeCat);
      titleEl.textContent = cat ? cat.name : "The full collection";
    }
    renderFilters();
    wireQuickAdd(grid);
    initReveal();
  }

  if (sortSel) sortSel.addEventListener("change", () => { sort = sortSel.value; render(); });
  render();
}

/* ---------- PRODUCT page ---------- */
function initProduct() {
  const root = document.querySelector("#pdp");
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const p = getProduct(params.get("id")) || PRODUCTS[0];
  document.title = `${p.name} — ICE_TECH`;

  const compare = p.compare ? `<small style="text-decoration:line-through;">${formatXAF(p.compare)}</small>` : "";
  const matOptions = p.materials.map((m) => `<option value="${m}">${m}</option>`).join("");
  const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));

  root.innerHTML = `
    <div class="gallery">
      <div class="main-img" id="zoomImg">
        <img id="mainImg" src="assets/prod-${p.id}.png" alt="${p.name}" onerror="this.remove()" />
        <span class="zoom-hint"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg> Hover to zoom in on the clarity</span>
      </div>
      <div class="thumbs" id="pdpThumbs">
        <button class="thumb active" style="background-image:url('assets/prod-${p.id}.png')" data-src="assets/prod-${p.id}.png" aria-label="Product view"></button>
      </div>
    </div>
    <div class="pdp-info">
      <span class="ptag">${p.tag}</span>
      <h1>${p.name}</h1>
      <div class="rating">${stars} <span class="muted">${p.rating} · ${p.reviews} reviews</span></div>
      <div class="pdp-price" style="margin-top:14px;">${formatXAF(p.price)} ${compare}</div>
      <p class="pdp-desc">${p.desc}</p>

      <div class="option-block">
        <label>Material</label>
        <select class="select-lux" id="matSelect">${matOptions}</select>
      </div>

      <div class="qty-row">
        <div class="option-block" style="margin:0;">
          <label>Quantity</label>
          <div class="qty">
            <button id="qtyMinus">−</button>
            <input id="qtyInput" type="text" value="1" inputmode="numeric" />
            <button id="qtyPlus">+</button>
          </div>
        </div>
      </div>

      <div class="pdp-actions">
        <button class="btn btn-primary btn-lg" id="addToCart">Add to cart</button>
        <a class="btn btn-ghost btn-lg" href="cart.html">View cart</a>
      </div>

      ${p.category === "grills" ? `
      <div class="consult-box">
        <h4>100% custom grill</h4>
        <p>Every grill is crafted from your impression for a perfect fit. Book your consultation in Douala or Yaoundé.</p>
        <button class="btn btn-primary" data-open-consult>Book a Grill consultation</button>
      </div>` : `
      <div class="consult-box">
        <h4>Customizable piece</h4>
        <p>Looking for an exclusive variant or a matching grill? Let's discuss your custom project.</p>
        <button class="btn btn-ghost" data-open-consult>Book a consultation</button>
      </div>`}

      <div class="pdp-meta">
        <div class="row"><span class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h10a2 2 0 0 1 2 2v15l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2z"/><path d="M9 8h6M9 12h6"/></svg></span> GRA certificate of authenticity included</div>
        <div class="row"><span class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/></svg></span> Same-day delivery in Douala · Express to Yaoundé</div>
        <div class="row"><span class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span> Secure payment · Mobile Money, Orange Money &amp; cash on delivery</div>
      </div>
    </div>`;

  // Gallery thumbs (swap the main image)
  const mainGlyph = root.querySelector("#mainGlyph");
  const mainImg = root.querySelector("#mainImg");
  root.querySelectorAll(".thumb").forEach((t) => {
    t.addEventListener("click", () => {
      root.querySelectorAll(".thumb").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      if (mainImg && t.dataset.src) mainImg.src = t.dataset.src;
    });
  });

  // Zoom on hover (works on the image; falls back to the glyph)
  const zoom = root.querySelector("#zoomImg");
  const zoomTarget = mainImg || mainGlyph;
  if (zoomTarget) {
    zoom.addEventListener("mousemove", (e) => {
      const r = zoom.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      zoomTarget.style.transformOrigin = `${x}% ${y}%`;
      zoomTarget.style.transform = "scale(2.4)";
    });
    zoom.addEventListener("mouseleave", () => { zoomTarget.style.transform = "scale(1)"; });
  }

  // Qty
  const qtyInput = root.querySelector("#qtyInput");
  const clampQty = () => { let v = parseInt(qtyInput.value, 10); if (isNaN(v) || v < 1) v = 1; qtyInput.value = v; return v; };
  root.querySelector("#qtyMinus").addEventListener("click", () => { qtyInput.value = Math.max(1, clampQty() - 1); });
  root.querySelector("#qtyPlus").addEventListener("click", () => { qtyInput.value = clampQty() + 1; });
  qtyInput.addEventListener("change", clampQty);

  // Add to cart
  root.querySelector("#addToCart").addEventListener("click", () => {
    const material = root.querySelector("#matSelect").value;
    const qty = clampQty();
    Cart.add({ id: p.id, name: p.name, glyph: p.glyph, price: p.price, material, qty });
    toast(`${p.name} (${material}) ×${qty} added`);
  });

  // Related products
  const related = document.querySelector("#relatedGrid");
  if (related) {
    const list = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    const fill = list.length < 4 ? PRODUCTS.filter((x) => x.id !== p.id && !list.includes(x)).slice(0, 4 - list.length) : [];
    related.innerHTML = [...list, ...fill].map(productCardHTML).join("");
    wireQuickAdd(related);
  }

  initConsultModal();
  initReveal();
}

/* ---------- CART page ---------- */
function initCart() {
  const root = document.querySelector("#cartRoot");
  if (!root) return;

  let shippingId = SHIPPING_OPTIONS[0].id;
  let paymentId = PAYMENT_OPTIONS[0].id;

  function render() {
    const items = Cart.read();
    const itemsEl = document.querySelector("#cartItems");
    const summaryEl = document.querySelector("#cartSummary");

    if (items.length === 0) {
      itemsEl.innerHTML = `
        <div class="cart-empty">
          <div class="big"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3 7 9l5 12M15 3l2 6-5 12"/></svg></div>
          <h3 style="font-size:26px; margin-bottom:8px;">Your cart is empty</h3>
          <p style="margin-bottom:22px;">Discover our most coveted iced-out pieces.</p>
          <a class="btn btn-primary" href="products.html">Explore the collection</a>
        </div>`;
      summaryEl.style.display = "none";
      return;
    }
    summaryEl.style.display = "";

    itemsEl.innerHTML = items.map((i, idx) => `
      <div class="cart-row">
        <div class="ci-thumb"><img src="assets/prod-${i.id}.png" alt="${i.name}" onerror="this.remove()" /></div>
        <div>
          <div class="ci-name">${i.name}</div>
          <div class="ci-opt">${i.material}</div>
          <div class="ci-price">${formatXAF(i.price)}</div>
        </div>
        <div class="ci-right">
          <div class="qty">
            <button data-dec="${idx}">−</button>
            <input value="${i.qty}" data-qty="${idx}" inputmode="numeric" />
            <button data-inc="${idx}">+</button>
          </div>
          <button class="ci-remove" data-remove="${idx}">Remove</button>
        </div>
      </div>`).join("");

    itemsEl.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => { Cart.setQty(+b.dataset.inc, Cart.read()[+b.dataset.inc].qty + 1); render(); }));
    itemsEl.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => { Cart.setQty(+b.dataset.dec, Cart.read()[+b.dataset.dec].qty - 1); render(); }));
    itemsEl.querySelectorAll("[data-qty]").forEach((inp) => inp.addEventListener("change", () => { Cart.setQty(+inp.dataset.qty, parseInt(inp.value, 10) || 1); render(); }));
    itemsEl.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => { Cart.remove(+b.dataset.remove); render(); toast("Item removed"); }));

    renderSummary();
  }

  function renderSummary() {
    const summaryEl = document.querySelector("#cartSummary");
    const subtotal = Cart.subtotal();
    const ship = SHIPPING_OPTIONS.find((s) => s.id === shippingId);
    const shipCost = ship.price;
    const total = subtotal + shipCost;

    summaryEl.innerHTML = `
      <h3>Summary</h3>

      <div class="notice"><span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span><span>Local delivery: <strong>Douala</strong> same day &amp; <strong>Yaoundé</strong> 24h express.</span></div>

      <div class="block-label">Delivery method</div>
      <div class="ship-options">
        ${SHIPPING_OPTIONS.map((s) => `
          <label class="opt-card ${s.id === shippingId ? "selected" : ""}">
            <input type="radio" name="ship" value="${s.id}" ${s.id === shippingId ? "checked" : ""}/>
            <div>
              <div class="opt-title">${s.label}</div>
              <div class="opt-sub">${s.sub}</div>
            </div>
            <div class="opt-price">${s.free ? "Free" : formatXAF(s.price)}</div>
          </label>`).join("")}
      </div>

      <div class="block-label">Payment</div>
      <div class="pay-options">
        ${PAYMENT_OPTIONS.map((m) => `
          <label class="opt-card ${m.id === paymentId ? "selected" : ""}">
            <input type="radio" name="pay" value="${m.id}" ${m.id === paymentId ? "checked" : ""}/>
            <div>
              <div class="opt-title">${m.glyph} ${m.label}</div>
              <div class="opt-sub">${m.sub}</div>
            </div>
          </label>`).join("")}
      </div>

      <div class="block-label">Contact details</div>
      <div class="field"><label>Full name</label><input type="text" placeholder="Your name" /></div>
      <div class="field-row">
        <div class="field"><label>Phone</label><input type="tel" placeholder="+237 6.." /></div>
        <div class="field"><label>City</label><input type="text" placeholder="Douala / Yaoundé" /></div>
      </div>
      <div class="field"><label>Address / neighborhood</label><input type="text" placeholder="Neighborhood, landmark" /></div>

      <div style="margin-top:18px;">
        <div class="summary-row"><span>Subtotal</span><span>${formatXAF(subtotal)}</span></div>
        <div class="summary-row"><span>Delivery</span><span>${shipCost === 0 ? "Free" : formatXAF(shipCost)}</span></div>
        <div class="summary-row total"><span>Total</span><span class="ice">${formatXAF(total)}</span></div>
      </div>

      <button class="btn btn-primary btn-block btn-lg" id="placeOrder" style="margin-top:18px;">Confirm order</button>
      <p style="color:var(--muted-2); font-size:12px; text-align:center; margin-top:12px; display:flex; align-items:center; justify-content:center; gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg> Secure transaction · Satisfaction guaranteed</p>
    `;

    summaryEl.querySelectorAll('input[name="ship"]').forEach((r) => r.addEventListener("change", () => { shippingId = r.value; renderSummary(); }));
    summaryEl.querySelectorAll('input[name="pay"]').forEach((r) => r.addEventListener("change", () => { paymentId = r.value; renderSummary(); }));
    summaryEl.querySelector("#placeOrder").addEventListener("click", () => {
      const pay = PAYMENT_OPTIONS.find((m) => m.id === paymentId);
      Cart.write([]);
      render();
      toast(`Order confirmed via ${pay.label}`);
    });
  }

  render();
}

/* ---------- Floating WhatsApp button ---------- */
function initFloatingWhatsApp() {
  if (document.querySelector(".wa-float")) return;
  const phone = "237600000000"; // replace with the real ICE_TECH WhatsApp number
  const msg = encodeURIComponent("Hi ICE_TECH! I'd like to order / ask about a piece.");
  const a = document.createElement("a");
  a.className = "wa-float";
  a.href = `https://wa.me/${phone}?text=${msg}`;
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("aria-label", "Order on WhatsApp");
  a.innerHTML = `
    <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.4.7.7-3.3-.2-.4c-1-1.6-1.5-3.4-1.5-5.2C6.2 9.5 10.5 5.2 16 5.2S25.8 9.5 25.8 15 21.5 24.8 16 24.8zm5.4-7.3c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/>
    </svg>
    <span class="wa-label">Order on WhatsApp</span>`;
  document.body.appendChild(a);
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initHome();
  initCatalog();
  initProduct();
  initCart();
  initConsultModal();
  initFloatingWhatsApp();
  initReveal();
});
