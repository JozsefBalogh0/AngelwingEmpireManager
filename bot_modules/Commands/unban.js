const Discord = require('discord.js');


//Unban Command
module.exports = {
  run: async (client, msg, message, allCommands, user, member) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;

    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });
    const targetChannel = await guild.channels.cache.get(message.channel.id);



    await message.delete();
    const input = msg.replace(`${prefix}unban`,'').trim();

    if (input == "") {
      let index = 0;
      let list = [];

      guild.fetchBans().then(async (banned) => {
        banned.forEach(item => {
          list.push(`[**${++index}**]: **${banned.map(ban => ban.user.tag)}**, Reason: ${banned.map(ban => ban.reason)}`);
        });

        let responseEmbed = new Discord.MessageEmbed()
        .setColor("#bb018a")
        .setTitle(`${message.author.username}, here's a list of banned users:`)
        .setDescription(`Currently there are [**${banned.size}**] amount of users banned:\n\n${list}`)
        .setFooter("If you'd like me to unban somebody type their name and discriminator after the unban command.\nExample, !unban Exmaple_User#0000\n\n*I'll delete this message in 30 seconds.")
        await targetChannel.send(responseEmbed).then(async (sent) => {
          await sent.delete({timeout:30000});
        });
        return;
      });
    }
    else {
      guild.fetchBans().then(async (banned) => {
        banned.map(async (ban) => {

          if (input == (ban.user.tag)) {

            const UnbanEmbed = new Discord.MessageEmbed()
            .setColor("#bb018a")
            .setTitle(`${message.author.username}, here's who I've found under that name:`)
            .setDescription(`**${ban.user.tag}** Ban reason: ${ban.reason}.\nAre you sure you'd like to me unban this user?\n\nClick ✅ -> To ban.\nClick ❎ -> To cancel.`)
            .setFooter("*I'll cancel this operation in 20 seconds if I don't hear from you.")

            await targetChannel.send(UnbanEmbed).then(async sent => {
              await sent.react('✅');
              await sent.react('❎');
              await sent.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '❎'), { max: 1, time: 20000 }).then(async (collected) => {
                // If unban
                if (collected.first().emoji.name == '✅') {
                  await guild.members.unban(ban.user.id);

                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#00FF00")
                  .setTitle(`${message.author.username}, I've banned ${ban.user.tag}.`)
                  .setFooter("*I'll delete this message in 10 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:10000});
                  });
                  return;
                }
                // If don't unban
                if (collected.first().emoji.name == '❎') {
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#FF0000")
                  .setTitle(`${message.author.username}, you've cancelled the ban operation.`)
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
                  .setTitle(`${message.author.username}, I've cancelled the ban operation.`)
                  .setFooter("*I'll delete this message in 15 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:15000});
                  });
                }
                else {
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#FF0000")
                  .setTitle(`── Fault Detected: ──`)
                  .setDescription(`Unban Operation Cancelled:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
                  await targetChannel.send(responseEmbed);
                  console.log(err);
                }
              });
              await sent.delete();
            });
          }
          // If cannot find user from input
          else {
            let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`I'm sorry, ${message.author.username}. I couldn't find anybody under "${input}"`)
            .setDescription(`I can get you a list of banned users if you type: !unban`)
            .setFooter("*I'll delete this message in 15 seconds")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({timeout:15000});
            });
          }
        });
      });
    }
  },


  help: {
    name: ("unban"),
    description: ("Unban a user."),
    example: ("!unban"),
    tag: ("Admin")
  }
}
