class LongPressMenu {
    constructor() {
        this.longPressTimer = null;
        this.pressStartTime = 0;
        this.isLongPress = false;
        this.longPressThreshold = 500; // milliseconds
        this.menuElement = null;
        this.startClientX = 0;
        this.startClientY = 0;
        this.init();
    }
    init() {
        document.addEventListener('mousedown', this.handlePressStart.bind(this));
        document.addEventListener('touchstart', this.handlePressStart.bind(this));
        document.addEventListener('mouseup', this.handlePressEnd.bind(this));
        document.addEventListener('touchend', this.handlePressEnd.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('touchmove', this.handleMove.bind(this));
        document.addEventListener('contextmenu', this.handleContextMenu.bind(this));

        // Hide menu if clicked anywhere else
        document.addEventListener('click', (event) => {
            if (this.menuElement && !this.menuElement.contains(event.target)) {
                this.hideMenu();
            }
        });
    }

    handlePressStart(event) {
        // Only trigger on primary button (left click) or touch
        if (event.type === 'mousedown' && event.button !== 0) return;

        event.preventDefault(); // Prevent default browser actions like drag on long press

        this.pressStartTime = Date.now();
        this.isLongPress = false;
        clearTimeout(this.longPressTimer);

        this.startClientX = event.clientX || event.touches[0].clientX;
        this.startClientY = event.clientY || event.touches[0].clientY;

        this.longPressTimer = setTimeout(() => {
            this.isLongPress = true;
            this.showMenu(this.startClientX, this.startClientY);
        }, this.longPressThreshold);
    }

    handlePressEnd(event) {
        clearTimeout(this.longPressTimer);
        if (!this.isLongPress) {
            // If it was a short press/click and no menu appeared, do nothing special.
            // If a menu was open (e.g. from a previous long press) and this was a short tap outside, it's handled by global click listener
        }
        this.isLongPress = false; // Reset for next press
    }

    handleMove(event) {
        if (this.longPressTimer && (Date.now() - this.pressStartTime < this.longPressThreshold)) {
            const currentX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : this.startClientX);
            const currentY = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : this.startClientY);
            const moveThreshold = 10; // Pixels

            if (Math.abs(currentX - this.startClientX) > moveThreshold || Math.abs(currentY - this.startClientY) > moveThreshold) {
                clearTimeout(this.longPressTimer);
            }
        }
    }

    handleContextMenu(event) {
        // Prevent default context menu during a potential long press or if our menu is active
        if (this.longPressTimer || this.isLongPress || (this.menuElement && this.menuElement.classList.contains('menu-visible'))) {
            event.preventDefault();
        }
    }

    createMenuElement(x, y) {
        // Remove existing menu if any
        if (this.menuElement) {
            this.menuElement.remove();
        }

        const menu = document.createElement('div');
        menu.id = 'long-press-menu';
        menu.className = 'menu-hidden'; // Start hidden
        // Adjust menu position to be centered on the press point or within bounds
        // This will be adjusted after content is added to know its size
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        // Example menu items with details
        const items = [
            { title: '設定', content: 'アカウント設定、プライバシー設定など...' },
            { title: 'ヘルプ', content: 'よくある質問、お問い合わせ、チュートリアル...' },
            {
                title: 'ツール', 
                subItems: [
                    { title: '新しいタブを開く', content: '新しいタブが開きます。' },
                    { title: 'ブックマーク', content: '現在のページをブックマークします。' },
                    { title: '履歴', content: '閲覧履歴を表示します。' }
                ]
            },
            { title: '終了', content: 'アプリケーションを終了します。' }
        ];

        items.forEach(itemData => {
            const details = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = itemData.title;
            details.appendChild(summary);

            if (itemData.content) {
                const p = document.createElement('p');
                p.textContent = itemData.content;
                details.appendChild(p);
            } else if (itemData.subItems) {
                const ul = document.createElement('ul');
                itemData.subItems.forEach(subItem => {
                    const li = document.createElement('li');
                    const subDetails = document.createElement('details');
                    const subSummary = document.createElement('summary');
                    subSummary.textContent = subItem.title;
                    subDetails.appendChild(subSummary);
                    const subP = document.createElement('p');
                    subP.textContent = subItem.content;
                    subDetails.appendChild(subP);
                    li.appendChild(subDetails);
                    ul.appendChild(li);
                });
                details.appendChild(ul);
            }
            menu.appendChild(details);
        });

        document.body.appendChild(menu);
        this.menuElement = menu;

        // Adjust menu position to keep it within viewport
        const menuRect = menu.getBoundingClientRect();
        let finalX = x;
        let finalY = y;

        if (menuRect.right > window.innerWidth) {
            finalX = window.innerWidth - menuRect.width - 10; // 10px padding from right
        }
        if (menuRect.bottom > window.innerHeight) {
            finalY = window.innerHeight - menuRect.height - 10; // 10px padding from bottom
        }
        if (menuRect.left < 0) {
            finalX = 10; // 10px padding from left
        }
        if (menuRect.top < 0) {
            finalY = 10; // 10px padding from top
        }

        menu.style.left = `${finalX}px`;
        menu.style.top = `${finalY}px`;
    }

    showMenu(x, y) {
        this.animateParticles(x, y);
        this.createMenuElement(x, y);

        // Wait for a moment to allow particles to start animating, then show menu
        setTimeout(() => {
            if (this.menuElement) {
                this.menuElement.classList.remove('menu-hidden');
                this.menuElement.classList.add('menu-visible');
            }
        }, 300); // Give particles some time to gather
    }

    hideMenu() {
        if (this.menuElement) {
            this.menuElement.classList.remove('menu-visible');
            this.menuElement.classList.add('menu-hidden');
            // Allow time for fade out animation before removing
            this.menuElement.addEventListener('transitionend', () => {
                if (this.menuElement && this.menuElement.classList.contains('menu-hidden')) {
                    this.menuElement.remove();
                    this.menuElement = null;
                    this.removeParticles(); // Clean up particles
                }
            }, { once: true });
        }
    }

    animateParticles(targetX, targetY) {
        this.removeParticles(); // Clear previous particles

        const numParticles = 40;
        const container = document.createElement('div');
        container.id = 'particle-container';
        document.body.appendChild(container);

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Randomize starting position from screen edges or random mid-screen points
            let startX, startY;
            const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

            if (Math.random() < 0.7) { // 70% from edges
                 switch (edge) {
                    case 0: // Top
                        startX = Math.random() * viewportWidth;
                        startY = -20; // Slightly off-screen
                        break;
                    case 1: // Right
                        startX = viewportWidth + 20;
                        startY = Math.random() * viewportHeight;
                        break;
                    case 2: // Bottom
                        startX = Math.random() * viewportWidth;
                        startY = viewportHeight + 20;
                        break;
                    case 3: // Left
                        startX = -20;
                        startY = Math.random() * viewportHeight;
                        break;
                 }
            } else { // 30% from mid-screen random points
                startX = Math.random() * viewportWidth;
                startY = Math.random() * viewportHeight;
            }

            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;

            // Calculate offset to move towards targetX, targetY
            const offsetX = targetX - startX;
            const offsetY = targetY - startY;

            particle.style.setProperty('--offset-x', `${offsetX}px`);
            particle.style.setProperty('--offset-y', `${offsetY}px`);
            particle.style.setProperty('--animation-delay', `${Math.random() * 0.4}s`);
            particle.style.setProperty('--particle-size', `${Math.random() * 4 + 2}px`); // 2-6px
            particle.style.setProperty('--animation-duration', `${Math.random() * 0.8 + 0.8}s`); // 0.8s to 1.6s duration

            container.appendChild(particle);
        }
    }

    removeParticles() {
        const container = document.getElementById('particle-container');
        if (container) {
            container.remove();
        }
    }
}

new LongPressMenu();
