import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as player from './requestHandlers/player'; 

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});


client.once(Events.ClientReady, (c) => {
    console.log(`Bot Discord prêt ! Connecté en tant que ${c.user.tag}`);
});


client.on(Events.InteractionCreate, async (interaction) => {
    // On ne traite que les commandes slash
    if (!interaction.isChatInputCommand()) return;

    // command: /register <psn_id>
    if (interaction.commandName === 'register') {
        const psnId = interaction.options.getString('psn_id')!;
        await interaction.deferReply();
    
        try {
            const result = await player.registerPlayer(psnId);
            await interaction.editReply(result.success ? `${result.message} : **${result.player.psnId}**` : `${result.message}`);
        } catch (e) {
            await interaction.editReply("Ce compte PSN n'existe pas.");
        }
    }
});

// Connexion au serveur Discord
client.login(process.env.DISCORD_TOKEN);