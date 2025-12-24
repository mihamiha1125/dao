document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // Drawer（右から）
    // =========================
    const navToggle = document.querySelector(".nav-toggle");
    const overlay = document.querySelector(".nav-overlay");
    const drawer = document.querySelector(".nav-drawer");

    const openDrawer = () => {
        if (!navToggle || !overlay || !drawer) return;

        navToggle.classList.add("active");
        navToggle.setAttribute("aria-expanded", "true");

        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");

        overlay.hidden = false;
        overlay.classList.add("open"); // ★追加：CSSと整合

        document.body.style.overflow = "hidden";
    };

    const closeDrawer = () => {
        if (!navToggle || !overlay || !drawer) return;

        navToggle.classList.remove("active");
        navToggle.setAttribute("aria-expanded", "false");

        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");

        overlay.classList.remove("open"); // ★追加：CSSと整合
        overlay.hidden = true;

        document.body.style.overflow = "";
    };

    if (navToggle && overlay && drawer) {
        navToggle.addEventListener("click", () => {
            drawer.classList.contains("open") ? closeDrawer() : openDrawer();
        });

        overlay.addEventListener("click", closeDrawer);
        drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDrawer));
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeDrawer();
        });
    }

    // =========================
    // 共通：JSON読み込み
    // =========================
    const yen = new Intl.NumberFormat("ja-JP");
    const getIdParam = () => new URL(location.href).searchParams.get("id");

    async function loadProducts() {
        const res = await fetch("js/products.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`products.json load failed: ${res.status}`);
        return res.json();
    }

    // =========================
    // 一覧ページ処理（productGrid がある場合）
    // =========================
    const grid = document.getElementById("productGrid");
    if (grid) {
        const emptyMessage = document.querySelector(".plist-empty");
        const keywordInput = document.getElementById("keywordInput");
        const artistButtons = Array.from(document.querySelectorAll(".filter-chip--artist"));
        const kilnButtons = Array.from(document.querySelectorAll(".filter-chip--kiln"));
        const categorySelect = document.getElementById("categorySelect");

        let products = [];
        let currentArtist = "all";
        let currentKiln = "all";
        let currentCategory = "all";
        let currentKeyword = "";

        const normalize = (s) => (s || "").toString().toLowerCase();
        const buildText = (p) => normalize(`${p.title} ${p.artistName} ${p.kilnName} ${p.categoryName}`);

        function render(list) {
            grid.innerHTML = "";
            const frag = document.createDocumentFragment();

            list.forEach((p) => {
                const a = document.createElement("a");
                a.className = "product-link";
                a.href = `merchandise1.html?id=${encodeURIComponent(p.id)}`;

                const article = document.createElement("article");
                article.className = "product-item";
                article.dataset.artist = p.artistKey || "";
                article.dataset.kiln = p.kilnKey || "";
                article.dataset.category = p.categoryKey || "";
                article.dataset.text = buildText(p);

                const fig = document.createElement("figure");
                fig.className = "product-figure";

                const img = document.createElement("img");
                img.src = p.image;
                img.alt = p.title;

                const cap = document.createElement("figcaption");

                const sArtist = document.createElement("span");
                sArtist.className = "product-card-artist";
                sArtist.textContent = p.artistName;

                const sTitle = document.createElement("span");
                sTitle.className = "product-card-title";
                sTitle.textContent = p.title;

                cap.appendChild(sArtist);
                cap.appendChild(sTitle);

                fig.appendChild(img);
                fig.appendChild(cap);

                const price = document.createElement("p");
                price.className = "product-price";
                price.textContent = `${yen.format(Number(p.priceJPY || 0))} JPY`;

                article.appendChild(fig);
                article.appendChild(price);

                a.appendChild(article);
                frag.appendChild(a);
            });

            grid.appendChild(frag);
        }

        function applyFilters() {
            const links = Array.from(document.querySelectorAll("#productGrid .product-link"));
            let visibleCount = 0;

            links.forEach((link) => {
                const item = link.querySelector(".product-item");
                if (!item) return;

                const artist = item.dataset.artist || "";
                const kiln = item.dataset.kiln || "";
                const category = item.dataset.category || "";
                const text = (item.dataset.text || "").toLowerCase();

                const matchArtist = currentArtist === "all" || artist === currentArtist;
                const matchKiln = currentKiln === "all" || kiln === currentKiln;
                const matchCategory = currentCategory === "all" || category === currentCategory;
                const matchKeyword = !currentKeyword || text.includes(currentKeyword);

                const ok = matchArtist && matchKiln && matchCategory && matchKeyword;

                link.style.display = ok ? "block" : "none";
                if (ok) visibleCount++;
            });

            if (emptyMessage) emptyMessage.hidden = visibleCount !== 0;
        }

        artistButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                artistButtons.forEach((b) => b.classList.remove("is-active"));
                btn.classList.add("is-active");
                currentArtist = btn.dataset.artist || "all";
                applyFilters();
            });
        });

        kilnButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                kilnButtons.forEach((b) => b.classList.remove("is-active"));
                btn.classList.add("is-active");
                currentKiln = btn.dataset.kiln || "all";
                applyFilters();
            });
        });

        categorySelect?.addEventListener("change", () => {
            currentCategory = categorySelect.value || "all";
            applyFilters();
        });

        keywordInput?.addEventListener("input", () => {
            currentKeyword = (keywordInput.value || "").trim().toLowerCase();
            applyFilters();
        });

        (async () => {
            try {
                products = await loadProducts();
                render(products);
                applyFilters();
            } catch (e) {
                console.error(e);
                if (emptyMessage) {
                    emptyMessage.hidden = false;
                    emptyMessage.textContent = "商品データの読み込みに失敗しました（js/products.json を確認してください）";
                }
            }
        })();
    }

    // =========================
    // 個別ページ処理（pdpTitle がある場合）
    // =========================
    const pdpTitle = document.getElementById("pdpTitle");
    if (pdpTitle) {
        const pid = getIdParam();
        const notFound = document.getElementById("pdpNotFound");

        const elImg = document.getElementById("pdpImage");
        const elArtist = document.getElementById("pdpArtist");
        const elPrice = document.getElementById("pdpPrice");
        const elKiln = document.getElementById("pdpKiln");
        const elCat = document.getElementById("pdpCategory");
        const elBuy = document.getElementById("pdpBuyBtn");

        (async () => {
            try {
                const products = await loadProducts();
                const p = products.find((x) => x.id === pid);

                if (!p) {
                    if (notFound) notFound.hidden = false;
                    return;
                }

                document.title = `BizenDAO｜商品詳細｜${p.title}`;

                if (elImg) { elImg.src = p.image; elImg.alt = p.title; }
                if (elArtist) elArtist.textContent = p.artistName || "";
                if (pdpTitle) pdpTitle.textContent = p.title || "";
                if (elPrice) elPrice.textContent = `${yen.format(Number(p.priceJPY || 0))} JPY`;
                if (elKiln) elKiln.textContent = p.kilnName || "";
                if (elCat) elCat.textContent = p.categoryName || "";

                if (elBuy) elBuy.href = p.baseUrl || "#";
            } catch (e) {
                console.error(e);
                if (notFound) {
                    notFound.hidden = false;
                    notFound.textContent = "商品データの読み込みに失敗しました（js/products.json を確認してください）";
                }
            }
        })();
    }
});
