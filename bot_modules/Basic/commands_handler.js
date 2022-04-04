const Discord = require('discord.js');



module.exports = {
  run: async (client, message, commands, prefix, connection, version) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;

    let botRole;
    let leadershipRole;
    let accessIVRole;
    let shipCaptainRole;
    let admiralRole;
    let HoDRoleID;
    let fleetCommanderRole;
    let accessIRole;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });
    await func.run("Roles", "Bot", async (response) => {
      botRole = response;
    });
    await func.run("Roles", "Leadership", async (response) => {
      leadershipRole = response;
    });
    await func.run("Roles", "AccessIV", async (response) => {
      accessIVRole = response;
    });
    await func.run("Roles", "ShipCaptain", async (response) => {
      shipCaptainRole = response;
    });
    await func.run("Roles", "Admiral", async (response) => {
      admiralRole = response;
    });
    await func.run("Roles", "HeadOfDepartment", async (response) => {
      HoDRoleID = response;
    });
    await func.run("Roles", "FleetCommander", async (response) => {
      fleetCommanderRole = response;
    });
    await func.run("Roles", "AccessI", async (response) => {
      accessIRole = response;
    });

    const query = async (data, callback) => {
      return await connection.query(data, callback);
    }


    const noPermEmbed = new Discord.MessageEmbed()
      .setColor("#FF0000")
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription(`You don't have the required permissions for this command.`)
      .setFooter("*I'll delete this message in 10 seconds.")


    const characterArray = Array.from(message.content)

    //return if message only contains prefix or does not start with prefix
    if ((!message.content.startsWith(prefix)) || (characterArray.length <= 1)) return;
    else {
      let prefixCount = 0;

      characterArray.forEach((item, i) => {
        if ((item == prefix) && !(characterArray[i - 1] == '@')) prefixCount++;
      });

      if (prefixCount >= 2) return;
    }

    const msg = await message.content.toLowerCase().replace(prefix, "");
    const messageArray = await msg.split(" ");
    const command = await messageArray[0].trim();
    const cmd = await commands.get(command);
    const allCommands = commands;

    const targetChannel = await guild.channels.cache.get(message.channel.id);

    let member;
    const user = message.mentions.members?.first();
    if (user) {
      member = await client.users.fetch(user.id);
    }

    //Don't trigger if message is from bot
    if (!message.guild === null) {
      const author = await message.guild.member(message.author);
      if (author._roles.includes(botRole)) return;
    }

    if (connection.state == "disconnected" && (command == "ticket" || command == "buy" || command == "feathers" || command == "take" || command == "give")) {
      const dbOffline = new Discord.MessageEmbed()
        .setColor("#FF0000")
        .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
        .setDescription(`Connection to the Database has been interrupted.\nPlease try to manually reconnect to the database with !reconnect or contact Acheron Fox.`)

      await targetChannel.send(dbOffline);
      return;
    }

    if (cmd) {
      //Allow DMs with dm tag !!!ONLY WORKS FOR PUBLIC COMMANDS!!!
      if (message.guild === null) {
        if (!('dm' in cmd.help)) return;
        else {
          await cmd.run(client, msg, message, allCommands, user, member, connection, query, version);
        }
        return;
      }

      //Look for permissions !!!SERVER COMMANDS ONLY!!!
      if ((cmd.help.tag) && !(message.member.roles.cache.find(r => r.id === leadershipRole))) {
        switch (cmd.help.tag) {
          case "Admin":
            if (!(message.member.roles.cache.find(r => r.id === leadershipRole))) {
              await targetChannel.send(noPermEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
            break;

          case "Fleet Commander":
            if (!((message.member.roles.cache.find(r => r.id === accessIVRole)) || (message.member.roles.cache.find(r => r.id === shipCaptainRole)) || (message.member.roles.cache.find(r => r.id === admiralRole)))) {
              await targetChannel.send(noPermEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
            break;

          case "Head of Department":
            if (!((message.member.roles.cache.find(r => r.id === HoDRoleID)) || (message.member.roles.cache.find(r => r.id === shipCaptainRole)) || (message.member.roles.cache.find(r => r.id === fleetCommanderRole)) || (message.member.roles.cache.find(r => r.id === admiralRole)))) {
              await targetChannel.send(noPermEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
            break;

          case "Access Rank II":
            if ((cmd.help.tag == "Access Rank II") && (message.member.roles.cache.find(r => r.id === accessIRole))) {
              await targetChannel.send(noPermEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
            break;
        }
      }
      if ('dm' in cmd.help) {
        message.delete();
        let responseEmbed = new Discord.MessageEmbed()
          .setColor("#FF0000")
          .setTitle(`I'm sorry, I'm afraid I can't do that.`)
          .setDescription(`I can only execute this command in DM.\nPlease try again in a Direct Message with me.`)
          .setFooter(`*I'll delete this message in 10 seconds.`)
        await targetChannel.send(responseEmbed).then(async (sent) => {
          await sent.delete({
            timeout: 10000
          });
        });
        return;
      } else {
        await cmd.run(client, msg, message, allCommands, user, member, connection, query, version)
      }
    } else {
      let possibleMatches = [];
      let characterToRemove = -1;
      let commandArray = [];
      let isReverseMatch = false;
      let isError = false;

      await allCommands.forEach(async (item) => {
        await Object.entries(item).forEach(x => {
          if (x[1].name != undefined && x[1].name != "run") {
            commandArray.push(x[1].name)
          }
        });
      });

      const findSuggestion = async (data, input, amount) => {
        data.forEach(async (item, i) => {
          if (!isError) {
            try {
              const found = item.toLowerCase().match(input.slice(0, characterToRemove))
              if (possibleMatches.length >= 1 || characterToRemove >= 8 || input.slice(0, characterToRemove) == '') {
                return;
              }
              if (found != null) {
                possibleMatches.push(found.input)
                return;
              }
              if ((i + 1 == data.length) && (possibleMatches.length == 0)) {
                characterToRemove--;
                await findSuggestion(data, input, characterToRemove);
              }
            } catch (error) {
              isError = true;
              console.log(error)
              const errResponse = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Unknown Error.`)
                .setDescription("Failed to get command suggestion from internal files.")
                .setFooter("*I'll delete this message in 10 seconds.")

              await targetChannel.send(errResponse);
              return;
            }
          }
        })
      }
      await findSuggestion(commandArray, command, characterToRemove);

      if (possibleMatches.length == 0) {
        const invalidEmbed = new Discord.MessageEmbed()
          .setColor("#FF0000")
          .setTitle(`I'm sorry, ${message.author.username}. I can't quite understand you.`)
          .setDescription("You can get a list of what I can do for you by typing !help.")
          .setFooter("*I'll delete this message in 10 seconds.")

        if (!(message.guild === null)) {
          await targetChannel.send(invalidEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 10000
            });
          });
        } else return;

      } else {
        let suggestions = [];
        await possibleMatches.forEach(item => {
          const string = item.charAt(0).toUpperCase() + item.slice(1);
          suggestions.push(`${string}\n`)
        })
        const stringSugg = suggestions.toString().replaceAll(',', '');

        const invalidEmbed = new Discord.MessageEmbed()
          .setColor("#FF0000")
          .setTitle(`I'm sorry, ${message.author.username}. I can't quite understand you.`)
          .setDescription(`Did you thought of this?\n${stringSugg}\n\nYou can get a list of what I can do for you by typing !help.`)
          .setFooter("*I'll delete this message in 30 seconds.")

        if (!(message.guild === null)) {
          await targetChannel.send(invalidEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 30000
            });
          });
        } else return;
      }
    }
  },


  help: {
    name: ("commandsHandler")
  }
}
