const Discord = require('discord.js');


//Delete Command
module.exports = {
  run: async (client, msg, message, allCommands, user, member) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });
    const targetChannel = await guild.channels.cache.get(message.channel.id);



    let matches = msg.match(/\d+/g);

    if (user != undefined) {
      matches.splice(matches.indexOf(user.id), 1);
    }

    if (matches != null) {
      let messagesArray = [];
      const input = parseInt(matches[0]) + 2;

      if (input > 100) {
        let responseEmbed = new Discord.MessageEmbed()
        .setColor("#FF0000")
        .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
        .setDescription(`I can't delete more that 98 messages at a time.`)
        .setFooter("*I'll delete this message in 10 seconds.")
        await targetChannel.send(responseEmbed).then(async (sent) => {
          await sent.delete({timeout:10000});
        });
        return;
      }

      let responseEmbed = new Discord.MessageEmbed()
      .setColor("#FFA500")
      .setTitle(`${message.author.username}, please wait, I'm deleting ${matches[0]} messages... ──`)
      await targetChannel.send(responseEmbed);

      await targetChannel.messages.fetch({limit:input}).then(async messages => {

        messages.array().reverse().forEach(async (item, i) => {
          if (item.embeds?.find(x => x.footer?.text.includes("*"))) return
          await item.delete();

          if (messages.array().reverse().length-1 == i) {
            let responseEmbed = new Discord.MessageEmbed()
            .setColor("#00FF00")
            .setTitle(`${message.author.username} I've successfully deleted ${matches[0]} messages.`)
            .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({timeout:10000});
            });
          }
        });
      });
    }
    else {
      let responseEmbed = new Discord.MessageEmbed()
      .setColor("#FF0000")
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription(`Please provide how many messages you'd like me to delete.`)
      .setFooter("Example, !delete 5")
      await targetChannel.send(responseEmbed);
    }
  },


  help: {
    name: ("delete"),
    description: ("Delete x amount of messages in the channel."),
    example: ("!delete 5"),
    tag: ("Admin")
  }
}
