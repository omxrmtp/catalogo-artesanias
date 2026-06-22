let carrito = [];

function isMobile() {
    return window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024);
}

function esConexionLenta() {
    if (!navigator.connection) return false;
    return ['slow-2g', '2g'].includes(navigator.connection.effectiveType);
}

var maxViewersActivos = 2;

function renderizarCatalogo() {
    const productos = obtenerProductos();
    const main = document.querySelector('main');
    if (!main) return;

    main.innerHTML = '';

    if (productos.length === 0) {
        main.innerHTML = '<div class="producto-vacio">No hay productos disponibles en este momento.</div>';
        return;
    }

    const colecciones = {};
    productos.forEach(p => {
        if (!colecciones[p.coleccion]) colecciones[p.coleccion] = [];
        colecciones[p.coleccion].push(p);
    });

    let cardIndex = 0;

    Object.keys(colecciones).forEach(coleccion => {
        const items = colecciones[coleccion];
        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = coleccion;
        main.appendChild(title);

        const container = document.createElement('div');
        container.className = 'catalog-container';

        items.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.setProperty('--i', cardIndex);

            card.innerHTML = `
                <div class="card-viewer-wrapper" data-model="${p.modelo}">
                    <div class="instruction-badge">⟳ Rota en 3D</div>
                    <div class="model-placeholder">
                        <div class="model-skeleton"></div>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-title">${p.nombre}</div>
                    <div class="product-subtitle">${p.subtitulo}</div>
                    <div class="product-meta">
                        <div class="product-price">${p.precio}</div>
                        <button class="btn-cart-add" data-id="${p.id}" data-nombre="${p.nombre}" data-sub="${p.subtitulo}" data-precio="${p.precio}">Agregar</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
            cardIndex++;
        });

        main.appendChild(container);
    });

    document.querySelectorAll('.btn-cart-add').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const nombre = this.dataset.nombre;
            const subtitulo = this.dataset.sub;
            const precio = this.dataset.precio;
            agregarAlCarrito({ id, nombre, subtitulo, precio });
        });
    });

    lazyLoadModels();
    animateCards();
}

function agregarAlCarrito(producto) {
    const existente = carrito.find(p => p.id === producto.id);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    actualizarCarritoUI();
    animarBotonCarrito();
}

function quitarDelCarrito(id) {
    const idx = carrito.findIndex(p => p.id === id);
    if (idx !== -1) {
        if (carrito[idx].cantidad > 1) {
            carrito[idx].cantidad--;
        } else {
            carrito.splice(idx, 1);
        }
    }
    actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(p => p.id !== id);
    actualizarCarritoUI();
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarritoUI();
}

function obtenerTotal() {
    let total = 0;
    carrito.forEach(p => {
        const num = parseFloat(p.precio.replace('S/ ', '').replace(',', ''));
        total += num * p.cantidad;
    });
    return total;
}

function formatearPrecio(num) {
    return 'S/ ' + num.toFixed(2);
}

function generarMensajeWhatsApp() {
    if (carrito.length === 0) return '';
    let msg = '¡Hola! Quiero hacer un pedido:\n\n';
    carrito.forEach((p, i) => {
        msg += (i + 1) + '. ' + p.nombre;
        if (p.cantidad > 1) msg += ' (x' + p.cantidad + ')';
        const num = parseFloat(p.precio.replace('S/ ', '').replace(',', ''));
        msg += ' - ' + formatearPrecio(num * p.cantidad) + '\n';
    });
    msg += '\nTotal: ' + formatearPrecio(obtenerTotal());
    return msg;
}

function enviarPedidoWhatsApp() {
    const msg = generarMensajeWhatsApp();
    if (!msg) return;

    if (WHATSAPP_NUMBER) {
        window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
    } else {
        window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg), '_blank');
    }
}

function toggleCarritoPanel() {
    const panel = document.getElementById('cart-panel');
    const overlay = document.getElementById('cart-overlay');
    panel.classList.toggle('abierto');
    overlay.classList.toggle('visible');
    document.body.style.overflow = panel.classList.contains('abierto') ? 'hidden' : '';
}

function actualizarCarritoUI() {
    const count = carrito.reduce((sum, p) => sum + p.cantidad, 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle('visible', count > 0);
    }

    const fab = document.getElementById('cart-fab');
    if (fab) {
        fab.classList.toggle('con-items', count > 0);
    }

    const contenedor = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-price');
    const orderBtn = document.getElementById('cart-order-btn');
    const vacioEl = document.getElementById('cart-vacio');

    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = '';
        if (vacioEl) vacioEl.style.display = 'block';
        if (totalEl) totalEl.textContent = 'S/ 0.00';
        if (orderBtn) orderBtn.disabled = true;
        return;
    }

    if (vacioEl) vacioEl.style.display = 'none';

    contenedor.innerHTML = '';
    carrito.forEach(p => {
        const num = parseFloat(p.precio.replace('S/ ', '').replace(',', ''));
        const sub = num * p.cantidad;

        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${p.nombre}</div>
                <div class="cart-item-sub">${p.subtitulo}</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" data-id="${p.id}" data-action="minus">−</button>
                <span>${p.cantidad}</span>
                <button class="qty-btn" data-id="${p.id}" data-action="plus">+</button>
            </div>
            <div class="cart-item-price-cell">${formatearPrecio(sub)}</div>
            <button class="cart-item-remove" data-id="${p.id}" title="Eliminar">✕</button>
        `;
        contenedor.appendChild(item);
    });

    document.querySelectorAll('.qty-btn[data-action="minus"]').forEach(btn => {
        btn.addEventListener('click', function() {
            quitarDelCarrito(parseInt(this.dataset.id));
        });
    });

    document.querySelectorAll('.qty-btn[data-action="plus"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const p = carrito.find(x => x.id === parseInt(this.dataset.id));
            if (p) agregarAlCarrito(p);
        });
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            eliminarDelCarrito(parseInt(this.dataset.id));
        });
    });

    if (totalEl) totalEl.textContent = formatearPrecio(obtenerTotal());
    if (orderBtn) orderBtn.disabled = false;
}

function animarBotonCarrito() {
    const fab = document.getElementById('cart-fab');
    if (!fab) return;
    fab.classList.remove('pop');
    void fab.offsetWidth;
    fab.classList.add('pop');
}

function animateCards() {
    const cards = document.querySelectorAll('.product-card');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -40px 0px' });

        cards.forEach(c => observer.observe(c));
    } else {
        cards.forEach(c => c.classList.add('visible'));
    }
}

function lazyLoadModels() {
    const wrappers = document.querySelectorAll('.card-viewer-wrapper');

    if (isMobile()) {
        wrappers.forEach(w => {
            const badge = w.querySelector('.instruction-badge');
            if (badge) badge.textContent = '👆 Toca para ver en 3D';
            w.style.cursor = 'pointer';
            w.addEventListener('click', function onClick() {
                w.removeEventListener('click', onClick);
                cargarModelo(w);
            }, { once: true });
        });
    } else if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    cargarModelo(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '400px' });
        wrappers.forEach(w => observer.observe(w));
    } else {
        wrappers.forEach(cargarModelo);
    }
}

function cargarModelo(wrapper) {
    if (wrapper.dataset.cargando === 'true') return;
    wrapper.dataset.cargando = 'true';

    const modelName = wrapper.dataset.model;
    if (!modelName) return;

    const mobile = isMobile();

    if (mobile && esConexionLenta()) {
        const ph = wrapper.querySelector('.model-placeholder');
        if (ph) ph.innerHTML = '<div class="model-error" style="font-size:0.85rem;padding:20px;">Conexión muy lenta.<br>Ver disponible en desktop.</div>';
        const badge = wrapper.querySelector('.instruction-badge');
        if (badge) badge.textContent = '🌐 No disponible';
        return;
    }

    const viewer = document.createElement('model-viewer');
    viewer.className = 'model-viewer lazy';
    viewer.setAttribute('alt', 'Modelo 3D');

    if (mobile) {
        viewer.setAttribute('reveal', 'auto');
        viewer.setAttribute('loading', 'eager');
    } else {
        viewer.setAttribute('camera-controls', '');
        viewer.setAttribute('auto-rotate', '');
        viewer.setAttribute('shadow-intensity', '1');
        viewer.setAttribute('exposure', '1');
        viewer.setAttribute('reveal', 'auto');
        viewer.setAttribute('loading', 'eager');
    }

    const ruta = 'assets/' + modelName;

    viewer.addEventListener('load', function onLoad() {
        viewer.classList.add('loaded');
        const ph = wrapper.querySelector('.model-placeholder');
        if (ph) ph.style.display = 'none';
        viewer.removeEventListener('load', onLoad);
        if (mobile) limpiarViewersViejos(wrapper);
    });

    viewer.addEventListener('error', function onError(e) {
        const ph = wrapper.querySelector('.model-placeholder');
        if (ph) {
            const detalle = e.detail ? e.detail.toString() : '';
            if (detalle.includes('404') || detalle.includes('not found')) {
                ph.innerHTML = '<div class="model-error">Archivo no encontrado: ' + modelName + '</div>';
            } else if (detalle.includes('CORS') || detalle.includes('NetworkError')) {
                ph.innerHTML = '<div class="model-error">Debes usar un servidor local. Ejecuta <strong>servidor.bat</strong></div>';
            } else {
                ph.innerHTML = '<div class="model-error">Error al cargar el modelo 3D</div>';
            }
        }
        viewer.removeEventListener('error', onError);
    });

    wrapper.insertBefore(viewer, wrapper.firstChild);

    requestAnimationFrame(function () {
        viewer.setAttribute('src', ruta);
    });
}

function limpiarViewersViejos(exceptoWrapper) {
    var loaded = document.querySelectorAll('model-viewer.loaded');
    if (loaded.length <= maxViewersActivos) return;

    var viewportCenter = window.innerHeight / 2 + window.scrollY;
    var items = Array.from(loaded)
        .map(function(v) {
            var rect = v.getBoundingClientRect();
            return {
                el: v,
                wrapper: v.parentElement,
                dist: Math.abs(rect.top + rect.height / 2 + window.scrollY - viewportCenter)
            };
        })
        .filter(function(x) { return x.wrapper && x.wrapper !== exceptoWrapper; })
        .sort(function(a, b) { return b.dist - a.dist; });

    while (loaded.length > maxViewersActivos) {
        var item = items.shift();
        if (!item || !item.wrapper) break;
        var mv = item.wrapper.querySelector('model-viewer');
        if (mv) {
            mv.removeAttribute('src');
            mv.classList.remove('loaded');
            mv.remove();
            item.wrapper.dataset.cargando = 'false';
            loaded = document.querySelectorAll('model-viewer.loaded');
        }
    }
}

function initCarrito() {
    document.getElementById('cart-fab')?.addEventListener('click', toggleCarritoPanel);
    document.getElementById('cart-close')?.addEventListener('click', toggleCarritoPanel);
    document.getElementById('cart-overlay')?.addEventListener('click', toggleCarritoPanel);
    document.getElementById('cart-order-btn')?.addEventListener('click', enviarPedidoWhatsApp);
}

document.addEventListener('DOMContentLoaded', function() {
    renderizarCatalogo();
    initCarrito();
    initHojaOverlay();
});

function initHojaOverlay() {
    var container = document.getElementById('leaf-container');
    if (!container) return;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;opacity:0;transition:opacity 1.2s ease;width:100%;height:100%;';
    container.appendChild(canvas);

    var w, h, hojas = [], corriendo = false;
    var maxHojas = isMobile() ? 10 : 35;

    var colores = ['#3b5240','#7fa185','#5a7a5e','#4a7a4e','#6b9a6f','#8db892','#2d5a32'];

    function redimensionar() {
        w = container.clientWidth;
        h = container.clientHeight;
        canvas.width = w;
        canvas.height = h;
    }
    redimensionar();
    window.addEventListener('resize', redimensionar);

    function crearHoja() {
        if (hojas.length >= maxHojas) return;
        var tam = 12 + Math.random() * 18;
        hojas.push({
            x: Math.random() * (w + 100) - 50,
            y: -tam - Math.random() * 40,
            tam: tam,
            velocidad: 0.4 + Math.random() * 0.6,
            rotacion: Math.random() * 360,
            rotVel: (Math.random() - 0.5) * 3,
            vaiven: (Math.random() - 0.5) * 60,
            fase: Math.random() * Math.PI * 2,
            opacidad: 0.3 + Math.random() * 0.45,
            color: colores[Math.floor(Math.random() * colores.length)]
        });
    }

    function dibujarHoja(p) {
        var oscilacionX = Math.sin(p.fase + p.y * 0.02) * p.vaiven * 0.01 * p.y;
        var x = p.x + oscilacionX;
        var y = p.y;
        var s = p.tam * 0.03;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rotacion * Math.PI / 180);
        ctx.scale(s, s);
        ctx.globalAlpha = p.opacidad;

        // Hoja orgánica - forma de hoja realista
        ctx.beginPath();
        ctx.moveTo(13, 1);
        ctx.bezierCurveTo(6, 7, 2, 16, 2, 22);
        ctx.bezierCurveTo(2, 27, 6, 29, 13, 29);
        ctx.bezierCurveTo(20, 29, 24, 27, 24, 22);
        ctx.bezierCurveTo(24, 16, 20, 7, 13, 1);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();

        // Vena central
        ctx.beginPath();
        ctx.moveTo(13, 1);
        ctx.lineTo(13, 29);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Venas laterales
        ctx.beginPath();
        ctx.moveTo(13, 7);
        ctx.lineTo(8, 11);
        ctx.moveTo(13, 11);
        ctx.lineTo(7, 16);
        ctx.moveTo(13, 16);
        ctx.lineTo(8, 20);
        ctx.moveTo(13, 7);
        ctx.lineTo(18, 11);
        ctx.moveTo(13, 11);
        ctx.lineTo(19, 16);
        ctx.moveTo(13, 16);
        ctx.lineTo(18, 20);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.3;
        ctx.stroke();

        ctx.restore();
    }

    function animar() {
        ctx.clearRect(0, 0, w, h);

        for (var i = hojas.length - 1; i >= 0; i--) {
            var p = hojas[i];
            p.y += p.velocidad;
            p.rotacion += p.rotVel;

            if (p.y > h + 40) {
                hojas.splice(i, 1);
                continue;
            }

            dibujarHoja(p);
        }

        if (hojas.length < maxHojas && Math.random() < 0.3) {
            crearHoja();
        }

        if (corriendo) requestAnimationFrame(animar);
    }

    // Ráfaga inicial
    for (var i = 0; i < 20; i++) {
        (function(delay) {
            setTimeout(function() {
                if (!corriendo) return;
                for (var j = 0; j < 2; j++) crearHoja();
            }, delay);
        })(i * 120);
    }

    // Mostrar canvas con fade in
    corriendo = true;
    requestAnimationFrame(animar);
    canvas.style.opacity = '0.85';

    // Ocultar después de 10s
    setTimeout(function() {
        canvas.style.transition = 'opacity 2s ease';
        canvas.style.opacity = '0';
        setTimeout(function() {
            corriendo = false;
            container.style.display = 'none';
        }, 2200);
    }, 10000);
}

// --- FALLBACK: hojas SVG animadas ---
function contenedorHojasSVG(container) {
    var colores = ['#3b5240','#7fa185','#5a7a5e','#c49a6c','#b8895e','#9daf8e'];
    function crear() {
        if (!container || !container.parentNode) return;
        var h = document.createElement('div');
        h.className = 'leaf';
        var tam = 16 + Math.random() * 20;
        var dur = 7 + Math.random() * 7;
        var del = Math.random() * 4;
        var col = colores[Math.floor(Math.random()*colores.length)];
        var rot = Math.random() * 360;
        var sway = 30 + Math.random() * 80;
        h.style.cssText = [
            'position:absolute',
            'top:-50px',
            'left:'+(Math.random()*100)+'%',
            'width:'+tam+'px',
            'height:'+tam+'px',
            'opacity:0',
            'pointer-events:none',
            '--rot:'+rot+'deg',
            '--sway:'+sway+'px',
            '--dur:'+dur+'s',
            '--delay:'+del+'s',
            'animation:leafFall var(--dur) ease-in var(--delay) forwards'
        ].join(';');
        h.innerHTML = '<svg viewBox="0 0 26 30" width="100%" height="100%"><path d="M13 2 C7 8 3 16 3 22 C3 27 7 29 13 29 C19 29 23 27 23 22 C23 16 19 8 13 2Z" fill="'+col+'" opacity="0.85"/><path d="M13 2 C10 8 8 14 8 20" stroke="'+col+'" stroke-width="0.6" fill="none" opacity="0.2"/><path d="M13 2 C16 8 18 14 18 20" stroke="'+col+'" stroke-width="0.6" fill="none" opacity="0.2"/></svg>';
        h.addEventListener('animationend', function(){h.remove()});
        container.appendChild(h);
    }
    for (var i = 0; i < 24; i++) { setTimeout(crear, i * 200); }
    setInterval(crear, 900);
}
