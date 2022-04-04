const Discord = require('discord.js');
const sleep = require('sleep-promise');


//Mute Command
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
      .setDescription('Please provide who you want me to mute in the form of a mention.')
      .setFooter(`Example: !mute @Example_User#0000 5`)
      await targetChannel.send(noMentionEmbed);
      return;
    }

    await message.delete();

    if (user.roles.cache.some(role => role.id == muteRole.id)) {
      let responseEmbed = new Discord.MessageEmbed()
      .setColor("#FF0000")
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription(`${member.username}#${member.discriminator} is already muted.`)
      .setFooter("*I'll delete this message in 10 seconds.")
      await targetChannel.send(responseEmbed).then(async (sent) => {
        await sent.delete({timeout:10000});
      });
      return;
    }

    let matches = msg.match(/\d+/g);
    matches.splice(matches.indexOf(user.id), 1);

    if (matches[0] != undefined) {
      await user.roles.add(muteRole);

      let responseEmbed = new Discord.MessageEmbed()
      .setColor("#00FF00")
      .setTitle(`${message.author.username}, I've muted ${member.username}#${member.discriminator} for ${matches[0]} minutes.`)
      .setFooter("I'll delete this message in 10 seconds.")
      await targetChannel.send(responseEmbed).then(async (sent) => {
        await sent.delete({timeout:10000});
      });

      await sleep(matches[0] * 60000); //60000
      if (!user.roles.cache.some(role => role.id == muteRole.id)) {
        await user.roles.remove(muteRole);
      }

    }
    else{
      let responseEmbed = new Discord.MessageEmbed()
      .setColor("#FF0000")
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription(`Please provide how many minutes you want me to mute ${member.username}#${member.discriminator} for.`)
      .setFooter(`Example: !mute @Example_User#0000 5`)
      await targetChannel.send(responseEmbed);
      return;
    }
  },


  help: {
    name: ("mute"),
    description: ("Mute a user for x amount of minutes."),
    example: ("!mute @Example_User#0000 5"),
    tag: ("Admin")
  }
}
