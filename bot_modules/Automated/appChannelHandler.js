const Discord = require('discord.js');


module.exports = {
  run: async (client, channelID, callback) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    const appChannel = guild.channels.cache.get(`${channelID}`);

    await appChannel.messages.fetch({limit:50}).then(async messages => {

      let messagesArray = [];
      const putInArray = async (data) => messagesArray.push(data);

      for (const message of messages.array().reverse()) {
        if (messagesArray.includes(message.author.id)) {
          continue;
        }
        await putInArray(`${message.author.id}`);
      }
      callback(messagesArray);
    });
  },


  help: {
    name: ("appChannelHandler")
  }
}
