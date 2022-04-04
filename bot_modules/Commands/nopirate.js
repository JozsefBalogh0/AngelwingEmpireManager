const Discord = require('discord.js');



module.exports = {
  run: async (client, msg, message, allCommands, user, member) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    let allyRoleID;
    await func.run("Roles", "Ally", async (response) => {
      allyRoleID = response;
    });
    const allyRole = guild.roles.cache.get(allyRoleID);
    let author;

    await guild.members.fetch().then(async (members) =>
    {
      await members.forEach(member =>
        {
          if (member.id == message.author.id) {
            author = member;
          }
        });
    });

    if (author == undefined) {
      let responseEmbed = new Discord.MessageEmbed()
        .setColor("#FF0000")
        .setTitle(`I'm sorry, I'm afraid I can't do that.`)
        .setDescription(`You are not a member of the Angelwing Empire Discord server.`)
      await message.author.send(responseEmbed)
      return;
    }
    const pass = msg.replace("login", "").trim();

    if (author._roles.includes(allyRoleID)) {
      let responseEmbed = new Discord.MessageEmbed()
        .setColor("#FF0000")
        .setTitle(`I'm sorry, I'm afraid I can't do that.`)
        .setDescription(`You've already logged in to the alliance operation channels`)
      await message.author.send(responseEmbed)
      return;
    }
    else {
      await author.roles.add(allyRole);
      let responseEmbed = new Discord.MessageEmbed()
        .setColor("#00FF00")
        .setTitle(`Access Granted`)
        .setDescription(`You now have access to the alliance operation channels in the server.\nThey can be found under the "ALLIANCE OPERATIONS" category.`)
      await message.author.send(responseEmbed)
      return;
    }
  },


  help: {
    name: ("nopirate"),
    description: ("[-EVENT RESTRICTED-]"),
    example: ("[-EVENT RESTRICTED-]"),
    tag: ("Public"),
    dm: ("true")
  }
}
