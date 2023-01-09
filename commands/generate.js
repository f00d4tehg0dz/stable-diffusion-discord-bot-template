const WebSocket = require('ws');
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const dotenv = require('dotenv');
const createHash = require('hash-generator');

dotenv.config();

function generateHash() {
  let hash = createHash(12)
  return {
    session_hash: hash,
    fn_index: 2
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('generate')
    .setDescription('Generates an image from a text prompt using Stable Diffusion 1.5')
    .addStringOption(option => option
      .setName('prompt')
      .setDescription('generate image prompt')
    ),
  async execute(interaction) {

    let timerCounter = setTimeout(async () => {
      await interaction.editReply({
        content: 'Your request has timed out. Please try again',
      });
    }, 45000)

    const prompt = interaction.options.getString('prompt');
    console.log('What to generate?', prompt);

    try {
      await interaction.reply("I'm generating...");

      const ws = new WebSocket('wss://runwayml-stable-diffusion-v1-5.hf.space/queue/join');
      const hash = generateHash();
      ws.on('open', () => {});

      ws.on('message', async (message) => {
        const msg = JSON.parse(`${message}`);
        if (msg.msg === 'send_hash') {
          ws.send(JSON.stringify(hash));
        } else if (msg.msg === 'send_data') {
          const data = {
            data: [prompt],
            ...hash,
          };
          ws.send(JSON.stringify(data));
        } else if (msg.msg === 'process_completed') {
          clearTimeout(timerCounter)
          try {
            const results = msg.output.data[0];
            const attachments = [];
            for (let i = 0; i < results.length; i++) {
              const data = results[i].split(',')[1];
              const buffer = Buffer.from(data, 'base64');
              const attachment = new AttachmentBuilder(buffer, {
                name: 'generate.png',
              });
              attachments.push(attachment);
            }

          } catch (error) {
                console.error(error);
                await interaction.editReply({
                  content: 'An error occurred while generating the image',
                });
              }
            }
          });

          ws.on('error', async (error) => {
            console.error(error);
            await interaction.editReply({
              content: 'An error occurred while generating the image',
            });
          });
        } catch (error) {
          console.error(error);
        }

      },
    };
