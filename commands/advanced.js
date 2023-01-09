const dotenv = require('dotenv');
dotenv.config();
const {
  SlashCommandBuilder,
  AttachmentBuilder
} = require('discord.js');
const request = require('request');

// Function to start the socket connection and make the request to the Stable Diffusion API
async function startSocket(interaction, prompt) {
  // Set a timeout for the request
  let timerCounter = setTimeout(async () => {
    await interaction.editReply({
      content: 'Your request has timed out. Please try again',
    });
  }, 130000)

  // Set the options for the request to the Stable Diffusion API
  const options = {
    method: 'POST',
    url: process.env.stableDiffusionEnv,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      "name": prompt,
      "prompt": prompt,
      "seed_resize_from_h": -1,
      "seed_resize_from_w": -1,
      "sampler_name": "Euler",
      "batch_size": 1,
      "n_iter": 4,
      "steps": 20,
      "cfg_scale": 7,
      "width": 768,
      "height": 768,
    },
    json: true
  };

  request(options, async function (error, response, body) {

    try {
      if (error) throw new Error(error);
      console.log(response)
      // Clear the timeout
      clearTimeout(timerCounter)
      // Get the results from the API response
      const results = body.images;
      // console.log(results)
      const attachments = [];
      // const resultsToString = [results].toString();
      for (let i = 0; i < results.length; i++) {
        const data = results[i];
        const buffer = Buffer.from(data, 'base64');
        const attachment = new AttachmentBuilder(buffer, {
          name: 'advanced.png',
        });
        attachments.push(attachment);
      }

      await interaction.editReply({
        //content: `I take on average ${avgDuration} seconds. To generate ${prompt} I took ${duration}`,
        content: `You asked me for ${prompt}`,
        files: attachments,
      });
    } catch (error) {
      console.log(error)
      // Edit the reply with an error message if there is a problem
      interaction.editReply({
        content: 'There was an error with your request. Please try again',
      });
    }
  });
}


module.exports = {
  // Set the data for the slash command
  data: new SlashCommandBuilder()
    .setName('advanced')
    .setDescription('Generates an image from a text prompt using Stable Diffusion 2.1')
    .addStringOption(option => option
      .setName('prompt')
      .setDescription('generate image prompt')
    ),
  // Function to execute the slash command
  async execute(interaction) {
    // Get the prompt from the command options
    const prompt = interaction.options.getString('prompt');
    console.log('What to generate?', prompt);
    try {
      // Send a message to indicate that the image is being generated
      interaction.deferReply("I'm generating...");
      // Start the socket connection and make the request to the Stable Diffusion API
      startSocket(interaction, prompt)
    } catch (error) {
      console.error(error);

    }

  },
};