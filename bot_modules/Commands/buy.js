const Discord = require('discord.js');



module.exports = {
  run: async (client, msg, message, allCommands, user, member, connection, query) => {
    const func = client.basicFunctions.get("getFromConfig");
    const leaderFunc = client.automatedFunctions.get("leaderboardHandler");

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    let WhiteFeather;
    let GoldFeather;
    let BlueFeather;
    let CombatFeather;
    await func.run("Feathers", "White", async (response) => {
      WhiteFeather = response;
    });
    await func.run("Feathers", "Gold", async (response) => {
      GoldFeather = response;
    });
    await func.run("Feathers", "Blue", async (response) => {
      BlueFeather = response;
    });
    await func.run("Feathers", "Combat", async (response) => {
      CombatFeather = response;
    });

    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const author = message.guild.member(message.author)
    const authorData = await client.users.fetch(author.id);

    await message.delete();
    const arg = msg.replace("buy", "").replace(/<@.?[0-9]*?>/g, "").trim().toLowerCase().split(" ");

    //Check for amount
    if (!parseInt(arg[0])) {
      arg.splice(0, 0, 1);
    }
    switch (arg[1]) {
      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

      case 'goldfeather':
        await query(`SELECT * FROM feathers WHERE UserID = "${author.id}"`, async (error, rows, field) => {
          if (error) {
            console.log(error)
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle("── Fault Detected ──")
              .setDescription(`${error}`)
            await targetChannel.send(responseEmbed);
            return;
          }
          if (rows.length == 0) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}. You don't seem to have any feathers to purchase gold feathers with.`)
              .setFooter("*I'll delete this message in 15 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 15000
              });
            });
          } else {
            const whiteAward = await rows[0].WhiteAmount || 0;
            const goldAward = await rows[0].GoldAmount || 0;
            const blueAward = await rows[0].BlueAmount || 0;
            const redAward = await rows[0].RedAmount || 0;

            let targetGold = await rows[0].GoldAmount;
            let targetWhite = await rows[0].WhiteAmount;

            if (whiteAward >= (parseInt(arg[0])*10)) {
              targetGold = parseInt(targetGold) + parseInt(arg[0]);
              await query(`UPDATE feathers SET GoldAmount = "${targetGold}" WHERE UserID = ${author.id}`, async (error) => {
                if (error) {
                  console.log(error)
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle("── Fault Detected ──")
                    .setDescription(`${error}`)
                  await targetChannel.send(responseEmbed);
                  return;
                } else {
                  targetWhite = parseInt(targetWhite) - (parseInt(arg[0])*10);
                  await query(`UPDATE feathers SET WhiteAmount = "${targetWhite}" WHERE UserID = ${author.id}`, async (error) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#FF0000")
                        .setTitle("── Fault Detected ──")
                        .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    } else {
                      await query(`SELECT * FROM feathers WHERE UserID = "${author.id}"`, async (error, rows, field) => {
                        if (error) {
                          console.log(error)
                          let responseEmbed = new Discord.MessageEmbed()
                            .setColor("#FF0000")
                            .setTitle("── Fault Detected ──")
                            .setDescription(`${error}`)
                          await targetChannel.send(responseEmbed);
                          return;
                        } else {
                          leaderFunc.run(client, query);
                          const whiteAward = await rows[0].WhiteAmount || 0;
                          const goldAward = await rows[0].GoldAmount || 0;
                          const blueAward = await rows[0].BlueAmount || 0;
                          const redAward = await rows[0].RedAmount || 0;

                          let responseEmbed = new Discord.MessageEmbed()
                            .setColor("#00FF00")
                            .setTitle(`${authorData.username}, You've successfully bought ${arg[0]} Gold Feathers.`)
                            .setDescription(`**Your feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
                            .setFooter("*I'll delete this message in 30 seconds.")
                          await targetChannel.send(responseEmbed).then(async (sent) => {
                            await sent.delete({
                              timeout: 30000
                            });
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
            else {
              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${authorData.username}. You don't seem to have enough feathers to purchase this.`)
                .setDescription(`You wanted to purchase ${parseInt(arg[0])} Golden Feather(s)\n*Costs: ${parseInt(arg[0])*10} White Feathers.\nYou have: ${whiteAward} White Feathers.*`)
                .setFooter("*I'll delete this message in 30 seconds.")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 30000
                });
              });
            }
          }
        });
        break;


        //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

      /*case "whitefeatherpack":
      await query(`SELECT * FROM feathers WHERE UserID = "${author.id}"`, async (error, rows, field) => {
        if (error) {
          console.log(error)
          let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle("── Fault Detected ──")
            .setDescription(`${error}`)
          await targetChannel.send(responseEmbed);
          return;
        }
        if (rows.length == 0) {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`I'm sorry, ${authorData.username}. You don't seem to have any feathers to purchase white feathers with.`)
            .setFooter("*I'll delete this message in 15 seconds.")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 15000
            });
          });
        } else {
          const whiteAward = await rows[0].WhiteAmount || 0;
          const goldAward = await rows[0].GoldAmount || 0;
          const blueAward = await rows[0].BlueAmount || 0;

          let targetGold = await rows[0].GoldAmount;
          let targetWhite = await rows[0].WhiteAmount;

          if (goldAward >= parseInt(arg[0])) {
            targetWhite = parseInt(targetWhite) + (parseInt(arg[0])*10);
            await query(`UPDATE feathers SET WhiteAmount = "${targetWhite}" WHERE UserID = ${author.id}`, async (error) => {
              if (error) {
                console.log(error)
                let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#FF0000")
                  .setTitle("── Fault Detected ──")
                  .setDescription(`${error}`)
                await targetChannel.send(responseEmbed);
                return;
              } else {
                targetGold = parseInt(targetGold) - parseInt(arg[0]);
                await query(`UPDATE feathers SET GoldAmount = "${targetGold}" WHERE UserID = ${author.id}`, async (error) => {
                  if (error) {
                    console.log(error)
                    let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault Detected ──")
                      .setDescription(`${error}`)
                    await targetChannel.send(responseEmbed);
                    return;
                  } else {
                    await query(`SELECT * FROM feathers WHERE UserID = "${author.id}"`, async (error, rows, field) => {
                      if (error) {
                        console.log(error)
                        let responseEmbed = new Discord.MessageEmbed()
                          .setColor("#FF0000")
                          .setTitle("── Fault Detected ──")
                          .setDescription(`${error}`)
                        await targetChannel.send(responseEmbed);
                        return;
                      } else {
                        leaderFunc.run(client, query);
                        const whiteAward = await rows[0].WhiteAmount || 0;
                        const goldAward = await rows[0].GoldAmount || 0;
                        const blueAward = await rows[0].BlueAmount || 0;

                        let responseEmbed = new Discord.MessageEmbed()
                          .setColor("#00FF00")
                          .setTitle(`${authorData.username}, You've successfully bought ${parseInt(arg[0])*10} White Feathers.`)
                          .setDescription(`**Your feathers in total are,\nFeather <:feather_award:899058349574873108> - ${whiteAward} | Golden Feather <:goldfeather_award:899058366607949854> - ${goldAward} | Blue Feather <:bluefeather_award:906588684088922143> - ${blueAward}**`)
                          .setFooter("*I'll delete this message in 30 seconds.")
                        await targetChannel.send(responseEmbed).then(async (sent) => {
                          await sent.delete({
                            timeout: 30000
                          });
                        });
                      }
                    });
                  }
                });
              }
            });
          }
          else {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}. You don't seem to have enough feathers to purchase this.`)
              .setDescription(`You wanted to purchase ${parseInt(arg[0])} pack(s) of 10 white feathers.\n*Costs: ${parseInt(arg[0])} Gold Feathers.*\nYou have: ${goldAward} Gold Feathers.`)
              .setFooter("*I'll delete this message in 30 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 30000
              });
            });
          }
        }
      });
      break;*/

        //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

      default:
        //Send Help Panel
        const args = await module.exports.buy_args;
        const argsArray = Object.values(args);
        const size = argsArray.length;

        let helpEmbed = new Discord.MessageEmbed()
        .setColor('#bb018a')
        .setTitle(`${message.author.username}, here's a list of what you can buy.`)
        .setFooter("*I'll delete this message in 1 minute")

        argsArray.forEach(async (item, i) => {
          const name = (item.name.charAt(0).toUpperCase() + item.name.slice(1));

          helpEmbed.addField(`─ ${name} ─`, `**| Description:** ${item.description}\n**| Example:** ${item.example}\n`, true);

          if ((i % 2 !== 0) && (i !== size-1)) {
            helpEmbed.addField("\u200B","\u200B")
          }
        })

        await targetChannel.send(helpEmbed).then(async (sent) => {
          await sent.delete({timeout:60000});
        });
        return;
      }
  },

  help: {
    name: ("buy"),
    description: ("Buy an item. For example, gold feathers."),
    example: ("!buy amount itemname"),
    tag: ("public")
  },

  buy_args: [
    {name: "goldFeather", description: "Purchase 1 gold feather.\n*Cost: **10 White Feathers**.*", example: "!buy 1 goldfeather"},
    //{name: "whiteFeatherPack", description: "Purchase a pack of 10 white feathers.\n*Cost: **1 Gold Feather**. Comes in pack of 10s.*", example: "!buy 1 whitefeather"},
  ],
}
