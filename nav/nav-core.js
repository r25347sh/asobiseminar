// 埋め込み先サイトへナビ要素をすべて自動挿入するWidget機能
function injectNavElements() {
    // 1. 操作説明テキストの自動生成
    const ins = document.createElement('div');
    ins.className = 'magic-nav-instruction';
    ins.innerHTML = '【PC】素早くトリプルクリック<br>【スマホ】0.4秒 長押しタップ<br>魔導メニューが固定表示されます';
    document.body.appendChild(ins);

    // 2. 粒子キャンバスの自動生成
    const cvs = document.createElement('canvas');
    cvs.id = 'particleCanvas';
    document.body.appendChild(cvs);

    // 3. メニューコンテナの自動生成
    const ctn = document.createElement('div');
    ctn.id = 'menu-container';
    document.body.appendChild(ctn);

    // 4. 有機結合SVGフィルターの自動生成
    const svgNS = "http://w3.org";
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'magic-nav-filter-svg');

    svg.innerHTML = `
        <defs>
            <filter id="gooey">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
        </defs>
    `;
    document.body.appendChild(svg);

    // パーツ2（nav-particle.js）のシステムを初期化起動
    if (typeof initParticleSystem === 'function') {
        initParticleSystem();
    }
}

// ページ読み込み完了時に自動挿入を実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNavElements);
} else {
    injectNavElements();
}

const menuData = [
    { text: 'ホーム', url: '/asobiseminar/index.html' },
    { text: 'メンバー', url: '/asobiseminar/subpages/members.html' },
    {
        text: 'Groups',
        children: [
            { text: '目次', url: '/asobiseminar/subpages/groups/index.html' },
            { text: 'スケボー', url: '/asobiseminar/subpages/groups/one.html' },
            { text: '建築', url: '/asobiseminar/subpages/groups/two.html' },
            { text: 'ファッション', url: '/asobiseminar/subpages/groups/three.html' },
            { text: 'プログラマ', url: '/asobiseminar/subpages/groups/programmer.html' }
        ]
    },
    { text: 'ここについて', url: '/asobiseminar/subpages/about.html', isLong: true },
    { text: 'ギャラリー', url: '/asobiseminar/subpages/gallery.html' },
    { text: 'テーマ設定', url: '/asobiseminar/settigs.html' }
];

let pressTimer = null;
let clickCount = 0;
let lastClickTime = 0;
let isTouchMode = false;
let lockEvent = false;
let isPressing = false; // 新規追加
let isLongPressMenuOpen = false; // 新規追加

function spawnMenu(centerX, centerY) {
    const container = document.getElementById('menu-container');
    if (!container) return;

    clearTimeout(pressTimer);
    isPressing = false;
    menuOpen = true;
    lockEvent = true;
    container.innerHTML = '';

    for (let i = 0; i < 120; i++) {
        particles.push(new Particle(centerX, centerY, true));
    }

    menuData.forEach((item, index) => {
        const angle = (index / menuData.length) * Math.PI * 2 - Math.PI / 2;
        const targetX = centerX + Math.cos(angle) * 135;
        const targetY = centerY + Math.sin(angle) * 135;

        const btn = document.createElement('div');
        btn.className = 'menu-item';
        btn.style.left = `${centerX}px`;
        btn.style.top = `${centerY}px`;
        btn.innerText = item.text;
        if (item.isLong) btn.style.fontSize = '0.6rem';
        container.appendChild(btn);

        setTimeout(() => {
            btn.classList.add('show');
            btn.style.left = `${targetX}px`;
            btn.style.top = `${targetY}px`;
        }, index * 40);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (lockEvent) return;
            if (item.children) {
                spawnSubMenu(targetX, targetY, item.children);
            } else {
                btn.style.transform = 'translate(-50%, -50%) scale(0)';
                setTimeout(() => {
                    location.href = item.url;
                    closeMenu(centerX, centerY);
                }, 200);
            }
        });
    });

    setTimeout(() => { lockEvent = false; }, 150);
}

function spawnSubMenu(parentX, parentY, children) {
    if (lockEvent) return;
    const container = document.getElementById('menu-container');
    document.querySelectorAll('.sub-menu-item').forEach(el => el.remove());

    children.forEach((child, index) => {
        const baseAngle = Math.atan2(parentY - touchY, parentX - touchX);
        const angle = (index / (children.length - 1)) * (Math.PI * 0.8) - (Math.PI * 0.4) + baseAngle;
        const targetX = parentX + Math.cos(angle) * 85;
        const targetY = parentY + Math.sin(angle) * 85;

        const subBtn = document.createElement('div');
        subBtn.className = 'menu-item sub-menu-item';
        subBtn.style.left = `${parentX}px`;
        subBtn.style.top = `${parentY}px`;
        subBtn.innerText = child.text;
        container.appendChild(subBtn);

        setTimeout(() => {
            subBtn.classList.add('show');
            subBtn.style.left = `${targetX}px`;
            subBtn.style.top = `${targetY}px`;
        }, index * 30);

        subBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (lockEvent) return;
            subBtn.style.transform = 'translate(-50%, -50%) scale(0)';
            setTimeout(() => {
                location.href = child.url;
                closeMenu(touchX, touchY);
            }, 200);
        });
    });
}

function closeMenu(targetX = touchX, targetY = touchY) {
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.style.left = `${targetX}px`;
        btn.style.top = `${targetY}px`;
        btn.classList.remove('show');
    });
    setTimeout(() => {
        const container = document.getElementById('menu-container');
        if (container) container.innerHTML = '';
        particles = [];
        menuOpen = false;
        isTouchMode = false;
        lockEvent = false;
    }, 400);
}

// startPress 関数を修正
function startPress(x, y) {
    if (menuOpen || lockEvent) return;
    isPressing = true;
    touchX = x;
    touchY = y;
    particles = [];
    pressTimer = setTimeout(() => { 
        if (isPressing) {
            spawnMenu(touchX, touchY);
            isLongPressMenuOpen = true; // 長押しでメニューが開かれたことを示すフラグを設定
        }
    }, 400);
}

// endPress 関数を修正
function endPress() {
    isPressing = false; // マウス/指が離されたので、押している状態をリセット
    clearTimeout(pressTimer); // 保留中のタイマーをクリア
    // メニューが既に開いている場合でも、タイマーをクリアする。
    // メニューを閉じるロジックはclickイベントリスナーで処理されるため、ここでは何もしない。
}

window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('selectstart', e => e.preventDefault());

// mousedown イベントリスナーを修正: トリプルクリックを削除し、長押しを実装
window.addEventListener('mousedown', (e) => {
    if (menuOpen || lockEvent || e.button !== 0 || isTouchMode) return;
    // トリプルクリックの代わりに長押しを開始
    startPress(e.clientX + window.scrollX, e.clientY + window.scrollY);
});

// mouseup イベントリスナーを修正: 常にendPressを呼び出すように変更
window.addEventListener('mouseup', () => {
    endPress();
});

window.addEventListener('touchstart', (e) => {
    if (!menuOpen && !lockEvent) {
        isTouchMode = true;
        const t = e.changedTouches;
        startPress(t[0].clientX + window.scrollX, t[0].clientY + window.scrollY);
    }
});
window.addEventListener('touchend', () => { 
    if (isTouchMode) { // isTouchModeがtrueの場合のみendPressを呼ぶ
        endPress();
    }
});

// click イベントリスナーを修正: 長押しで開かれたメニューに対する初回のクリックを無視
window.addEventListener('click', (e) => {
    if (lockEvent) return;

    // 長押しでメニューが開かれた直後のクリックイベントを無視する
    if (isLongPressMenuOpen) {
        isLongPressMenuOpen = false; // フラグをリセット
        return; // イベント処理を中断し、メニューが閉じられるのを防ぐ
    }

    if (menuOpen && !e.target.classList.contains('menu-item')) {
        closeMenu();
    }
});
