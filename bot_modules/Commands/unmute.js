const Discord = require('discord.js');


//Unmute Command
module.exports = {
  run: async (client, msg, message, allCommands, user, member) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;

    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    let muteRoleID;
    await func.run("Roles", "Muted", async (response) => {
      muteRoleID = response;
    });
    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const muteRole = guild.roles.cache.get(muteRoleID);



    if (user == undefined){
      const noMentionEmbed = new Discord.MessageEmbed()
      .setColor('#FF0000')
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription('Please provide who you want me to unmute in the form of a mention.')
      .setFooter(`Example: !unmute @Example_User#0000`)
      await targetChannel.send(noMentionEmbed);
      return;
    }

    await message.delete();

    if (!user.roles.cache.some(role => role.id == muteRole.id)) {
      let responseEmbed = new Discord.MessageEmbed()
      .setColor("#FF0000")
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription(`${member.username}#${member.discriminator} is not muted.`)
      .setFooter("*I'll delete this message in 10 seconds.")
      await targetChannel.send(responseEmbed).then(async (sent) => {
        await sent.delete({timeout:10000});
      });
      return;
    }

    await user.roles.remove(muteRole);

    let responseEmbed = new Discord.MessageEmbed()
    .setColor("#00FF00")
    .setTitle(`${message.author.username}, I've unmuted ${member.username}#${member.discriminator}`)
    .setFooter(`*I'll delete this message in 10 seconds.`)
    await targetChannel.send(responseEmbed).then(async (sent) => {
      await sent.delete({timeout:10000});
    });
  },


  help: {
    name: ("unmute"),
    description: ("Unmute a muted user."),
    example: ("!unmute @Example_User#0000"),
    tag: ("Admin")
  }
}
