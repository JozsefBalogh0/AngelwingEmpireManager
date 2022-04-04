const Discord = require('discord.js');


//Ban Command
module.exports = {
  run: async (client, msg, message, allCommands, user, member) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });
    const targetChannel = await guild.channels.cache.get(message.channel.id);



    if (user == undefined){
      const noMentionEmbed = new Discord.MessageEmbed()
      .setColor('#FF0000')
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription('Please provide who you want me to ban from the server in the form of a mention.')
      .setFooter(`Example, !assign @Example_User#0000`)
      await targetChannel.send(noMentionEmbed);
      return;
    }
    let reason = ("No reason given.");

    const mention = /<@(.*?)>/;
    const tempString = msg.replace(`ban `,'').replace(mention, "").trim();

    if (tempString != ""){
      reason = tempString;
    }

    await message.delete();

    const BanEmbed = new Discord.MessageEmbed()
    .setColor("#bb018a")
    .setTitle(`${message.author.username}, please confirm that you want me to ban ${member.username}#${member.discriminator}`)
    .setDescription(`Click ✅ -> To ban.\nClick ❎ -> To cancel.`)
    .setFooter("*I'll cancel this operation in 20 seconds if I don't hear from you.");

    await targetChannel.send(BanEmbed).then(async (main) => {
      await main.react('✅');
      await main.react('❎');
      await main.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '❎'), { max: 1, time: 20000 }).then(async (collected) => {
        // If kick
        if (collected.first().emoji.name == '✅') {
          await user.ban({reason: reason});

          let responseEmbed = new Discord.MessageEmbed()
          .setColor("#00FF00")
          .setTitle(`${message.author.username}, I've banned ${member.username}#${member.discriminator}.`)
          .setDescription(`The ban reason is: **${reason}**`)
          .setFooter("*I'll delete this message in 15 seconds")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({timeout:15000});
          });
          return;
        }
        // If don't kick
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
          .setDescription(`Ban Operation Cancelled:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
          let embed = new Discord.MessageEmbed()
          main.edit(embed)
          await targetChannel.send(responseEmbed)
          console.log(err);
        }
      });
      await main.delete();
    });
  },


  help: {
    name: ("ban"),
    description: ("Ban a user."),
    example: ("!ban @Example_User#0000 (optional reason)"),
    tag: ("Admin")
  }
}
