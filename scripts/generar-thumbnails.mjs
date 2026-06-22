import * as THREE from 'three';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { createDecoderModule } from 'draco3d';
import createContext from 'gl';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const WIDTH = 300;
const HEIGHT = 300;
const BG_COLOR = 0xe2ebe2;
const THUMBS_DIR = 'assets/thumbs';

if (!fs.existsSync(THUMBS_DIR)) {
    fs.mkdirSync(THUMBS_DIR, { recursive: true });
}

function createRenderer() {
    const gl = createContext(WIDTH, HEIGHT, {
        preserveDrawingBuffer: true,
        alpha: false,
        antialias: true,
    });
    if (!gl) throw new Error('No se pudo crear contexto WebGL');

    const canvas = {
        width: WIDTH, height: HEIGHT, style: {},
        addEventListener: () => {}, removeEventListener: () => {},
        clientWidth: WIDTH, clientHeight: HEIGHT,
        getContext: (type) => type === 'webgl2' ? null : gl,
    };

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(BG_COLOR, 1);
    renderer.setSize(WIDTH, HEIGHT);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    return { renderer, gl };
}

function createThreeScene(doc) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG_COLOR);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2, 3, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-2, 1, -3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(-1, 2, -4);
    scene.add(rim);

    const meshes = doc.getRoot().listMeshes();

    for (const meshDef of meshes) {
        const primitives = meshDef.listPrimitives();
        const group = new THREE.Group();

        for (const prim of primitives) {
            const posAttr = prim.getAttribute('POSITION');
            const normAttr = prim.getAttribute('NORMAL');
            const uvAttr = prim.getAttribute('TEXCOORD_0');
            const indexAttr = prim.getIndices();

            if (!posAttr) continue;

            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.BufferAttribute(posAttr.getArray(), 3));

            if (normAttr) {
                geom.setAttribute('normal', new THREE.BufferAttribute(normAttr.getArray(), 3));
            } else {
                geom.computeVertexNormals();
            }

            if (uvAttr) {
                geom.setAttribute('uv', new THREE.BufferAttribute(uvAttr.getArray(), 2));
            }

            if (indexAttr) {
                geom.setIndex(new THREE.BufferAttribute(indexAttr.getArray(), 1));
            }

            const material = new THREE.MeshStandardMaterial({
                roughness: 0.6,
                metalness: 0.1,
                side: THREE.DoubleSide,
            });

            const mat = prim.getMaterial();
            if (mat) {
                const baseColor = mat.getBaseColorFactor();
                if (baseColor) {
                    material.color.setRGB(baseColor[0], baseColor[1], baseColor[2]);
                }
                material.roughness = mat.getRoughnessFactor();
                material.metalness = mat.getMetallicFactor();
                material.side = mat.getDoubleSided() ? THREE.DoubleSide : THREE.FrontSide;

                const tex = mat.getBaseColorTexture();
                if (tex) {
                    const img = tex.getImage();
                    if (img && img.length > 0) {
                        try {
                            const { data, info } = await sharp(img)
                                .ensureAlpha()
                                .raw()
                                .toBuffer({ resolveWithObject: true });

                            const threeTex = new THREE.DataTexture(
                                data, info.width, info.height, THREE.RGBAFormat
                            );
                            threeTex.needsUpdate = true;
                            material.map = threeTex;
                        } catch (e) {
                            // Texture decode failed, use color only
                        }
                    }
                }
            }

            const mesh = new THREE.Mesh(geom, material);
            group.add(mesh);
        }

        if (group.children.length > 0) {
            scene.add(group);
        }
    }

    return scene;
}

async function generateThumbnail(inputPath, outputPath) {
    const { renderer, gl } = createRenderer();
    const camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 0.01, 100);

    // Load GLB with @gltf-transform/core
    const io = new NodeIO();
    for (const Ext of ALL_EXTENSIONS) io._extensions.add(Ext);

    const decoderModule = await createDecoderModule();
    io.registerDependencies({ 'draco3d.decoder': decoderModule });

    const doc = await io.read(inputPath);

    const scene = await createThreeScene(doc);

    if (scene.children.filter(c => c.isGroup || c.isMesh).length === 0) {
        throw new Error('No se encontraron mallas en el modelo');
    }

    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.01);

    const dist = maxDim / (2 * Math.tan(camera.fov * Math.PI / 360)) * 1.5;
    camera.near = dist * 0.001;
    camera.far = dist * 10;
    camera.position.set(
        center.x + dist * 0.2,
        center.y + dist * 0.15,
        center.z + dist
    );
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);

    const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
    gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Flip Y axis
    const flipped = new Uint8Array(WIDTH * HEIGHT * 4);
    for (let y = 0; y < HEIGHT; y++) {
        const srcRow = (HEIGHT - 1 - y) * WIDTH * 4;
        const dstRow = y * WIDTH * 4;
        for (let x = 0; x < WIDTH * 4; x++) {
            flipped[dstRow + x] = pixels[srcRow + x];
        }
    }

    await sharp(flipped, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } })
        .flatten({ background: '#e2ebe2' })
        .webp({ quality: 85 })
        .toFile(outputPath);

    try { renderer.dispose(); } catch (e) {}
    gl.destroy();
}

async function main() {
    const args = process.argv.slice(2);
    let files;

    if (args.length > 0) {
        files = args.map(f => path.basename(f)).filter(f => f.endsWith('.glb'));
    } else {
        files = fs.readdirSync('assets').filter(f => f.endsWith('.glb'));
    }

    if (files.length === 0) {
        console.log('No se encontraron archivos .glb');
        process.exit(1);
    }

    console.log(`Generando ${files.length} thumbnails...\n`);

    let ok = 0;
    let fail = 0;

    for (const file of files) {
        const inputPath = path.resolve('assets', file);
        const thumbName = file.replace('.glb', '.webp');
        const outputPath = path.join(THUMBS_DIR, thumbName);

        const inputSize = fs.statSync(inputPath).size;
        process.stdout.write(`  ${file} (${(inputSize / 1024 / 1024).toFixed(1)} MB) → `);

        try {
            await generateThumbnail(inputPath, outputPath);
            if (fs.existsSync(outputPath)) {
                const outputSize = fs.statSync(outputPath).size;
                console.log(`${(outputSize / 1024).toFixed(1)} KB ✓`);
                ok++;
            } else {
                console.log('✗ (no output)');
                fail++;
            }
        } catch (err) {
            console.log(`✗ (${err.message.slice(0, 120)})`);
            fail++;
        }
    }

    console.log(`\nResumen: ${ok} ok, ${fail} fallos`);
    if (ok > 0) console.log(`Thumbnails en: ${path.resolve(THUMBS_DIR)}`);
}

main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
