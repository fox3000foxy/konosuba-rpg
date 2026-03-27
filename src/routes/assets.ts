import { promises as fs } from 'fs';
import { serveStatic } from 'hono/serve-static';
import { imageManifest } from '../objects/data/imageManifest';

export const serveStaticAssets = serveStatic({
    root: process.cwd() + '/assets',
    getContent: async function (path: string): Promise<Response | null> {
        const url = new URL(path, 'http://localhost');
        const key = url.pathname.split('assets/')[2];
        const imagePath = imageManifest[key];
        if (!imagePath) {
            console.warn(`Asset not found: ${key}`);
            return null;
        }

        try {
            const file = await fs.readFile(`${process.cwd()}${imagePath}`);
            return new Response(file, {
                headers: {
                    'Content-Type': 'image/webp',
                },
            });
        } catch (error) {
            console.warn(`Failed to read asset ${key} from ${imagePath}:`, error);
            return null;
        }
    },
});