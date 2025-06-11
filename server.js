const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();
const { client } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🟢 Servidor rodando! Vá para /login para iniciar o login com Discord.');
});

app.get('/login', (req, res) => {
  const redirectUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20email%20guilds.join`;
  res.redirect(redirectUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('Código não recebido.');

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
      })
    });

    const tokenData = await tokenRes.json();
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userData = await userRes.json();

    const guildId = process.env.GUILD_ID;
    const roleId = process.env.VERIFIED_ROLE_ID;
    const logChannelId = process.env.LOG_CHANNEL_ID;

    await fetch(`https://discord.com/api/guilds/${guildId}/members/${userData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${process.env.BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_token: tokenData.access_token
      })
    });

    await fetch(`https://discord.com/api/guilds/${guildId}/members/${userData.id}/roles/${roleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${process.env.BOT_TOKEN}`
      }
    });

    const channel = await client.channels.fetch(logChannelId);
    channel.send({
      content: `✅ **Novo usuário verificado**:\\n📛 Nome: \\\`${userData.username}#${userData.discriminator}\\\`\\n🆔 ID: \\\`${userData.id}\\\`\\n📅 Conta criada: <t:${Math.floor(new Date(userData.id / 4194304 + 1420070400000) / 1000)}:R>`
    });

    res.send('✅ Verificação completa! Você já pode voltar ao Discord.');
  } catch (error) {
    console.error('Erro na verificação:', error);
    res.send('❌ Ocorreu um erro ao processar sua verificação.');
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor web rodando em http://localhost:${PORT}`);
});