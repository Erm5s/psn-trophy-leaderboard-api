import {
    exchangeNpssoForAccessCode,
    exchangeAccessCodeForAuthTokens,
    exchangeRefreshTokenForAuthTokens
} from "psn-api";
import { prisma } from "./db";

export class AuthService {
    private static authToken: any = null;
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
                console.log("AuthToken expriré, rafraîchissement via Refresh Token");
                const newAuth = await exchangeRefreshTokenForAuthTokens(config.refreshToken);
                await this.saveTokens(newAuth);
                return newAuth;
            } catch (error) {
                console.log("Refresh Token expiré ou invalide");
            }
        }

        // CAS 3 : Utilisation NPSSO (Le code du .env)
        try {
            console.log("Initialisation via NPSSO");
            const npsso = String(process.env.NPSSO);
            const accessCode = await exchangeNpssoForAccessCode(npsso);
            const newAuth = await exchangeAccessCodeForAuthTokens(accessCode);
            await this.saveTokens(newAuth);
            return newAuth;
        } catch (error) {
            console.log("NPSSO expiré ou invalide");
        }
    }


    private static async saveTokens(auth: any) {
        this.authToken = auth;
        // Calcul de l'expiration avec une marge de sécurité
        this.expiryTime = Date.now() + (auth.expiresIn * 1000) - (3 * 60 * 1000);

        // On sauvegarde le refresh token pour le prochain redémarrage du serveur
        await prisma.systemConfig.upsert({
            where: { id: 1 },
            update: { refreshToken: auth.refreshToken },
            create: { id: 1, refreshToken: auth.refreshToken }
        });

        console.log("Tokens mis à jour et sauvegardés.");
    }
}