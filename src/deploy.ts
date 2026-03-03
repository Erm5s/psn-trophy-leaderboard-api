import { REST, Routes, SlashCommandBuilder } from 'discord.js';
const botName = "Bot DTP";

// Liste des commandes
const commands = [
// command: /register <psn_id>
    new SlashCommandBuilder()
        .setName('register')
        .setDescription('Association d\'un compte PSN au ' + botName)
        .addStringOption(option =>
            option.setName('psn')
                .setDescription('Votre pseudo PSN')
                .setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('Enregistrement des commandes...');
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
            { body: commands },
        );
        console.log('Commandes enregistrées !');
    } catch (error) {
        console.error(error);
    }
})();