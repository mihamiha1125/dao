document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".nav-toggle");
    const drawer = document.querySelector(".nav-drawer");
    const overlay = document.querySelector(".nav-overlay");

    if (!btn || !drawer || !overlay) return;

    const open = () => {
        btn.classList.add("active"); // ★追加
        drawer.classList.add("is-open");
        overlay.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        document.documentElement.style.overflow = "hidden";
    };

    const close = () => {
        btn.classList.remove("active"); // ★追加
        drawer.classList.remove("is-open");
        overlay.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        document.documentElement.style.overflow = "";
    };

    btn.addEventListener("click", () => {
        drawer.classList.contains("is-open") ? close() : open();
    });

    overlay.addEventListener("click", close);

    // ★追加：メニュー内リンク押下で閉じる（使い勝手UP）
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
    });
});
