import { serveStatic } from 'hono/serve-static';
import { imageManifest } from '../objects/data/imageManifest';

export const serveStaticAssets = serveStatic({
    root: process.cwd() + '/assets',
    getContent: async function (path: string): Promise<Response | null> {
        const url = new URL(path, 'http://localhost');
        const key = url.pathname.split('assets/')[2];
        const image = imageManifest[key];
        if (!image) {
            console.warn(`Asset not found: ${key}`);
            return null;
        }

        const res = await fetch(image);
        if (!res.ok) {
            console.warn(`Failed to fetch asset ${key} from ${image}: HTTP ${res.status}`);
            return null;
        }

        const buffer = await res.arrayBuffer();
        return new Response(buffer, {
            headers: {
                'Content-Type': 'image/webp',
            },
        });
    },
})

export const serveKonosubaAssets = serveStatic({
    root: process.cwd() + '/assets',
    getContent: async function (path: string): Promise<Response | null> {
        const url = new URL(path, 'http://localhost');
        const key = url.pathname.split('konosuba-rpg/')[1];
        const image = imageManifest[key];
        if (!image) {
            console.warn(`Asset not found: ${key}`);
            return null;
        }
        const res = await fetch(image);
        if (!res.ok) {
            console.warn(`Failed to fetch asset ${key} from ${image}: HTTP ${res.status}`);
            return null;
        }
        const buffer = await res.arrayBuffer();
        return new Response(buffer, {
            headers: {
                'Content-Type': 'image/webp',
            },
        });
    }
})
