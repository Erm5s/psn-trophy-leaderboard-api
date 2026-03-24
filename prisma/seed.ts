import { Database } from "bun:sqlite";
import { createGunzip } from "zlib";
import { Readable } from "stream";

console.log("Démarrage du script seed (via bun:sqlite)...");

const ALL_JSON_GZ_URL =
    "https://github.com/FlexBy420/psn-trophy-scraper/raw/refs/heads/main/all.json.gz";

interface RawGameEntry {
    tt: string;
    pt: string;
    v?: string;
    c?: number;
}

async function downloadAndDecompress(url: string): Promise<string> {
    console.log(`Téléchargement de ${url}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        const gunzip = createGunzip();
        const readable = Readable.from(buffer);
        const chunks: Buffer[] = [];

        readable.pipe(gunzip);
        gunzip.on("data", (chunk: Buffer) => chunks.push(chunk));
        gunzip.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        gunzip.on("error", reject);
    });
}

async function main() {
    const json = await downloadAndDecompress(ALL_JSON_GZ_URL);
    const data: Record<string, RawGameEntry> = JSON.parse(json);

    const entries = Object.entries(data);
    console.log(`${entries.length} entrées trouvées.`);

    const grouped = new Map<
        string,
        {
            name: string;
            variants: { npCommId: string; platform?: string; version?: string }[];
        }
    >();

    for (const [rawId, game] of entries) {
        if (!game.tt) continue;
        const key = game.tt.trim().toLowerCase();
        const npCommId = `${rawId}_00`;

        if (!grouped.has(key)) {
            grouped.set(key, {
                name: game.tt.trim(),
                variants: [{ npCommId, platform: game.pt, version: game.v }],
            });
        } else {
            grouped.get(key)!.variants.push({ npCommId, platform: game.pt, version: game.v });
        }
    }

    console.log(`${grouped.size} jeux uniques après groupage. Début de l'insertion...`);

    const db = new Database("dev.db");

    // On utilise INSERT OR IGNORE pour ne pas écraser les jeux existants 
    // et préserver les relations PlayerGame si on relance le script plus tard
    const insertGame = db.prepare(`INSERT OR IGNORE INTO Game (name) VALUES (?) RETURNING id`);
    const selectGame = db.prepare(`SELECT id FROM Game WHERE name = ?`);
    const insertVariant = db.prepare(`
        INSERT OR IGNORE INTO GameNpCommId (npCommId, platform, version, gameId)
        VALUES (?, ?, ?, ?)
    `);

    db.transaction(() => {
        for (const g of grouped.values()) {
            let gameId: number;
            const insertResult = insertGame.get(g.name) as { id: number } | undefined;
            
            if (insertResult) {
                gameId = insertResult.id;
            } else {
                // Le jeu existe déjà, on récupère son ID
                gameId = (selectGame.get(g.name) as { id: number }).id;
            }
            
            for (const v of g.variants) {
                insertVariant.run(v.npCommId, v.platform || null, v.version || null, gameId);
            }
        }
    })();

    console.log("Seed terminé ✅");
    db.close();
}

main().catch(console.error);
