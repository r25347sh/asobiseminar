// 描く用スクリプト
// nav-particle.js 先頭
window.particleSystemReady = true;

let canvas, ctx;
let particles = [];
let isPressing = false;
let menuOpen = false;
let touchX = 0;
let touchY = 0;

// CSSの変数から色（Hue）を取得
function getMagicHue() {
    const rootStyle = getComputedStyle(document.documentElement);
    return parseFloat(rootStyle.getPropertyValue('--magic-particle-hue').trim()) || 185;
}

class Particle {
    constructor(targetX, targetY, forceOrbit = false) {
        this.targetX = targetX;
        this.targetY = targetY;
        
        if (forceOrbit) {
            this.angle = Math.random() * Math.PI * 2;
            this.currentRadius = 135;
            this.x = targetX + Math.cos(this.angle) * this.currentRadius;
            this.y = targetY + Math.sin(this.angle) * this.currentRadius;
            this.isOrbiting = true;
        } else {
            // 画面端 or 画面内ランダムのハイブリッド発生
            const width = window.innerWidth;
            const height = window.innerHeight;
            if (Math.random() < 0.5) {
                const edge = Math.floor(Math.random() * 4);
                if (edge === 0) { this.x = Math.random() * width; this.y = -20; }
                else if (edge === 1) { this.x = width + 20; this.y = Math.random() * height; }
                else if (edge === 2) { this.x = Math.random() * width; this.y = height + 20; }
                else { this.x = -20; this.y = Math.random() * height; }
            } else {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
            }
            
            this.angle = Math.atan2(this.y - targetY, this.x - targetX);
            this.currentRadius = Math.hypot(this.x - targetX, this.y - targetY);
            this.isOrbiting = false;
        }
        
        this.size = Math.random() * 2.5 + 1.5;
        this.speed = Math.random() * 0.16 + 0.12; 
        this.orbitRadius = 135;
        this.rotSpeed = (Math.random() * 0.06 + 0.04) * (Math.random() > 0.5 ? 1 : -1);
        this.magicPattern = Math.floor(Math.random() * 4);
        
        const baseHue = getMagicHue();
        this.hue = baseHue + (Math.random() * 25 - 12.5);
        this.history = [];
    }

    update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 4) this.history.shift();

        if (!this.isOrbiting) {
            this.currentRadius += (this.orbitRadius - this.currentRadius) * this.speed;
            this.angle += 0.07; 
            this.x = this.targetX + Math.cos(this.angle) * this.currentRadius;
            this.y = this.targetY + Math.sin(this.angle) * this.currentRadius;
            
            if (Math.abs(this.currentRadius - this.orbitRadius) < 5) {
                this.isOrbiting = true;
            }
        } else {
            this.angle += this.rotSpeed;
            let modifier = 0;
            if (this.magicPattern === 0) modifier = Math.sin(this.angle * 6) * 16;
            else if (this.magicPattern === 1) modifier = Math.cos(this.angle * 4) * 10;
            else if (this.magicPattern === 2) modifier = Math.sin(this.angle * 16) * 5;
            else modifier = Math.sin(this.angle * 2) * 25;
            
            this.x = this.targetX + Math.cos(this.angle) * (this.orbitRadius + modifier);
            this.y = this.targetY + Math.sin(this.angle) * (this.orbitRadius + modifier);
        }
    }

    draw() {
        const hLen = this.history.length;
        if (hLen > 1) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 1; i < hLen; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            ctx.strokeStyle = `hsla(${this.hue}, 100%, 70%, 0.18)`;
            ctx.lineWidth = this.size * 0.6;
            ctx.stroke();
        }

        const colorBase = `hsla(${this.hue}, 100%, 75%`;
        ctx.fillStyle = `${colorBase}, 0.2)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `${colorBase}, 0.95)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticleSystem() {
    canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'screen';
        
        if (isPressing && !menuOpen) {
            if (particles.length < 50) {
                for(let i = 0; i < 2; i++) {
                    particles.push(new Particle(touchX, touchY));
                }
            }
        }
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
}
