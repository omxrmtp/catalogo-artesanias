const PRODUCTOS_DEFAULT = [
    // === Oso de Anteojos ===
    { id: 1, nombre: 'Peluche Pequeño', subtitulo: 'Colección Oso de Anteojos', precio: 'S/ 10.00', modelo: 'peluche_pequeno_de_oso_de_anteojos.glb', coleccion: 'Colección Oso de Anteojos' },
    { id: 2, nombre: 'Peluche Estándar', subtitulo: 'Colección Oso de Anteojos', precio: 'S/ 25.00', modelo: 'peluche_de_oso_de_anteojos.glb', coleccion: 'Colección Oso de Anteojos' },
    { id: 3, nombre: 'Peluche Mediano', subtitulo: 'Colección Oso de Anteojos', precio: 'S/ 15.00', modelo: 'peluche_mediano_de_oso_de_anteojos.glb', coleccion: 'Colección Oso de Anteojos' },
    { id: 4, nombre: 'Llavero Cara', subtitulo: 'Colección Oso de Anteojos', precio: 'S/ 6.00', modelo: 'llavero_de_cara_de_oso_de_anteojos.glb', coleccion: 'Colección Oso de Anteojos' },
    { id: 5, nombre: 'Llavero Cuerpo Entero', subtitulo: 'Colección Oso de Anteojos', precio: 'S/ 7.00', modelo: 'llavero_de_oso_de_anteojos.glb', coleccion: 'Colección Oso de Anteojos' },
    { id: 6, nombre: 'Llavero de Putilla', subtitulo: 'Aves Regionales', precio: 'S/ 8.00', modelo: 'llavero_de_putilla.glb', coleccion: 'Colección Oso de Anteojos' },

    // === Zorro Costero ===
    { id: 7, nombre: 'Peluche Estándar', subtitulo: 'Colección Zorro Costero', precio: 'S/ 25.00', modelo: 'peluche_de_zorro_costero.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 8, nombre: 'Peluche Estándar', subtitulo: 'Colección Urraca de Cola Blanca', precio: 'S/ 25.00', modelo: 'peluche_de_urraca_de_cola_blanca.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 9, nombre: 'Peluche Estándar', subtitulo: 'Colección Pava Aliblanca', precio: 'S/ 25.00', modelo: 'peluche_de_pava_aliblanca.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 10, nombre: 'Peluche Pequeño', subtitulo: 'Colección Zorro Costero', precio: 'S/ 12.00', modelo: 'peluche_de_pequeno_de_zorro_costero.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 11, nombre: 'Peluche Pequeño', subtitulo: 'Colección Urraca de Cola Blanca', precio: 'S/ 12.00', modelo: 'peluche_pequeno_de_urraca_de_cola_blanca.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 12, nombre: 'Peluche Pequeño', subtitulo: 'Colección Pava Aliblanca', precio: 'S/ 25.00', modelo: 'peluche_pequeno_de_pava_aliblanca.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 13, nombre: 'Llavero Cuerpo Entero', subtitulo: 'Colección Zorro Costero', precio: 'S/ 6.00', modelo: 'llavero_de_zorro_costero.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 14, nombre: 'Llavero Cuerpo Entero', subtitulo: 'Colección Urraca de Cola Blanca', precio: 'S/ 8.00', modelo: 'llavero_de_urraca_de_cola_blanca.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 15, nombre: 'Llavero Cuerpo Entero', subtitulo: 'Colección Pava Aliblanca', precio: 'S/ 6.00', modelo: 'llavero_de_pava_aliblanca.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 16, nombre: 'Llavero Cara', subtitulo: 'Colección Zorro Costero', precio: 'S/ 5.00', modelo: 'llavero_de_cara_de_zorro_costero.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 17, nombre: 'Llavero Cara', subtitulo: 'Colección Urraca de Cola Blanca', precio: 'S/ 5.00', modelo: 'llavero_de_cara_de_urraca_de_cola_blanca.glb', coleccion: 'Prototipo de Productos - Fauna Regional' },
    { id: 18, nombre: 'Llavero Cara', subtitulo: 'Colección Pava Aliblanca', precio: 'S/ 6.00', modelo: 'llavero_de_cara_de_pava_aliblanca.glb', coleccion: 'Prototipo de Productos - Fauna Regional' }
];

var PRODUCTOS_VERSION = 2;

function obtenerProductos() {
    const guardados = localStorage.getItem('artesanias_productos');
    if (guardados) {
        try {
            const parsed = JSON.parse(guardados);
            if (parsed.version === PRODUCTOS_VERSION) return parsed.productos;
        } catch (e) {}
    }
    return [...PRODUCTOS_DEFAULT];
}

function guardarProductos(productos) {
    localStorage.setItem('artesanias_productos', JSON.stringify({
        version: PRODUCTOS_VERSION,
        productos: productos
    }));
}

function generarId(productos) {
    if (productos.length === 0) return 1;
    return Math.max(...productos.map(p => p.id)) + 1;
}

// Configura aquí tu número de WhatsApp (código de país + número, sin signos)
// Ejemplo: '51987654321' para Perú
const WHATSAPP_NUMBER = '51978836377';
const WHATSAPP_LINK = 'https://w.app/t3rdbk';
