const Discord = require('discord.js');


module.exports = {
  run: async (client, msg, message, allCommands, user, member, connection, query) => {
    const func = client.basicFunctions.get("getFromConfig");
    const leaderFunc = client.automatedFunctions.get("leaderboardHandler");

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const author = message.guild.member(message.author)
    const authorData = await client.users.fetch(author.id);

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

    let leadershipRole;
    let accessIRoleID;
    let accessIIRole;
    let HoDRoleID;
    await func.run("Roles", "Leadership", async (response) => {
      leadershipRole = response;
    });
    await func.run("Roles", "AccessI", async (response) => {
      accessIRoleID = response;
    });
    await func.run("Roles", "AccessII", async (response) => {
      accessIIRole = response;
    });
    await func.run("Roles", "HeadOfDepartment", async (response) => {
      HoDRoleID = response;
    });

    let memberRoleID;
    let diplomatKeyRoleID;
    await func.run("Roles", "Member", async (response) => {
      memberRoleID = response;
    });
    await func.run("Roles", "DiplomatKey", async (response) => {
      diplomatKeyRoleID = response;
    });

    let userData;
    if (user) {
      userData = await client.users.fetch(user.id);
    }

    await message.delete();
    const arg = msg.replace("feather", "").replace(/<@.?[0-9]*?>/g, "").trim().toLowerCase().split(" ");

    let IsLeader = false;
    if (author._roles.includes(HoDRoleID) || (!author._roles.includes(accessIRoleID) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID))) {
      IsLeader = true;
    }

    switch (arg[0]) {
      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
      case "give":
        if (author._roles.includes(HoDRoleID) || (!author._roles.includes(accessIRoleID) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID))) {
          if (user == undefined) {
            const noMentionEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription('Please provide who you want me to reward with a feather in the form of a mention.')
              .setFooter(`Example, !feather give [amount] [feather name] @Example_User#0000`)
            await targetChannel.send(noMentionEmbed);
            return;
          }

          if (user.id == author.id) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`You can't award yourself.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          //Check for amount
          //Attempt to fix user mix-up
          if (!parseInt(arg[1])) {
            const numberPos = arg[2];
            const typePos = arg[1];
            arg.splice(1, 1, numberPos);
            arg.splice(2, 1, typePos);
          }
          //If arguments are still faulty
          if (!parseInt(arg[1])) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`I don't understand how many feathers you want me to award.\n\nPlease make sure you type in the arguments in this order:\n**!feather give [amount] [feather name] @Example_User#0000**\n\n*Amount must be a numerical value. Example: 1, 2, etc...*`)
              .setFooter("*I'll delete this message in 20 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 20000
              });
            });
            return;
          }

          if (parseInt(arg[1]) > 10) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`You can't give more than 10 feathers at once.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          // Check for perms
          if (arg[2] == "gold" && !author._roles.includes(leadershipRole)) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`You don't have the required permissions for this.\n**Please contact your superiors.**`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          } else if (arg[2] == "blue" && !author._roles.includes(leadershipRole)) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`You don't have the required permissions for this.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
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
                if (!author._roles.includes(leadershipRole) && rows.length == 0) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
                    .setDescription(`You don't have the required blue feathers for this.\nPlease contact your superiors.`)
                    .setFooter("*I'll delete this message in 10 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 10000
                    });
                  });
                  return;
                } else if (author._roles.includes(leadershipRole) || (rows[0].BlueAmount < 10 && !author._roles.includes(leadershipRole))) {
                  switch (arg[2]) {
                    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    case "gold":
                      await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                          await query(`INSERT INTO feathers (UserID, WhiteAmount, GoldAmount, BlueAmount, RedAmount) VALUES ("${user.id}", "0", "${parseInt(arg[1])}", "0", "0") `, async (error) => {
                            if (error) {
                              console.log(error)
                              let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("── Fault Detected ──")
                                .setDescription(`${error}`)
                              await targetChannel.send(responseEmbed);
                              return;
                            } else {
                              await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
                                if (error) {
                                  console.log(error)
                                  let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#FF0000")
                                    .setTitle("── Fault Detected ──")
                                    .setDescription(`${error}`)
                                  await targetChannel.send(responseEmbed);
                                  return;
                                } else {
                                  const whiteAward = await rows[0].WhiteAmount || 0;
                                  const goldAward = await rows[0].GoldAmount || 0;
                                  const blueAward = await rows[0].BlueAmount || 0;
                                  const redAward = await rows[0].RedAmount || 0;

                                  let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#00FF00")
                                    .setTitle(`${authorData.username}, I've awarded ${userData.username} with ${arg[1]} Gold Feathers.`)
                                    .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                        } else {
                          let targetAmount = await rows[0].GoldAmount;
                          targetAmount = parseInt(targetAmount) + parseInt(arg[1]);
                          await query(`UPDATE feathers SET GoldAmount = "${targetAmount}" WHERE UserID = ${user.id}`, async (error) => {
                            if (error) {
                              console.log(error)
                              let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("── Fault Detected ──")
                                .setDescription(`${error}`)
                              await targetChannel.send(responseEmbed);
                              return;
                            } else {
                              await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                                    .setTitle(`${authorData.username}, I've awarded ${userData.username} with ${arg[1]} Gold Feathers.`)
                                    .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                      break;

                      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    case "blue":
                      await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                          await query(`INSERT INTO feathers (UserID, WhiteAmount, GoldAmount, BlueAmount, RedAmount) VALUES ("${user.id}", "0", "0", "${parseInt(arg[1])}", "0") `, async (error) => {
                            if (error) {
                              console.log(error)
                              let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("── Fault Detected ──")
                                .setDescription(`${error}`)
                              await targetChannel.send(responseEmbed);
                              return;
                            } else {
                              await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
                                if (error) {
                                  console.log(error)
                                  let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#FF0000")
                                    .setTitle("── Fault Detected ──")
                                    .setDescription(`${error}`)
                                  await targetChannel.send(responseEmbed);
                                  return;
                                } else {
                                  const whiteAward = await rows[0].WhiteAmount || 0;
                                  const goldAward = await rows[0].GoldAmount || 0;
                                  const blueAward = await rows[0].BlueAmount || 0;
                                  const redAward = await rows[0].RedAmount || 0;

                                  let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#00FF00")
                                    .setTitle(`${authorData.username}, I've awarded ${userData.username} with ${arg[1]} Blue Feathers.`)
                                    .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                        } else {
                          let targetAmount = await rows[0].BlueAmount;
                          targetAmount = parseInt(targetAmount) + parseInt(arg[1]);
                          await query(`UPDATE feathers SET BlueAmount = "${targetAmount}" WHERE UserID = ${user.id}`, async (error) => {
                            if (error) {
                              console.log(error)
                              let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("── Fault Detected ──")
                                .setDescription(`${error}`)
                              await targetChannel.send(responseEmbed);
                              return;
                            } else {
                              await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                                    .setTitle(`${authorData.username}, I've awarded ${userData.username} with ${arg[1]} Blue Feathers.`)
                                    .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                      break;

                      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    case "white":
                      await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                          await query(`INSERT INTO feathers (UserID, WhiteAmount, GoldAmount, BlueAmount, RedAmount) VALUES ("${user.id}", "${parseInt(arg[1])}", "0", "0", "0") `, async (error) => {
                            if (error) {
                              console.log(error)
                              let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("── Fault Detected ──")
                                .setDescription(`${error}`)
                              await targetChannel.send(responseEmbed);
                              return;
                            } else {
                              await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
                                if (error) {
                                  console.log(error)
                                  let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#FF0000")
                                    .setTitle("── Fault Detected ──")
                                    .setDescription(`${error}`)
                                  await targetChannel.send(responseEmbed);
                                  return;
                                } else {
                                  const whiteAward = await rows[0].WhiteAmount || 0;
                                  const goldAward = await rows[0].GoldAmount || 0;
                                  const blueAward = await rows[0].BlueAmount || 0;
                                  const redAward = await rows[0].RedAmount || 0;

                                  let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#00FF00")
                                    .setTitle(`${authorData.username}, I've awarded ${userData.username} with ${arg[1]} White Feathers.`)
                                    .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                        } else {
                          let targetAmount = await rows[0].WhiteAmount;
                          targetAmount = parseInt(targetAmount) + parseInt(arg[1]);
                          await query(`UPDATE feathers SET WhiteAmount = "${targetAmount}" WHERE UserID = ${user.id}`, async (error) => {
                            if (error) {
                              console.log(error)
                              let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("── Fault Detected ──")
                                .setDescription(`${error}`)
                              await targetChannel.send(responseEmbed);
                              return;
                            } else {
                              await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                                    .setTitle(`${authorData.username}, I've awarded ${userData.username} with ${arg[1]} White Feathers.`)
                                    .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                      break;

                      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    case "red":
                      await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                          await query(`INSERT INTO feathers (UserID, WhiteAmount, GoldAmount, BlueAmount, RedAmount) VALUES ("${user.id}", "${parseInt(arg[1])}", "0", "0", "${parseInt(arg[1])}") `, async (error) => {
                            if (error) {
                              console.log(error)
                              let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("── Fault Detected ──")
                                .setDescription(`${error}`)
                              await targetChannel.send(responseEmbed);
                              return;
                            } else {
                              await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
                                if (error) {
                                  console.log(error)
                                  let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#FF0000")
                                    .setTitle("── Fault Detected ──")
                                    .setDescription(`${error}`)
                                  await targetChannel.send(responseEmbed);
                                  return;
                                } else {
                                  const whiteAward = await rows[0].WhiteAmount || 0;
                                  const goldAward = await rows[0].GoldAmount || 0;
                                  const blueAward = await rows[0].BlueAmount || 0;
                                  const redAward = await rows[0].RedAmount || 0;

                                  let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#00FF00")
                                    .setTitle(`${authorData.username}, I've awarded ${userData.username} with ${arg[1]} Combat Feathers and ${arg[1]} White Feathers.`)
                                    .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                        } else {
                          let targetAmountRed = await rows[0].RedAmount || 0;
                          targetAmountRed = parseInt(targetAmountRed) + parseInt(arg[1]);

                          let targetAmountWhite = await rows[0].WhiteAmount || 0;
                          targetAmountWhite = parseInt(targetAmountWhite) + parseInt(arg[1]);
                          await query(`UPDATE feathers SET WhiteAmount = "${targetAmountWhite}", RedAmount = "${targetAmountRed}" WHERE UserID = ${user.id}`, async (error) => {
                            if (error) {
                              console.log(error)
                              let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("── Fault Detected ──")
                                .setDescription(`${error}`)
                              await targetChannel.send(responseEmbed);
                              return;
                            } else {
                              await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                                    .setTitle(`${authorData.username}, I've awarded ${userData.username} with ${arg[1]} Combat Feathers and ${arg[1]} White Feathers.`)
                                    .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                      break;

                      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    default:
                      let missingText = `You must provide what type of feather I should give to ${userData.username}\n**Available feathers:**\n- White\n- Gold\n- Blue\n- Red`;

                      if (arg[2] != "" && arg[2] != undefined) {
                        missingText = `There is no feather called ${arg[2]}\n**Available feathers:**\n- White\n- Gold\n- Blue\n- Red`;
                      }

                      let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#FF0000")
                        .setTitle(`${authorData.username}, I'm afraid I cannot do that.`)
                        .setDescription(missingText)
                        .setFooter("*I'll delete this message in 10 seconds.")
                      await targetChannel.send(responseEmbed).then(async (sent) => {
                        await sent.delete({
                          timeout: 10000
                        });
                      });
                      break;
                  }
                } else {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
                    .setDescription(`You don't have the required blue feathers for this.`)
                    .setFooter("*I'll delete this message in 10 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 10000
                    });
                  });
                  return;
                }
              }
            });
          }
        } else {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`${message.author.username}, you do not have permissions for this.`)
            .setFooter("*I'll delete this message in 10 seconds.")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 10000
            });
          });
        }
        break;

        //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

      case "take":
        if (author._roles.includes(HoDRoleID) || (!author._roles.includes(accessIRoleID) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID))) {
          if (user == undefined) {
            const noMentionEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription('Please provide who you want me to reward with a feather in the form of a mention.')
              .setFooter(`Example, !take amount feathername @Example_User#0000`)
            await targetChannel.send(noMentionEmbed);
            return;
          }

          if (user.id == author.id) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`You can't take away feathers from yourself.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          //Check for amount
          //Attempt to fix user mix-up
          if (!parseInt(arg[1])) {
            const numberPos = arg[2];
            const typePos = arg[1];
            arg.splice(1, 1, numberPos);
            arg.splice(2, 1, typePos);
          }
          //If arguments are still faulty
          if (!parseInt(arg[1])) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`I don't understand how many feathers you want me to award.\n\nPlease make sure you type in the arguments in this order:\n**!feather give [amount] [feather name] @Example_User#0000**\n\n*Amount must be a numerical value. Example: 1, 2, etc...*`)
              .setFooter("*I'll delete this message in 20 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 20000
              });
            });
            return;
          }
          if (parseInt(arg[1]) > 10) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`You can't take away more than 10 feathers at once.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          if (author._roles.includes(leadershipRole)) {
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
                if (author._roles.includes(leadershipRole)) {
                  switch (arg[2]) {
                    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    case 'gold':
                      await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                            .setTitle(`${authorData.username}, ${userData.username} has no feathers of any kind.`)
                            .setFooter("*I'll delete this message in 10 seconds.")
                          await targetChannel.send(responseEmbed).then(async (sent) => {
                            await sent.delete({
                              timeout: 10000
                            });
                          });
                          return;
                        } else {
                          let targetAmount = await rows[0].GoldAmount;
                          if (targetAmount == 0) {
                            let responseEmbed = new Discord.MessageEmbed()
                              .setColor("#FF0000")
                              .setTitle(`${authorData.username}, ${userData.username} already has no gold feathers.`)
                              .setFooter("*I'll delete this message in 10 seconds.")
                            await targetChannel.send(responseEmbed).then(async (sent) => {
                              await sent.delete({
                                timeout: 10000
                              });
                            });
                            return;
                          } else {
                            targetAmount = targetAmount - parseInt(arg[1]);
                            if (targetAmount < 0) targetAmount = 0;
                            await query(`UPDATE feathers SET GoldAmount = "${targetAmount}" WHERE UserID = ${user.id}`, async (error) => {
                              if (error) {
                                console.log(error)
                                let responseEmbed = new Discord.MessageEmbed()
                                  .setColor("#FF0000")
                                  .setTitle("── Fault Detected ──")
                                  .setDescription(`${error}`)
                                await targetChannel.send(responseEmbed);
                                return;
                              } else {
                                await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                                      .setTitle(`${authorData.username}, I've taken away ${arg[1]} Golden Feathers from ${userData.username}.`)
                                      .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                        }
                      });
                      break;

                      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    case 'blue':
                      await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                            .setTitle(`${authorData.username}, ${userData.username} has no feathers of any kind.`)
                            .setFooter("*I'll delete this message in 10 seconds.")
                          await targetChannel.send(responseEmbed).then(async (sent) => {
                            await sent.delete({
                              timeout: 10000
                            });
                          });
                          return
                        } else {
                          let targetAmount = await rows[0].BlueAmount;
                          if (targetAmount == 0) {
                            let responseEmbed = new Discord.MessageEmbed()
                              .setColor("#FF0000")
                              .setTitle(`${authorData.username}, ${userData.username} already has no blue feathers.`)
                              .setFooter("*I'll delete this message in 10 seconds.")
                            await targetChannel.send(responseEmbed).then(async (sent) => {
                              await sent.delete({
                                timeout: 10000
                              });
                            });
                            return;
                          } else {
                            targetAmount = targetAmount - parseInt(arg[1]);
                            if (targetAmount < 0) targetAmount = 0;
                            await query(`UPDATE feathers SET BlueAmount = "${targetAmount}" WHERE UserID = ${user.id}`, async (error) => {
                              if (error) {
                                console.log(error)
                                let responseEmbed = new Discord.MessageEmbed()
                                  .setColor("#FF0000")
                                  .setTitle("── Fault Detected ──")
                                  .setDescription(`${error}`)
                                await targetChannel.send(responseEmbed);
                                return;
                              } else {
                                await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                                      .setTitle(`${authorData.username}, I've taken away ${arg[1]} Blue Feathers from ${userData.username}.`)
                                      .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                        }
                      });
                      break;

                      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    case "white":
                      await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                            .setTitle(`${authorData.username}, ${userData.username} has no feathers of any kind.`)
                            .setFooter("*I'll delete this message in 10 seconds.")
                          await targetChannel.send(responseEmbed).then(async (sent) => {
                            await sent.delete({
                              timeout: 10000
                            });
                          });
                        } else {
                          let targetAmount = await rows[0].WhiteAmount;
                          if (targetAmount == 0) {
                            let responseEmbed = new Discord.MessageEmbed()
                              .setColor("#FF0000")
                              .setTitle(`${authorData.username}, ${userData.username} already has no white feathers.`)
                              .setFooter("*I'll delete this message in 10 seconds.")
                            await targetChannel.send(responseEmbed).then(async (sent) => {
                              await sent.delete({
                                timeout: 10000
                              });
                            });
                            return;
                          } else {
                            targetAmount = targetAmount - parseInt(arg[1]);
                            if (targetAmount < 0) targetAmount = 0;
                            await query(`UPDATE feathers SET WhiteAmount = "${targetAmount}" WHERE UserID = ${user.id}`, async (error) => {
                              if (error) {
                                console.log(error)
                                let responseEmbed = new Discord.MessageEmbed()
                                  .setColor("#FF0000")
                                  .setTitle("── Fault Detected ──")
                                  .setDescription(`${error}`)
                                await targetChannel.send(responseEmbed);
                                return;
                              } else {
                                await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                                      .setTitle(`${authorData.username}, I've taken away ${arg[1]} White Feathers from ${userData.username}.`)
                                      .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                        }
                      });
                      break;

                      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    case "red":
                      await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                            .setTitle(`${authorData.username}, ${userData.username} has no feathers of any kind.`)
                            .setFooter("*I'll delete this message in 10 seconds.")
                          await targetChannel.send(responseEmbed).then(async (sent) => {
                            await sent.delete({
                              timeout: 10000
                            });
                          });
                        } else {
                          let targetAmountRed = await rows[0].RedAmount;
                          let targetAmountWhite = await rows[0].WhiteAmount;

                          if (targetAmountRed == 0) {
                            let responseEmbed = new Discord.MessageEmbed()
                              .setColor("#FF0000")
                              .setTitle(`${authorData.username}, ${userData.username} already has no red feathers.`)
                              .setFooter("*I'll delete this message in 10 seconds.")
                            await targetChannel.send(responseEmbed).then(async (sent) => {
                              await sent.delete({
                                timeout: 10000
                              });
                            });
                            return;
                          } else {
                            targetAmountRed = targetAmountRed - parseInt(arg[1]);
                            targetAmountWhite = targetAmountWhite - parseInt(arg[1]);

                            if (targetAmountRed < 0) targetAmountRed = 0;
                            if (targetAmountWhite < 0) targetAmountWhite = 0;
                            await query(`UPDATE feathers SET WhiteAmount = "${targetAmountWhite}", RedAmount = "${targetAmountRed}" WHERE UserID = ${user.id}`, async (error) => {
                              if (error) {
                                console.log(error)
                                let responseEmbed = new Discord.MessageEmbed()
                                  .setColor("#FF0000")
                                  .setTitle("── Fault Detected ──")
                                  .setDescription(`${error}`)
                                await targetChannel.send(responseEmbed);
                                return;
                              } else {
                                await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                                      .setTitle(`${authorData.username}, I've taken away ${arg[1]} Combat Feathers and ${arg[1]} White Feathers from ${userData.username}.`)
                                      .setDescription(`**Their feathers in total are,\nWhite Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
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
                        }
                      });
                      break;

                      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                    default:
                      let missingText = `You must provide what type of feather I should take away from ${userData.username}\n**Available feathers:**\n- White\n- Gold\n- Blue\n- Red`;

                      if (arg[2] != "" && arg[2] != undefined) {
                        missingText = `There is no feather called ${arg[2]}\n**Available feathers:**\n- White\n- Gold\n- Blue\n- Red`;
                      }

                      let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#FF0000")
                        .setTitle(`${authorData.username}, I'm afraid I cannot do that.`)
                        .setDescription(missingText)
                        .setFooter("*I'll delete this message in 10 seconds.")
                      await targetChannel.send(responseEmbed).then(async (sent) => {
                        await sent.delete({
                          timeout: 10000
                        });
                      });
                      break;
                  }
                } else {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
                    .setDescription(`You don't have the required permissions for this.`)
                    .setFooter("*I'll delete this message in 10 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 10000
                    });
                  });
                  return;

                }
              }
            });
          } else {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`You don't have the required permissions for this.\n**Please contact your superiors.**`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }
        } else {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`${message.author.username}, you do not have permissions for this.`)
            .setFooter("*I'll delete this message in 10 seconds.")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 10000
            });
          });
        }
        break;

        //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

      case "list":
        if (user) {
          if (!author._roles.includes(accessIRoleID) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID)) {
            const userData = await client.users.fetch(user.id);
            await query(`SELECT * FROM feathers WHERE UserID = "${user.id}"`, async (error, rows, field) => {
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
                  .setTitle(`I'm sorry, ${authorData.username}. I'm afraid ${userData.username} doesn't have any feathers yet.`)
                  .setFooter("*I'll delete this message in 10 seconds.")
                await targetChannel.send(responseEmbed).then(async (sent) => {
                  await sent.delete({
                    timeout: 10000
                  });
                });
                return;
              } else {
                const whiteAward = await rows[0].WhiteAmount || 0;
                const goldAward = await rows[0].GoldAmount || 0;
                const blueAward = await rows[0].BlueAmount || 0;
                const redAward = await rows[0].RedAmount || 0;

                let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#00FF00")
                  .setTitle(`${authorData.username}, here's a list of ${userData.username}'s feathers:`)
                  .setDescription(`**White Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
                  .setFooter("*I'll delete this message in 30 seconds.")
                await targetChannel.send(responseEmbed).then(async (sent) => {
                  await sent.delete({
                    timeout: 30000
                  });
                });
              }
            });
          } else {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`${authorData.username}, I'm afraid I can't do that.`)
              .setDescription(`You don't have the necessary permissions for this.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }
        }

        //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

        if (!user) {
          await query(`SELECT * FROM feathers WHERE UserID = "${authorData.id}"`, async (error, rows, field) => {
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
                .setTitle(`I'm sorry, ${authorData.username}. I'm afraid you don't have any feathers yet.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            } else {
              const whiteAward = await rows[0].WhiteAmount || 0;
              const goldAward = await rows[0].GoldAmount || 0;
              const blueAward = await rows[0].BlueAmount || 0;
              const redAward = await rows[0].RedAmount || 0;

              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#00FF00")
                .setTitle(`${authorData.username}, here's a list of all of your feathers:`)
                .setDescription(`**White Feather ${WhiteFeather} - ${whiteAward} | Gold Feather ${GoldFeather} - ${goldAward} | Blue Feather ${BlueFeather} - ${blueAward}\nCombat Feather ${CombatFeather} - ${redAward}**`)
                .setFooter("*I'll delete this message in 30 seconds.")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 30000
                });
              });
            }
          });
        }
        break;

        //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

      default:
        //Send Help Panel
        const args = await module.exports.feather_args;
        const argsArray = Object.values(args);
        const size = argsArray.length;

        let helpEmbed = new Discord.MessageEmbed()
          .setColor('#bb018a')
          .setTitle(`${message.author.username}, here's a list of what I can do for you.`)
          .setFooter("*I'll delete this message in 1 minute")

        argsArray.forEach(async (item, i) => {
          const name = (item.name.charAt(0).toUpperCase() + item.name.slice(1));

          if (IsLeader) {
            helpEmbed.addField(`─ ${name} ─`, `**| Description:** ${item.description}\n**| Example:** ${item.example}\n**| Available from:** ${item.tag}`, true);
          } else if (!IsLeader && item.tag == "Access Rank I") {
            helpEmbed.addField(`─ ${name} ─`, `**| Description:** ${item.description}\n**| Example:** ${item.example}\n**| Available from:** ${item.tag}`, true);
          }

          if ((i % 2 !== 0) && (i !== size - 1)) {
            helpEmbed.addField("\u200B", "\u200B")
          }
        })

        await targetChannel.send(helpEmbed).then(async (sent) => {
          await sent.delete({
            timeout: 60000
          });
        });
        return;

    }
  },

  help: {
    name: ("feather"),
    description: ("More information about the feather system and it's usage."),
    example: ("!feather"),
    tag: ("Public")
  },

  feather_args: [{
      name: "give",
      description: "Reward somebody with a feather.",
      example: "!feather give [amount] [feather name] @Example_User#0000",
      tag: "Head of Department"
    },
    {
      name: "take",
      description: "Take a feather from somebody.",
      example: "!feather take [amount] [feather name] @Example_User#0000",
      tag: "Head of Department"
    },
    {
      name: "list",
      description: "List all of your existing feathers.",
      example: "!feather list",
      tag: "Access Rank I"
    }
  ]
}
