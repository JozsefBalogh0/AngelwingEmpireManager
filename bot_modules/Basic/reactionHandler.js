const Discord = require('discord.js');


module.exports = {
  run: async (client, reaction, user) => {
    if (reaction == undefined) return;

    const func = client.basicFunctions.get("getFromConfig");

    let ruleMessage;
    await func.run("Messages", "rulesMessage", async (response) => {
      ruleMessage = response;
    });

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    let guestRoleID;
    let accessIRoleID;
    let ownID;
    await func.run("Roles", "Guest", async (response) => {
      guestRoleID = response;
    });
    await func.run("Roles", "AccessI", async (response) => {
      accessIRoleID = response;
    });
    await func.run(null, "selfID", async (response) => {
      ownID = response;
    });

    if ((reaction.message.id != ruleMessage) || (user.id == ownID)) return;
    if (reaction.emoji.name != '✅') await reaction.remove();

    const guestRole = guild.roles.cache.get(guestRoleID);
    const accessI = guild.roles.cache.get(accessIRoleID);

    const member = await reaction.message.guild.members.cache.get(user.id);

    if (member._roles.length != 0) {
      await reaction.users.remove(user.id);
      return;
    }

    await member.roles.add(guestRole);
    await member.roles.add(accessI);

    await reaction.users.remove(user.id);
  },

  help: {
    name: ("reactionHandler")
  }
}
