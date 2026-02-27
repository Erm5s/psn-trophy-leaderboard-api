import type { Request, Response } from 'express';
import { prisma } from '../db';
import { Prisma } from '../../src/generated/prisma/client';
import { AuthService } from '../authService';
import { NotFoundError } from '../error';
import {getProfileFromUserName} from "psn-api";


// GET /players
export async function get_all(req: Request, res: Response) {
    const players = await prisma.player.findMany();

    res.json(players);
}


// GET /players/:id
export async function get_one(req: Request, res: Response) {
    const psn = String(req.params.id);
    const player = await prisma.player.findUnique({
        where: { psnId: psn }
    });

    if (!player) {
        throw new NotFoundError('Joueur inexistant');
    }

    res.json(player);
}


// POST /players/:id
export async function create_one(req: Request, res: Response) {
    try {
        const authorization = await AuthService.getAuth(); // récupération du token d'authentification
        const psn_username = String(req.params.id);

        // Vérification de l'existance du PSN
        const profile = (await getProfileFromUserName(authorization, psn_username)).profile;

        // Vérification de l'existance dans la DB
        const existingPlayer = await prisma.player.findUnique({
            where: { accountId: profile.accountId }
        });

        if (!existingPlayer) {
            const player = await prisma.player.create({
                data: {
                    accountId: profile.accountId,
                    psnId: profile.onlineId,
                }
            });

            console.log("Nouvel utilisateur enregistré : " + psn_username);
            res.status(200).json({
                message: "Joueur enregistré",
                data: player
            });
        }
        else {
            res.status(200).json({
                message: "Joueur déjà existant",
            });
        }

    } catch (error: any) {
        console.error("Erreur de synchronisation :\n", error);
        res.status(500).json({
            error: "Impossible de trouver ou créer un profil pour ce joueur",
            message: error.message
        });
    }
}


// PATCH /players/:id
export async function update_one(req: Request, res: Response) {
    try {
        const id = String(req.params.id);
        const player = await prisma.player.update({
            where: { accountId : id },
            data: req.body
        });

        console.log("MAJ du joueur : " + id);
        res.json(player);
    } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            throw new NotFoundError('Joueur inexistant');
        }
        throw err;
    }
}

// DELETE /players/:id
export async function delete_one(req: Request, res: Response) {
    try {
        const id = String(req.params.id);
        await prisma.player.delete({
            where: { accountId : id }
        });
        console.log("Joueur supprimé : " + id);
        res.status(204).send();
    } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            throw new NotFoundError('Joueur inexistant');
        }
        throw err;
    }
}