const Discord = require('discord.js');


//Kick Command
module.exports = {
  run: async (client, msg, message) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    let soldierRoleID;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });
    await func.run("Roles", "Soldier", async (response) => {
      soldierRoleID = response;
    });

    const soldierRole = guild.roles.cache.get(soldierRoleID);
    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const author = await message.guild.member(message.author);

    await message.delete();

    if (author.roles.cache.some(role => role.id == soldierRole.id)) {
      const KickEmbed = new Discord.MessageEmbed()
      .setColor("#bb018a")
      .setTitle(`${message.author.username}, you're already a soldier. Are you sure you want to quit?`)
      .setDescription(`Click ✅ -> To quit.\nClick ❎ -> To cancel.`)
      .setFooter("*I'll cancel this operation in 20 seconds if I don't hear from you.");

      await targetChannel.send(KickEmbed).then(async (main) => {
        await main.react('✅');
        await main.react('❎');
        await main.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '❎'), { max: 1, time: 20000 }).then(async (collected) => {
          // If quit
          if (collected.first().emoji.name == '✅') {
            await author.roles.remove(soldierRole);

            let responseEmbed = new Discord.MessageEmbed()
            .setColor("#00FF00")
            .setTitle(`${message.author.username}, you've successfully quit from being a soldier.`)
            .setFooter("*I'll delete this message in 15 seconds")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({timeout:15000});
            });
            return;
          }
          // If don't quit
          if (collected.first().emoji.name == '❎') {
            let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`${message.author.username}, you've cancelled the operation.`)
            .setFooter("*I'll delete this message in 15 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({timeout:15000});
            });
            return;
          }
        }).catch(async (err) => {
          if (err.message == "Cannot read properties of undefined (reading 'emoji')"){
            let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`${message.author.username}, I've cancelled the operation.`)
            .setFooter("*I'll delete this message in 15 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({timeout:15000});
            });
          }
          else {
            let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`── Fault Detected: ──`)
            .setDescription(`Operation Cancelled:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
            let embed = new Discord.MessageEmbed()
            main.edit(embed)
            await targetChannel.send(responseEmbed);
            console.log(err);
          }
        });
        await main.delete();
      });
    } else {
      await author.roles.add(soldierRole);

      let responseEmbed = new Discord.MessageEmbed()
      .setColor("#00FF00")
      .setTitle(`${message.author.username}, you've successfully enrolled as a soldier.`)
      .setFooter("*I'll delete this message in 10 seconds.")
      await targetChannel.send(responseEmbed).then(async (sent) => {
        await sent.delete({timeout:10000});
      });
    }
  },


  help: {
    name: ("soldier"),
    description: ("Enroll or quit being a soldier."),
    example: ("!soldier"),
    tag: ("Access Rank II")
  }
}
