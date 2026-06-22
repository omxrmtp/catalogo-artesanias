const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// === LOGIN ===
const loginSection = document.getElementById('loginSection');
const panelSection = document.getElementById('panelSection');
const loginForm = document.getElementById('loginForm');
const loginMensaje = document.getElementById('loginMensaje');
const btnLogout = document.getElementById('btnLogout');

function verificarSesion() {
    return sessionStorage.getItem('admin_logged') === 'true';
}

function mostrarLogin() {
    loginSection.classList.remove('oculto');
    panelSection.classList.add('oculto');
}

function mostrarPanel() {
    loginSection.classList.add('oculto');
    panelSection.classList.remove('oculto');
    renderizarTabla();
    actualizarOpcionesColeccion();
}

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem('admin_logged', 'true');
        loginMensaje.className = 'mensaje';
        mostrarPanel();
    } else {
        loginMensaje.className = 'mensaje error';
        loginMensaje.textContent = 'Usuario o contraseña incorrectos.';
    }
});

btnLogout.addEventListener('click', function() {
    sessionStorage.removeItem('admin_logged');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    mostrarLogin();
});

if (verificarSesion()) {
    mostrarPanel();
} else {
    mostrarLogin();
}

// === CRUD PRODUCTOS ===
const formProducto = document.getElementById('formProducto');
const editId = document.getElementById('editId');
const nombre = document.getElementById('nombre');
const subtitulo = document.getElementById('subtitulo');
const precio = document.getElementById('precio');
const coleccion = document.getElementById('coleccion');
const modelo = document.getElementById('modelo');
const modeloFile = document.getElementById('modeloFile');
const previewModel = document.getElementById('preview-model');
const previewContainer = document.getElementById('modelo-preview-container');
let currentBlob = null;
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');
const tablaBody = document.getElementById('tablaBody');
const panelMensaje = document.getElementById('panelMensaje');

function mostrarMensaje(texto, tipo) {
    panelMensaje.textContent = texto;
    panelMensaje.className = 'mensaje ' + tipo;
    setTimeout(() => {
        panelMensaje.className = 'mensaje';
    }, 3000);
}

function renderizarTabla() {
    const productos = obtenerProductos();
    if (productos.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--accent-color);">No hay productos registrados.</td></tr>';
        return;
    }
    tablaBody.innerHTML = '';
    productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.coleccion}</td>
            <td>${p.precio}</td>
            <td style="font-size:0.85rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.modelo}">${p.modelo}</td>
            <td>
                <div class="acciones-cell">
                    <button class="btn btn-editar" data-id="${p.id}" style="font-size:0.85rem;padding:6px 14px;">Editar</button>
                    <button class="btn btn-danger btn-eliminar" data-id="${p.id}" style="font-size:0.85rem;padding:6px 14px;">Eliminar</button>
                </div>
            </td>
        `;
        tablaBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const productos = obtenerProductos();
            const p = productos.find(x => x.id === id);
            if (p) cargarFormulario(p);
        });
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            if (confirm('¿Eliminar este producto?')) {
                eliminarProducto(id);
            }
        });
    });
}

function actualizarOpcionesColeccion() {
    const productos = obtenerProductos();
    const colecciones = [...new Set(productos.map(p => p.coleccion))];
    const select = document.getElementById('coleccion');
    const valorActual = select.value;
    select.innerHTML = '<option value="">Seleccionar colección...</option>';
    colecciones.sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
    select.value = valorActual;
}

function cargarFormulario(p) {
    editId.value = p.id;
    nombre.value = p.nombre;
    subtitulo.value = p.subtitulo;
    precio.value = p.precio;
    coleccion.value = p.coleccion;
    modelo.value = p.modelo;
    btnGuardar.textContent = 'Actualizar Producto';
    btnCancelar.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentBlob) {
        URL.revokeObjectURL(currentBlob);
        currentBlob = null;
    }
    modeloFile.value = '';
    if (p.modelo) {
        previewModel.src = '../assets/' + p.modelo;
        previewContainer.classList.remove('oculto');
    } else {
        previewContainer.classList.add('oculto');
        previewModel.src = '';
    }
}

function limpiarFormulario() {
    editId.value = '';
    nombre.value = '';
    subtitulo.value = '';
    precio.value = '';
    coleccion.value = '';
    modelo.value = '';
    btnGuardar.textContent = 'Guardar Producto';
    btnCancelar.style.display = 'none';
    if (currentBlob) {
        URL.revokeObjectURL(currentBlob);
        currentBlob = null;
    }
    modeloFile.value = '';
    previewContainer.classList.add('oculto');
    previewModel.src = '';
}

btnCancelar.addEventListener('click', limpiarFormulario);

modeloFile.addEventListener('change', function() {
    if (currentBlob) {
        URL.revokeObjectURL(currentBlob);
        currentBlob = null;
    }
    const file = this.files[0];
    if (!file) {
        previewContainer.classList.add('oculto');
        previewModel.src = '';
        return;
    }
    modelo.value = file.name;
    currentBlob = URL.createObjectURL(file);
    previewModel.src = currentBlob;
    previewContainer.classList.remove('oculto');
});

formProducto.addEventListener('submit', function(e) {
    e.preventDefault();

    const id = editId.value ? parseInt(editId.value) : null;
    const datos = {
        nombre: nombre.value.trim(),
        subtitulo: subtitulo.value.trim(),
        precio: precio.value.trim(),
        coleccion: coleccion.value.trim(),
        modelo: modelo.value.trim()
    };

    if (!datos.nombre || !datos.subtitulo || !datos.precio || !datos.coleccion || !datos.modelo) {
        mostrarMensaje('Todos los campos son obligatorios.', 'error');
        return;
    }

    let productos = obtenerProductos();

    if (id) {
        const idx = productos.findIndex(p => p.id === id);
        if (idx !== -1) {
            productos[idx] = { ...productos[idx], ...datos };
            mostrarMensaje('Producto actualizado correctamente.', 'exito');
        }
    } else {
        datos.id = generarId(productos);
        productos.push(datos);
        mostrarMensaje('Producto agregado correctamente.', 'exito');
    }

    guardarProductos(productos);
    limpiarFormulario();
    renderizarTabla();
    actualizarOpcionesColeccion();
});

function eliminarProducto(id) {
    let productos = obtenerProductos();
    productos = productos.filter(p => p.id !== id);
    guardarProductos(productos);
    renderizarTabla();
    actualizarOpcionesColeccion();
    mostrarMensaje('Producto eliminado correctamente.', 'exito');
}

// Canvas leaf overlay
var leafContainer = document.getElementById('leaf-container');
if (leafContainer) {
    var leafCanvas = document.createElement('canvas');
    var leafCtx = leafCanvas.getContext('2d');
    leafCanvas.style.cssText = 'display:block;position:absolute;inset:0;opacity:0;transition:opacity 1.2s ease;width:100%;height:100%;';
    leafContainer.appendChild(leafCanvas);

    var lw, lh, hojas = [], corriendo = false;
    var maxHojas = 30;
    var colores = ['#3b5240','#7fa185','#5a7a5e','#4a7a4e','#6b9a6f','#8db892','#2d5a32'];

    function redimensionar() {
        lw = leafContainer.clientWidth;
        lh = leafContainer.clientHeight;
        leafCanvas.width = lw;
        leafCanvas.height = lh;
    }
    redimensionar();
    window.addEventListener('resize', redimensionar);

    function crearHojaCanvas() {
        if (hojas.length >= maxHojas) return;
        var tam = 12 + Math.random() * 18;
        hojas.push({
            x: Math.random() * (lw + 100) - 50,
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

    function dibujarHojaCanvas(p) {
        var oscilacionX = Math.sin(p.fase + p.y * 0.02) * p.vaiven * 0.01 * p.y;
        var x = p.x + oscilacionX;
        var y = p.y;
        var s = p.tam * 0.03;

        leafCtx.save();
        leafCtx.translate(x, y);
        leafCtx.rotate(p.rotacion * Math.PI / 180);
        leafCtx.scale(s, s);
        leafCtx.globalAlpha = p.opacidad;

        leafCtx.beginPath();
        leafCtx.moveTo(13, 1);
        leafCtx.bezierCurveTo(6, 7, 2, 16, 2, 22);
        leafCtx.bezierCurveTo(2, 27, 6, 29, 13, 29);
        leafCtx.bezierCurveTo(20, 29, 24, 27, 24, 22);
        leafCtx.bezierCurveTo(24, 16, 20, 7, 13, 1);
        leafCtx.closePath();
        leafCtx.fillStyle = p.color;
        leafCtx.fill();

        leafCtx.beginPath();
        leafCtx.moveTo(13, 1);
        leafCtx.lineTo(13, 29);
        leafCtx.strokeStyle = 'rgba(255,255,255,0.15)';
        leafCtx.lineWidth = 0.5;
        leafCtx.stroke();

        leafCtx.beginPath();
        leafCtx.moveTo(13, 7);
        leafCtx.lineTo(8, 11);
        leafCtx.moveTo(13, 11);
        leafCtx.lineTo(7, 16);
        leafCtx.moveTo(13, 16);
        leafCtx.lineTo(8, 20);
        leafCtx.moveTo(13, 7);
        leafCtx.lineTo(18, 11);
        leafCtx.moveTo(13, 11);
        leafCtx.lineTo(19, 16);
        leafCtx.moveTo(13, 16);
        leafCtx.lineTo(18, 20);
        leafCtx.strokeStyle = 'rgba(255,255,255,0.1)';
        leafCtx.lineWidth = 0.3;
        leafCtx.stroke();

        leafCtx.restore();
    }

    function animarHojas() {
        leafCtx.clearRect(0, 0, lw, lh);
        for (var i = hojas.length - 1; i >= 0; i--) {
            var p = hojas[i];
            p.y += p.velocidad;
            p.rotacion += p.rotVel;
            if (p.y > lh + 40) { hojas.splice(i, 1); continue; }
            dibujarHojaCanvas(p);
        }
        if (hojas.length < maxHojas && Math.random() < 0.3) crearHojaCanvas();
        if (corriendo) requestAnimationFrame(animarHojas);
    }

    for (var i = 0; i < 16; i++) {
        (function(d) { setTimeout(function() { if (!corriendo) return; for (var j=0;j<2;j++) crearHojaCanvas(); }, d); })(i * 120);
    }

    corriendo = true;
    requestAnimationFrame(animarHojas);
    leafCanvas.style.opacity = '0.85';

    setTimeout(function() {
        leafCanvas.style.transition = 'opacity 2s ease';
        leafCanvas.style.opacity = '0';
        setTimeout(function() {
            corriendo = false;
            leafContainer.style.display = 'none';
        }, 2200);
    }, 10000);
}

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
    for (var i = 0; i < 22; i++) { setTimeout(crear, i * 200); }
    setInterval(crear, 900);
}
