/**
 * Farmers Connect — API Client & Utilities
 * Update API_BASE to your Render/Railway backend URL before deploying
 */

const API_BASE = "https://farmers-connect-sn3y.onrender.com";
// DEV: const API_BASE = "http://localhost:5000/api";

/* ── Fetch wrapper ───────────────────────────────── */
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return data;
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err.message);
    throw err;
  }
}

/* ── Products API ────────────────────────────────── */
const ProductsAPI = {
  getAll: ({ category = "", state = "", search = "", page = 1 } = {}) => {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (state)    p.set("state", state);
    if (search)   p.set("search", search);
    p.set("page", page); p.set("limit", 12);
    return apiFetch(`/products?${p}`);
  },
  getById: (id) => apiFetch(`/products/${id}`),
  create: async (formData) => {
    const res = await fetch(`${API_BASE}/products`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create listing");
    return data;
  },
};

/* ── Farmers API ─────────────────────────────────── */
const FarmersAPI = {
  register:      (body) => apiFetch("/farmers/register", { method: "POST", body: JSON.stringify(body) }),
  getById:       (id)   => apiFetch(`/farmers/${id}`),
  lookupByPhone: (phone) => apiFetch(`/farmers/lookup/${phone}`),
};

/* ── Shared layout injection ─────────────────────── */
function initLayout(activePage = "") {
  const links = [
    { href: "index.html",   label: "Home",        key: "home"     },
    { href: "shop.html",    label: "Shop",         key: "shop"     },
    { href: "farmers.html", label: "Farmers",      key: "farmers"  },
    { href: "about.html",   label: "About",        key: "about"    },
    { href: "contact.html", label: "Contact",      key: "contact"  },
  ];

  const nav = `
  <nav class="nav">
    <div class="container nav__inner">
      <a href="index.html" class="nav__logo">
        <div class="nav__logo-icon">🌿</div>
        <div class="nav__logo-text">Farmers <span>Connect</span></div>
      </a>
      <div class="nav__links" id="navLinks">
        ${links.map(l => `<a href="${l.href}" class="nav__link${activePage===l.key?" active":""}">${l.label}</a>`).join("")}
      </div>
      <div class="nav__actions">
        <a href="list-product.html" class="nav__cta">+ List Produce</a>
        <button class="nav__toggle" onclick="document.getElementById('navLinks').classList.toggle('open')" aria-label="Menu">☰</button>
      </div>
    </div>
  </nav>`;

  const footer = `
  <footer>
    <div class="footer__grid">
      <div>
        <div class="footer__brand-name">Farmers <span>Connect</span></div>
        <p class="footer__brand-desc">Nigeria's trusted platform connecting farmers directly with buyers. No middlemen, fair prices, fresher produce.</p>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap">
          <a href="register-farmer.html" class="btn btn--primary btn--sm">Join as Farmer</a>
          <a href="shop.html" class="btn btn--ghost-light btn--sm">Browse Products</a>
        </div>
      </div>
      <div>
        <div class="footer__col-title">Marketplace</div>
        <nav class="footer__links">
          <a href="shop.html">Browse Products</a>
          <a href="shop.html?category=GRAINS">Grains</a>
          <a href="shop.html?category=VEGETABLES">Vegetables</a>
          <a href="shop.html?category=FRUITS">Fruits</a>
          <a href="shop.html?category=TUBERS">Tubers</a>
        </nav>
      </div>
      <div>
        <div class="footer__col-title">For Farmers</div>
        <nav class="footer__links">
          <a href="register-farmer.html">Register Farm</a>
          <a href="list-product.html">List Produce</a>
          <a href="farmers.html">Farmer Directory</a>
          <a href="faq.html">How It Works</a>
        </nav>
      </div>
      <div>
        <div class="footer__col-title">Company</div>
        <nav class="footer__links">
          <a href="about.html">About Us</a>
          <a href="faq.html">FAQ</a>
          <a href="contact.html">Contact</a>
        </nav>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="footer__credit">© 2026 <strong>Farmers Connect</strong> · Empowering Nigerian Agriculture</div>
      <div class="footer__designer">Designed & Built by <span>Opeyemi Adeshina</span></div>
    </div>
  </footer>`;

  const navEl = document.createElement("div");
  navEl.innerHTML = nav;
  document.body.insertBefore(navEl.firstElementChild, document.body.firstChild);

  const footEl = document.createElement("div");
  footEl.innerHTML = footer;
  document.body.appendChild(footEl.firstElementChild);
}

/* ── Utilities ───────────────────────────────────── */
const Utils = {
  formatNaira: (n) => new Intl.NumberFormat("en-NG", { style:"currency", currency:"NGN", minimumFractionDigits:0 }).format(n),

  buildWhatsApp: (phone, productName, farmerName) => {
    const msg = encodeURIComponent(`Hello ${farmerName}! I found your listing on Farmers Connect and I'm interested in *${productName}*. Is it available?`);
    return `https://wa.me/${phone.replace(/^0/,"234")}?text=${msg}`;
  },

  titleCase: (s) => (s||"").toLowerCase().replace(/_/g," ").split(" ").map(w=>w[0].toUpperCase()+w.slice(1)).join(" "),

  timeAgo: (d) => {
    const m = Math.floor((Date.now()-new Date(d))/60000);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m/60);
    if (h < 24)  return `${h}h ago`;
    const days = Math.floor(h/24);
    if (days < 30) return `${days}d ago`;
    return new Date(d).toLocaleDateString("en-NG");
  },

  getParam: (n) => new URLSearchParams(window.location.search).get(n),

  toast: (msg, type="success") => {
    document.querySelectorAll(".toast").forEach(t=>t.remove());
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(()=>t.classList.add("show"));
    setTimeout(()=>{t.classList.remove("show");setTimeout(()=>t.remove(),300);},3600);
  },

  catColor: {
    GRAINS:"#c47c1a", VEGETABLES:"#2e7d32", FRUITS:"#c2410c",
    TUBERS:"#6d28d9", LEGUMES:"#1d4ed8", LIVESTOCK:"#be185d",
    DAIRY:"#0e7490", OTHER:"#64748b"
  },
  catEmoji: {
    GRAINS:"🌾", VEGETABLES:"🥦", FRUITS:"🍊", TUBERS:"🍠",
    LEGUMES:"🫘", LIVESTOCK:"🐄", DAIRY:"🥛", OTHER:"📦"
  },

  card: (p) => {
    const color = Utils.catColor[p.category] || "#888";
    const emoji = Utils.catEmoji[p.category] || "🌿";
    return `
      <article class="card card--lift product-card" onclick="window.location='product.html?id=${p.id}'">
        <div class="product-card__img">
          ${p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy" />`
            : emoji}
          <span class="product-card__badge" style="background:${color}">${Utils.titleCase(p.category)}</span>
        </div>
        <div class="product-card__body">
          <div class="product-card__name">${p.name}</div>
          <div class="product-card__meta">
            <span>📍</span> ${p.farmer?.state||"Nigeria"} &nbsp;·&nbsp; ${Utils.timeAgo(p.createdAt)}
          </div>
          <div class="product-card__foot">
            <div>
              <div class="product-card__price">${Utils.formatNaira(p.price)}</div>
              <div class="product-card__unit">per ${p.unit}</div>
            </div>
            <div class="product-card__arrow">→</div>
          </div>
        </div>
      </article>`;
  },

  skels: (n=8) => Array(n).fill(`
    <div class="skel-card">
      <div class="skeleton skel-img"></div>
      <div class="skel-body">
        <div class="skeleton skel-line w70"></div>
        <div class="skeleton skel-line w45"></div>
        <div class="skeleton skel-line w70"></div>
      </div>
    </div>`).join(""),

  nigeriaStates: ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"],

  stateOptions: () => ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"].map(s=>`<option>${s}</option>`).join(""),
};
