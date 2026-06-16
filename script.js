/* ==========================================================================
   ODAKUTO Portfolio — Interactive Engine v4.0
   ========================================================================== */

// ===== 1. スクロールリビール =====
// HTML を触らずに JS 側でリビール対象を自動選択してアニメーション付加
const setupReveal = () => {
    // リビール対象のセレクタ
    const revealSelectors = [
        '.section-tag',
        '.section-title',
        '.data-block',
        '.service-card',
        '.compact-skill-category',
        '.timeline-row',
        '.project-card',
        '.gallery-item',
        '.news-item',
        '.vision-lead',
        '.vision-text',
        '.vision-image',
        '.profile-video-card',
        '.skills-compact-wrap',
    ];

    revealSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            el.classList.add('reveal');
        });
    });

    // グリッド内の子要素にスタガー（時差アニメーション）を付与
    const staggerContainers = [
        '.services-grid',
        '.compact-skills-groups',
        '.gallery-grid',
        '.news-list',
        '.modern-grid',
        '.timeline-events',
    ];

    staggerContainers.forEach(containerSel => {
        document.querySelectorAll(containerSel).forEach(container => {
            container.querySelectorAll('.reveal').forEach((child, i) => {
                child.style.transitionDelay = `${i * 0.08}s`;
            });
        });
    });

    // Intersection Observer でビューポートに入ったらリビール
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // 一度だけ発火
            }
        });
    }, {
        threshold: 0.06,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
};

// ===== 2. アクティブナビ =====
// 現在表示中のセクションに対応するナビリンクをアクティブ化
const setupActiveNav = () => {
    const sections = document.querySelectorAll('section[id], footer[id]');
    const navLinks = document.querySelectorAll('.modern-nav a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        rootMargin: '-35% 0px -60% 0px',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
};

// ===== 3. ヘッダースクロール制御 =====
// スクロールしたらヘッダーに .scrolled を付けてシャドウを表示
const setupHeader = () => {
    const header = document.querySelector('.modern-header');
    if (!header) return;

    const onScroll = () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // 初期状態を反映
};

// ===== 4. スムーズスクロール（ヘッダー分のオフセット補正済み） =====
const setupSmoothScroll = () => {
    const headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '72'
    );

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.scrollY - headerH,
                    behavior: 'smooth'
                });
            }
        });
    });
};

// ===== 5. マグネティックボタン =====
const setupMagneticButtons = () => {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) * 0.35;
            const y = (e.clientY - rect.top - rect.height / 2) * 0.35;
            btn.style.transform = `translate(${x}px, ${y}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });
};

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    setupReveal();
    setupActiveNav();
    setupHeader();
    setupSmoothScroll();
    setupMagneticButtons();
    console.log('ODAKUTO Portfolio v4.0 Active');
});
