import {
    exchangeNpssoForAccessCode,
    exchangeAccessCodeForAuthTokens,
    exchangeRefreshTokenForAuthTokens
} from "psn-api";
import { prisma } from "./db";

export class AuthService {
    private static authToken: Awaited<ReturnType<typeof exchangeAccessCodeForAuthTokens>> | null = null;
    private static expiryTime: number = 0;

    public static async getAuth() {
        const now = Date.now();

        // CAS 1 : AuthToken en RAM et encore valide
        if (this.authToken && now < this.expiryTime) {
            return this.authToken;
        }

        // CAS 2 : refresh du AuthToken via le Refresh Token (si existant)
        const config = await prisma.systemConfig.findUnique({
            where: { id: 1 }
        });

        if (config?.refreshToken) {
            try {
                console.log("AuthToken expiré, rafraîchissement via Refresh Token");
                const newAuth = await exchangeRefreshTokenForAuthTokens(config.refreshToken);
                await this.saveTokens(newAuth);
                return newAuth;
            } catch (error) {
                console.log("Refresh Token expiré ou invalide");
            }
        }

        // CAS 3 : Utilisation NPSSO (Le code du .env)
        const npsso = process.env.NPSSO;
        if (!npsso) {
            throw new Error("NPSSO manquant dans les variables d'environnement.");
        }
        try {
            console.log("Initialisation via NPSSO");
            const accessCode = await exchangeNpssoForAccessCode(npsso);
            const newAuth = await exchangeAccessCodeForAuthTokens(accessCode);
            await this.saveTokens(newAuth);
            return newAuth;
        } catch (error) {
            console.log("NPSSO expiré ou invalide");
        }

        throw new Error("Impossible d'obtenir un token d'authentification PSN.");
    }


    private static async saveTokens(auth: any) {
        if (!auth?.accessToken || !auth?.expiresIn) {
            throw new Error(`Réponse PSN invalide ou incomplète : ${JSON.stringify(auth)}`);
        }
        this.authToken = auth;
        console.log(`Token reçu. Expire dans : ${auth.expiresIn} secondes`);
        // Calcul de l'expiration avec une marge de sécurité
        this.expiryTime = Date.now() + ((auth.expiresIn ?? 3600) * 1000) - (3 * 60 * 1000);

        // On sauvegarde le refresh token pour le prochain redémarrage du serveur
        await prisma.systemConfig.upsert({
            where: { id: 1 },
            update: { refreshToken: auth.refreshToken },
            create: { id: 1, refreshToken: auth.refreshToken }
        });

        console.log("Tokens mis à jour et sauvegardés.");
    }
}