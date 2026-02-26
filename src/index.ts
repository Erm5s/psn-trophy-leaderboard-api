import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from './db';
import * as player from './requestHandlers/player';

const app = express();
const port = 3000;


app.listen(port, () => {
    console.log(`Serveur prêt sur http://localhost:${port}`);
});

app.use(express.json());

app.route('/players')
    .get(player.get_all)
app.route('/players/:id')
    .get(player.get_one) // pseudo
    .post(player.create_one) // pseudo
    .patch(player.update_one) // id
    .delete(player.delete_one) // ids

