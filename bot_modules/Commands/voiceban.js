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

    let voiceBanRoleID;
    await func.run("Roles", "VoiceBanned", async (response) => {
      voiceBanRoleID = response;
    });
    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const voiceBanRole = guild.roles.cache.get(voiceBanRoleID);



    if (user == undefined){
      const noMentionEmbed = new Discord.MessageEmbed()
      .setColor('#FF0000')
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription('Please provide who you want me to ban from voice in the form of a mention.')
      .setFooter(`Example, !voiceban @Example_User#0000`)
      await targetChannel.send(noMentionEmbed);
      return;
    }

    await message.delete();

    if (user.roles.cache.some(role => role.id == voiceBanRole.id)) {
      let responseEmbed = new Discord.MessageEmbed()
      .setColor("#FF0000")
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription(`${member.username} is already banned from voice.`)
      .setFooter("*I'll delete this message in 10 seconds.")
      await targetChannel.send(responseEmbed).then(async (sent) => {
        await sent.delete({timeout:10000});
      });
      return;
    }


    await user.roles.add(voiceBanRole);

    let responseEmbed = new Discord.MessageEmbed()
    .setColor("#00FF00")
    .setTitle(`${message.author.username}, I've banned ${member.username} from voice.`)
    .setFooter("I'll delete this message in 10 seconds.")
    await targetChannel.send(responseEmbed).then(async (sent) => {
      await sent.delete({timeout:10000});
    });
  },


  help: {
    name: ("voiceban"),
    description: ("Voice Ban a user."),
    example: ("!voiceban @Example_User#0000"),
    tag: ("Admin")
  }
}
