const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember]
});

client.once('ready', async () => {
  console.log(`🤖 Bot logado como ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('verificar')
      .setDescription('Inicia o processo de verificação via Discord OAuth2')
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log('✅ Comando /verificar registrado');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'verificar') {
    const embed = new EmbedBuilder()
      .setTitle('🔒 Verificação')
      .setDescription('Clique no botão abaixo para fazer login com o Discord e se verificar.')
      .setColor(0x5865F2);

    const button = new ButtonBuilder()
      .setLabel('Fazer login com Discord')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20email%20guilds.join`);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
});

client.login(process.env.BOT_TOKEN);
module.exports = { client };