// =================================================
// app.js（全体コード）
// =================================================
document.addEventListener("DOMContentLoaded", () => {
    /* =================================================
       ハンバーガーメニュー（drawer）
       ================================================= */
    {
        const btn = document.querySelector(".nav-toggle");
        const drawer = document.querySelector(".nav-drawer");
        const overlay = document.querySelector(".nav-overlay");

        if (btn && drawer && overlay) {
            const open = () => {
                btn.classList.add("active");
                drawer.classList.add("is-open");
                overlay.classList.add("is-open");
                btn.setAttribute("aria-expanded", "true");
                document.documentElement.style.overflow = "hidden";
            };

            const close = () => {
                btn.classList.remove("active");
                drawer.classList.remove("is-open");
                overlay.classList.remove("is-open");
                btn.setAttribute("aria-expanded", "false");
                document.documentElement.style.overflow = "";
            };

            btn.addEventListener("click", () => {
                const isOpen = drawer.classList.contains("is-open");
                isOpen ? close() : open();
            });

            overlay.addEventListener("click", close);

            drawer.querySelectorAll("a").forEach((a) => {
                a.addEventListener("click", close);
            });

            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") close();
            });
        }
    }

    /* =================================================
       既存：シンプルスライダー（products）
       ================================================= */
    document.querySelectorAll(".slider").forEach((slider) => {
        const items = slider.querySelectorAll(".slider-item");
        const prevBtn = slider.querySelector(".slider-arrow--left");
        const nextBtn = slider.querySelector(".slider-arrow--right");

        if (!items.length || !prevBtn || !nextBtn) return;

        let index = 0;

        const update = () => {
            items.forEach((item, i) => {
                item.classList.toggle("slider-item--active", i === index);
            });
        };

        prevBtn.addEventListener("click", () => {
            index = (index - 1 + items.length) % items.length;
            update();
        });

        nextBtn.addEventListener("click", () => {
            index = (index + 1) % items.length;
            update();
        });
    });

    /* =================================================
       作家紹介：2枚表示 / 1枚ずつ左へ / 無限ループ
       ================================================= */
    (() => {
        const root = document.querySelector("[data-artist-slider]");
        if (!root) return;

        const track = root.querySelector(".artist-track");
        const slides = Array.from(root.querySelectorAll(".artist-slide"));
        const prev = root.querySelector(".artist-arrow--left");
        const next = root.querySelector(".artist-arrow--right");

        if (!track || slides.length < 2) return;

        let isAnimating = false;
        let timer = null;

        const getGap = () => {
            const cs = getComputedStyle(track);
            return parseFloat(cs.gap || cs.columnGap || "0") || 0;
        };

        const getStep = () => {
            const first = track.querySelector(".artist-slide");
            if (!first) return 0;
            return first.getBoundingClientRect().width + getGap();
        };

        const moveNext = () => {
            if (isAnimating) return;
            isAnimating = true;

            const step = getStep();
            track.style.transition = "transform 1.2s ease"; // ← 速度ゆっくり
            track.style.transform = `translateX(-${step}px)`;

            track.addEventListener(
                "transitionend",
                () => {
                    track.style.transition = "none";
                    track.appendChild(track.firstElementChild);
                    track.style.transform = "translateX(0)";
                    track.offsetHeight;
                    isAnimating = false;
                },
                { once: true }
            );
        };

        const movePrev = () => {
            if (isAnimating) return;
            isAnimating = true;

            const step = getStep();
            track.style.transition = "none";
            track.insertBefore(track.lastElementChild, track.firstElementChild);
            track.style.transform = `translateX(-${step}px)`;
            track.offsetHeight;

            track.style.transition = "transform 1.2s ease"; // ← 速度ゆっくり
            track.style.transform = "translateX(0)";

            track.addEventListener(
                "transitionend",
                () => {
                    isAnimating = false;
                },
                { once: true }
            );
        };

        const startAuto = () => {
            stopAuto();
            timer = setInterval(moveNext, 5000); // ← 自動送りも遅め
        };

        const stopAuto = () => {
            if (timer) clearInterval(timer);
            timer = null;
        };

        next?.addEventListener("click", () => {
            stopAuto();
            moveNext();
            startAuto();
        });

        prev?.addEventListener("click", () => {
            stopAuto();
            movePrev();
            startAuto();
        });

        root.addEventListener("mouseenter", stopAuto);
        root.addEventListener("mouseleave", startAuto);

        window.addEventListener("resize", () => {
            track.style.transition = "none";
            track.style.transform = "translateX(0)";
            track.offsetHeight;
        });

        startAuto();
    })();
});
