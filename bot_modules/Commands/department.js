const Discord = require('discord.js');


function areArraysEqual(a1, a2) {
  const superSet = {};
  for (const i of a1) {
    const e = i + typeof i;
    superSet[e] = 1;
  }

  for (const i of a2) {
    const e = i + typeof i;
    if (!superSet[e]) {
      return false;
    }
    superSet[e] = 2;
  }

  for (let e in superSet) {
    if (superSet[e] === 1) {
      return false;
    }
  }

  return true;
}


module.exports = {
  run: async (client, msg, message, allCommands, user, member) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    let everybodyRole;
    let accessIRole;
    let accessIIRole;
    let accessIIIRole;
    let accessIVRole;
    let accessVRole;
    let HoDRoleID;
    let memberRoleID;
    await func.run("Roles", "Everybody", async (response) => {
      everybodyRole = response;
    });
    await func.run("Roles", "AccessI", async (response) => {
      accessIRole = response;
    });
    await func.run("Roles", "AccessII", async (response) => {
      accessIIRole = response;
    });
    await func.run("Roles", "AccessIII", async (response) => {
      accessIIIRole = response;
    });
    await func.run("Roles", "AccessIV", async (response) => {
      accessIVRole = response;
    });
    await func.run("Roles", "AccessV", async (response) => {
      accessVRole = response;
    });
    await func.run("Roles", "HeadOfDepartment", async (response) => {
      HoDRoleID = response;
    });
    await func.run("Roles", "Member", async (response) => {
      memberRoleID = response;
    });

    let ranksCollection;
    await func.run(null, "enabled", async (response) => {
      if (response == "true") {
        ranksCollection = require('../../Data/ranksCollectionDEV.json');
      } else {
        ranksCollection = require('../../Data/ranksCollection.json');
      }
    });

    let guestRoleID;
    let traineeRoleID;
    let leadershipRoleID;
    let diplomatKeyRoleID;
    await func.run("Roles", "Guest", async (response) => {
      guestRoleID = response;
    });
    await func.run("Roles", "Trainee", async (response) => {
      traineeRoleID = response;
    });
    await func.run("Roles", "Leadership", async (response) => {
      leadershipRoleID = response;
    });
    await func.run("Roles", "DiplomatKey", async (response) => {
      diplomatKeyRoleID = response;
    });

    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const author = message.guild.member(message.author)

    await message.delete();
    const arg = msg.replace("department", "").trim().toLowerCase().split(" ");

    let roleIDs = [];
    guild.roles.cache.forEach((item) => {
      if (item.name.includes("¤")) {
        roleIDs.push(item.id);
      }
    });
    const found = roleIDs.some(r => author._roles.indexOf(r) >= 0);
    let foundUser;
    if (user) {
      foundUser = roleIDs.some(r => user._roles.indexOf(r) >= 0);
    }

    //True if author has department and is a HoD
    let IsLeader = false;
    if (author.roles.cache.find(r => r.name.includes("¤")) && author.roles.cache.find(r => r.id == (HoDRoleID))) {
      IsLeader = true;
    }

    switch (arg[0]) {
      //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
      case "create":
        if (author._roles.includes(HoDRoleID) || (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID))) {
          //If author already has a department
          if (found) {
            const warningEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription(`You already have a department.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(warningEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          const name = msg.replace(`department `, '').replace(arg[0], "").trim();

          //If department name is not defined
          if (name == "") {
            const warningEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription(`Please provide a name for your department, so that I can create it for you.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(warningEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          //If role already exists
          if (message.guild.roles.cache.some(role => role.name === `¤ ${name}`)) {
            const warningEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription(`There's already a department under that name.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(warningEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          let departmentRole;
          //Generate role
          await guild.roles.create({
            data: {
              name: `¤ ${name}`,
              color: '#336699',
              mentionable: true
            },
            reason: '',
          }).then(async (role) => {
            departmentRole = await guild.roles.cache.find(r => r.id === role.id);
          });

          let createdChannel;
          //Generate channel
          await guild.channels.create(`💬 ${name}`).then(async (channel) => {
            //Place under departments category
            const category = guild.channels.cache.find(c => c.name == "───── Departments ─────" && c.type == "category");
            if (!category) throw new Error("Category channel does not exist");
            await channel.setParent(category.id);
            await channel.overwritePermissions([
              //department specific Permissions
              {
                id: departmentRole.id.toString(),
                allow: ['VIEW_CHANNEL'],
              },
              //All other general Permissions
              //Access II
              {
                id: accessIIRole,
                allow: ['VIEW_CHANNEL'],
              },
              //Access III
              {
                id: accessIIIRole,
                allow: ['VIEW_CHANNEL'],
              },
              //Access IV
              {
                id: accessIVRole,
                allow: ['VIEW_CHANNEL'],
              },
              //Access V
              {
                id: accessVRole,
                allow: ['VIEW_CHANNEL'],
              },
              //Everybody
              {
                id: everybodyRole,
                deny: ['VIEW_CHANNEL'],
              }
            ]);
            await message.member.roles.add(departmentRole);
            createdChannel = await channel;
          }).catch(async (err) => {
            const warningEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`── Fault Detected: ──`)
              .setDescription(`Error while creating channel:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
              .setFooter("")

            await targetChannel.send(warningEmbed);
            return;
          })

          let voiceName = "";
          let voiceNameTemp = await name.split(" ");
          let tempArray = [];

          await voiceNameTemp.forEach(async (item, i) => {
            await tempArray.push(item.charAt(0).toUpperCase() + item.substring(1));
          })
          voiceName = await tempArray.join(' ');

          let createdVoice;
          //Generate channel
          await guild.channels.create(`🔊 ${voiceName}`, {
            type: "voice"
          }).then(async (channel) => {
            //Place under departments category
            const category = guild.channels.cache.find(c => c.name == "───── Departments ─────" && c.type == "category");
            if (!category) throw new Error("Category channel does not exist");
            await channel.setParent(category.id);
            await channel.overwritePermissions([
              //department specific Permissions
              {
                id: departmentRole.id.toString(),
                allow: ['VIEW_CHANNEL'],
              },
              //All other general Permissions
              //Access II
              {
                id: accessIIRole,
                allow: ['VIEW_CHANNEL'],
              },
              //Access III
              {
                id: accessIIIRole,
                allow: ['VIEW_CHANNEL'],
              },
              //Access IV
              {
                id: accessIVRole,
                allow: ['VIEW_CHANNEL'],
              },
              //Access V
              {
                id: accessVRole,
                allow: ['VIEW_CHANNEL'],
              },
              //Everybody
              {
                id: everybodyRole,
                deny: ['VIEW_CHANNEL'],
              }
            ]);
            createdVoice = await channel;
          }).catch(async (err) => {
            const warningEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`── Fault Detected: ──`)
              .setDescription(`Error while creating voice channel:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
              .setFooter("")

            await targetChannel.send(warningEmbed);
            return;
          })

          //If success
          if (createdChannel && createdVoice) {
            const responseEmbed = new Discord.MessageEmbed()
              .setColor("#00FF00")
              .setTitle(`${message.author.username}, I've created your department, ${name} for you.`)
              .setDescription(`${createdChannel}\n${createdVoice}`)
              .setFooter("*I'll delete this message in 20 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 20000
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

      case "disband":
        if (author._roles.includes(HoDRoleID) || (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID))) {
          //If department leader
          if (author._roles.includes(HoDRoleID)) {

            let roleIDs = [];
            guild.roles.cache.forEach((item) => {
              if (item.name.includes("¤")) {
                roleIDs.push(item.id);
              }
            });

            const found = roleIDs.some(r => author._roles.indexOf(r) >= 0);

            //If author has no department
            if (!found) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`You don't have a department yet.\nI can create one for you if you type !department create.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            //Find role
            let targetRole;
            await roleIDs.forEach(async (departmentRoles) => {
              await author._roles.forEach(authorRoles => {
                if (departmentRoles == authorRoles) {
                  targetRole = guild.roles.cache.get(departmentRoles);
                }
              });
            });

            //Find channels
            let voiceName = "";
            let voiceNameTemp = await targetRole.name.split(" ");
            let tempArray = [];

            await voiceNameTemp.forEach(async (item, i) => {
              await tempArray.push(item.charAt(0).toUpperCase() + item.substring(1));
            })
            voiceName = await tempArray.join(' ');

            let textChannel;
            let voiceChannel;

            const channels = client.channels.cache;
            await channels.forEach(channel => {
              if (channel.name == targetRole.name.replaceAll(" ", "-").replace("¤", "💬")) {
                textChannel = channel;
              }
              if (channel.name == voiceName.replace("¤", "🔊")) {
                voiceChannel = channel;
              }
            })

            //WAIT FOR CONFIRMATION
            const renameEmbed = new Discord.MessageEmbed()
              .setColor("#bb018a")
              .setTitle(`${message.author.username}, please confirm that you want me to disband your department.`)
              .setDescription(`**This cannot be undone!**\n\nClick ✅ -> To disband.\nClick ❎ -> To cancel.`)
              .setFooter("*I'll cancel this operation in 20 seconds if I don't hear from you.");

            await targetChannel.send(renameEmbed).then(async (main) => {
              await main.react('✅');
              await main.react('❎');
              await main.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '❎'), {
                max: 1,
                time: 20000
              }).then(async (collected) => {
                //Rename
                if (collected.first().emoji.name == '✅') {
                  await targetRole.delete();
                  await textChannel.delete();
                  await voiceChannel.delete();

                  //If success
                  const responseEmbed = new Discord.MessageEmbed()
                    .setColor("#00FF00")
                    .setTitle(`${message.author.username}, I've disbanded your department.`)
                    .setDescription("You are free to create a new department.")
                    .setFooter("*I'll delete this message in 20 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 20000
                    });
                  });
                  return;
                }
                // If don't rename
                if (collected.first().emoji.name == '❎') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`${message.author.username}, you've cancelled the disband operation.`)
                    .setFooter("*I'll delete this message in 15 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 15000
                    });
                  });
                  return;
                }
              }).catch(async (err) => {
                if (err.message == "Cannot read properties of undefined (reading 'emoji')") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`${message.author.username}, I've cancelled the disband operation.`)
                    .setFooter("*I'll delete this message in 15 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 15000
                    });
                  });
                } else {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`── Fault Detected: ──`)
                    .setDescription(`Disband Operation Cancelled:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
                  let embed = new Discord.MessageEmbed()
                  main.edit(embed)
                  await targetChannel.send(responseEmbed)
                  console.log(err);
                }
              });
              await main.delete();
            });
          } else if (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID)) {
            let roles = [];
            guild.roles.cache.forEach((item) => {
              let roleObject = {};
              if (item.name.includes("¤")) {
                roleObject.name = item.name;
                roleObject.id = item.id;
                roles.push(roleObject);
              }
            });

            if (roles.length == 0) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`There are no available departments I to disband.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
            const input = msg.replace(`department `, '').replace(arg[0], "").trim();

            if (input == "") {
              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#bb018a")
                .setTitle(`${message.author.username}, I'll need some more information from you.`)
                .setDescription(`Please provide me the name of the department you want me to disband.\n\nAvailable departments:`)
                .setFooter("*I'll delete this message in 20 seconds")

              await roles.forEach((item, i) => {
                responseEmbed.addField(`${i+1}:`, `${item.name.replace("¤", "").trim()}`);
              });

              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 20000
                });
              });
              return;
            }

            //If department name doesn't exists
            let nameExists = false;
            let targetRole;
            await roles.forEach(item => {
              if (item.name.replace("¤", "").trim() == input) {
                nameExists = true;
                targetRole = guild.roles.cache.get(item.id);
              }
            });

            if (!nameExists) {
              const responseEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`${input} doesn't exists.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            //Find channels
            const oldName = `¤ ${input}`;

            let voiceName = "";
            let voiceNameTemp = await oldName.split(" ");
            let tempArray = [];

            await voiceNameTemp.forEach(async (item, i) => {
              await tempArray.push(item.charAt(0).toUpperCase() + item.substring(1));
            })
            voiceName = await tempArray.join(' ');

            let textChannel;
            let voiceChannel;

            const channels = client.channels.cache;
            await channels.forEach(channel => {
              if (channel.name == oldName.replaceAll(" ", "-").replace("¤", "💬")) {
                textChannel = channel;
              }
              if (channel.name == voiceName.replace("¤", "🔊")) {
                voiceChannel = channel;
              }
            })

            //WAIT FOR CONFIRMATION
            const renameEmbed = new Discord.MessageEmbed()
              .setColor("#bb018a")
              .setTitle(`${message.author.username}, please confirm that you want me to disband ${input}`)
              .setDescription(`This cannot be undone!\n\nClick ✅ -> To disband.\nClick ❎ -> To cancel.`)
              .setFooter("*I'll cancel this operation in 20 seconds if I don't hear from you.");

            await targetChannel.send(renameEmbed).then(async (main) => {
              await main.react('✅');
              await main.react('❎');
              await main.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '❎'), {
                max: 1,
                time: 20000
              }).then(async (collected) => {
                //Rename
                if (collected.first().emoji.name == '✅') {
                  await targetRole.delete();
                  await textChannel.delete();
                  await voiceChannel.delete();

                  //If success
                  const responseEmbed = new Discord.MessageEmbed()
                    .setColor("#00FF00")
                    .setTitle(`${message.author.username}, I've disbanded ${input}.`)
                    .setFooter("*I'll delete this message in 20 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 20000
                    });
                  });
                  return;
                }
                // If don't rename
                if (collected.first().emoji.name == '❎') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`${message.author.username}, you've cancelled the disband operation.`)
                    .setFooter("*I'll delete this message in 15 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 15000
                    });
                  });
                  return;
                }
              }).catch(async (err) => {
                if (err.message == "Cannot read properties of undefined (reading 'emoji')") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`${message.author.username}, I've cancelled the disband operation.`)
                    .setFooter("*I'll delete this message in 15 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 15000
                    });
                  });
                } else {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`── Fault Detected: ──`)
                    .setDescription(`Disband Operation Cancelled:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
                  let embed = new Discord.MessageEmbed()
                  main.edit(embed)
                  await targetChannel.send(responseEmbed)
                  console.log(err);
                }
              });
              await main.delete();
            });
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

      case "rename":
        if (author._roles.includes(HoDRoleID) || (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID))) {
          //If department leader
          if (author._roles.includes(HoDRoleID)) {

            let roleIDs = [];
            guild.roles.cache.forEach((item) => {
              if (item.name.includes("¤")) {
                roleIDs.push(item.id);
              }
            });

            const found = roleIDs.some(r => author._roles.indexOf(r) >= 0);

            //If author has no department
            if (!found) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`You don't have a department yet.\nI can create one for you if you type !department create.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            const name = msg.replace(`department `, '').replace(arg[0], "").trim();

            //If department name is not defined
            if (name == "") {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`Please provide a new name for your department, so that I can rename it for you.\n\n**Example: !department rename [New Department Name]`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            //If role already exists
            if (message.guild.roles.cache.some(role => role.name === `¤ ${name}`)) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`There's already a department under that name.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            //Find role
            let targetRole;
            await roleIDs.forEach(async (departmentRoles) => {
              await author._roles.forEach(authorRoles => {
                if (departmentRoles == authorRoles) {
                  targetRole = guild.roles.cache.get(departmentRoles);
                }
              });
            });

            //Find channels
            let voiceName = "";
            let voiceNameTemp = await targetRole.name.split(" ");
            let tempArray = [];

            await voiceNameTemp.forEach(async (item, i) => {
              await tempArray.push(item.charAt(0).toUpperCase() + item.substring(1));
            })
            voiceName = await tempArray.join(' ');

            let textChannel;
            let voiceChannel;

            const channels = client.channels.cache;
            await channels.forEach(channel => {
              if (channel.name == targetRole.name.replaceAll(" ", "-").replace("¤", "💬")) {
                textChannel = channel;
              }
              if (channel.name == voiceName.replace("¤", "🔊")) {
                voiceChannel = channel;
              }
            })

            //Generate new names
            let newVoiceChannel = "";
            let newVoiceChannelTemp = await name.split(" ");
            let newTempArray = [];

            await newVoiceChannelTemp.forEach(async (item, i) => {
              await newTempArray.push(item.charAt(0).toUpperCase() + item.substring(1));
            })
            newVoiceChannel = await newTempArray.join(' ');

            const newTextName = `💬 ${name}`;
            const newVoiceName = `🔊 ${newVoiceChannel}`;

            //WAIT FOR CONFIRMATION
            const renameEmbed = new Discord.MessageEmbed()
              .setColor("#bb018a")
              .setTitle(`${message.author.username}, please confirm that you want me to rename your department to ${name}`)
              .setDescription(`Click ✅ -> To rename.\nClick ❎ -> To cancel.`)
              .setFooter("*I'll cancel this operation in 20 seconds if I don't hear from you.");

            await targetChannel.send(renameEmbed).then(async (main) => {
              await main.react('✅');
              await main.react('❎');
              await main.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '❎'), {
                max: 1,
                time: 20000
              }).then(async (collected) => {
                //Rename
                if (collected.first().emoji.name == '✅') {
                  await targetRole.setName(`¤ ${name}`);
                  await textChannel.setName(newTextName);
                  await voiceChannel.setName(newVoiceName);

                  //If success
                  const responseEmbed = new Discord.MessageEmbed()
                    .setColor("#00FF00")
                    .setTitle(`${message.author.username}, I've renamed your department to ${name} for you.`)
                    .setDescription(`${textChannel}\n${voiceChannel}`)
                    .setFooter("*I'll delete this message in 20 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 20000
                    });
                  });
                  return;
                }
                // If don't rename
                if (collected.first().emoji.name == '❎') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`${message.author.username}, you've cancelled the rename operation.`)
                    .setFooter("*I'll delete this message in 15 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 15000
                    });
                  });
                  return;
                }
              }).catch(async (err) => {
                if (err.message == "Cannot read properties of undefined (reading 'emoji')") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`${message.author.username}, I've cancelled the rename operation.`)
                    .setFooter("*I'll delete this message in 15 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 15000
                    });
                  });
                } else {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`── Fault Detected: ──`)
                    .setDescription(`Rename Operation Cancelled:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
                  let embed = new Discord.MessageEmbed()
                  main.edit(embed)
                  await targetChannel.send(responseEmbed)
                  console.log(err);
                }
              });
              await main.delete();
            });
          } else if (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID)) {
            let roles = [];
            guild.roles.cache.forEach((item) => {
              let roleObject = {};
              if (item.name.includes("¤")) {
                roleObject.name = item.name;
                roleObject.id = item.id;
                roles.push(roleObject);
              }
            });

            if (roles.length == 0) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`There are no available departments I could rename for you.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
            const input = msg.replace(`department `, '').replace(arg[0], "").trim();

            if (!input.includes("to")) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`You're missing the 'to' keyword.\n\n**Example: !department rename [Old Name] to [New Name]**`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
            let oldName = input.split("to")[0].trim();
            let newName = input.split("to")[1].trim();

            //If old name or new name is not defined
            if (oldName == "" || newName == "") {
              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#bb018a")
                .setTitle(`${message.author.username}, I'll need some more information from you.`)
                .setDescription(`Please provide me the name of the department you want me to rename and what to rename it to.\n**Example: !department rename [Old Name] to [New Name]**\n\nAvailable departments:`)
                .setFooter("*I'll delete this message in 20 seconds")

              await roles.forEach((item, i) => {
                responseEmbed.addField(`${i+1}:`, `${item.name.replace("¤", "").trim()}`);
              });

              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 20000
                });
              });
              return;
            }

            //If role already exists
            if (message.guild.roles.cache.some(role => role.name === `¤ ${newName}`)) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`There's already a department under that name.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            //If department name doesn't exists
            let nameExists = false;
            let targetRole;
            await roles.forEach(item => {
              if (item.name.replace("¤", "").trim() == oldName) {
                nameExists = true;
                targetRole = guild.roles.cache.get(item.id);
              }
            });

            if (!nameExists) {
              const responseEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`${oldName} doesn't exists.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            //Find channels
            oldName = `¤ ${oldName}`;

            let voiceName = "";
            let voiceNameTemp = await oldName.split(" ");
            let tempArray = [];

            await voiceNameTemp.forEach(async (item, i) => {
              await tempArray.push(item.charAt(0).toUpperCase() + item.substring(1));
            })
            voiceName = await tempArray.join(' ');

            let textChannel;
            let voiceChannel;

            const channels = client.channels.cache;
            await channels.forEach(channel => {
              if (channel.name == oldName.replaceAll(" ", "-").replace("¤", "💬")) {
                textChannel = channel;
              }
              if (channel.name == voiceName.replace("¤", "🔊")) {
                voiceChannel = channel;
              }
            })

            //Generate new names
            let newVoiceChannel = "";
            let newVoiceChannelTemp = await newName.split(" ");
            let newTempArray = [];

            await newVoiceChannelTemp.forEach(async (item, i) => {
              await newTempArray.push(item.charAt(0).toUpperCase() + item.substring(1));
            })
            newVoiceChannel = await newTempArray.join(' ');

            const newTextName = `💬 ${newName}`;
            const newVoiceName = `🔊 ${newVoiceChannel}`;

            //WAIT FOR CONFIRMATION
            const renameEmbed = new Discord.MessageEmbed()
              .setColor("#bb018a")
              .setTitle(`${message.author.username}, please confirm that you want me to rename ${oldName.replace("¤","").trim()} to ${newName}`)
              .setDescription(`Click ✅ -> To rename.\nClick ❎ -> To cancel.`)
              .setFooter("*I'll cancel this operation in 20 seconds if I don't hear from you.");

            await targetChannel.send(renameEmbed).then(async (main) => {
              await main.react('✅');
              await main.react('❎');
              await main.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '✅' || reaction.emoji.name == '❎'), {
                max: 1,
                time: 20000
              }).then(async (collected) => {
                //Rename
                if (collected.first().emoji.name == '✅') {
                  await targetRole.setName(`¤ ${newName}`);
                  await textChannel.setName(newTextName);
                  await voiceChannel.setName(newVoiceName);

                  //If success
                  const responseEmbed = new Discord.MessageEmbed()
                    .setColor("#00FF00")
                    .setTitle(`${message.author.username}, I've renamed ${oldName.replace("¤","").trim()} to ${newName} for you.`)
                    .setDescription(`${textChannel}\n${voiceChannel}`)
                    .setFooter("*I'll delete this message in 20 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 20000
                    });
                  });
                  return;
                }
                // If don't rename
                if (collected.first().emoji.name == '❎') {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`${message.author.username}, you've cancelled the rename operation.`)
                    .setFooter("*I'll delete this message in 15 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 15000
                    });
                  });
                  return;
                }
              }).catch(async (err) => {
                if (err.message == "Cannot read properties of undefined (reading 'emoji')") {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`${message.author.username}, I've cancelled the rename operation.`)
                    .setFooter("*I'll delete this message in 15 seconds.")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({
                      timeout: 15000
                    });
                  });
                } else {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`── Fault Detected: ──`)
                    .setDescription(`Rename Operation Cancelled:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
                  let embed = new Discord.MessageEmbed()
                  main.edit(embed)
                  await targetChannel.send(responseEmbed)
                  console.log(err);
                }
              });
              await main.delete();
            });
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

      case "assign":
        if (author._roles.includes(HoDRoleID) || (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID))) {
          if (user == undefined) {
            const noMentionEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription('Please provide who you want me to assign to your department in the form of a mention.')
              .setFooter(`Example, !assign @Example_User#0000`)
            await targetChannel.send(noMentionEmbed);
            return;
          }
          //don't allow recruit and trainee to be assigned
          if (user._roles.includes(guestRoleID) || user._roles.includes(traineeRoleID)) {
            const responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${message.author.username}.\n${member.username}'s rank is too low for this.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }
          //If user already has a department
          if (foundUser) {
            const warningEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${message.author.username}.\n${member.username}#${member.discriminator} is already assigned to a department.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(warningEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          //If department leader
          if (author._roles.includes(HoDRoleID)) {
            //If author doesn't have a department
            if (!found) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`You don't have a department yet.\nI can make you one if you'd like. Just type, !department create`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            } else {
              //Grab department leader's department role
              let targetRole;
              await roleIDs.forEach(async (departmentRoles) => {
                await author._roles.forEach(authorRoles => {
                  if (departmentRoles == authorRoles) {
                    targetRole = guild.roles.cache.get(departmentRoles);
                  }
                });
              });

              //Add department rank
              await user.roles.add(targetRole)

              const responseEmbed = new Discord.MessageEmbed()
                .setColor("#00FF00")
                .setTitle(`${message.author.username}, I've assigned ${member.username} to your department, ${targetRole.name}.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
          }

          //For higher ups
          else if (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID)) {
            let roles = [];
            guild.roles.cache.forEach((item) => {
              let roleObject = {};
              if (item.name.includes("¤")) {
                roleObject.name = item.name;
                roleObject.id = item.id;
                roles.push(roleObject);
              }
            });

            if (roles.length == 0) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`There are no available departments I could assign ${member.username} to.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            const departmentName = msg.replace(`department `, '').replace(arg[0], "").replace(`<@!${user.id}>`, "").trim();

            //If department name is not defined
            if (departmentName == "") {
              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#bb018a")
                .setTitle(`${message.author.username}, I'll need some more information from you.`)
                .setDescription(`Please provide me the name of the department you want me to assign ${member.username} to.\n**Example: !department assign @Example_User#0000 [Department]**\n\nAvailable departments:`)
                .setFooter("*I'll delete this message in 20 seconds")

              await roles.forEach((item, i) => {
                responseEmbed.addField(`${i+1}:`, `${item.name.replace("¤", "").trim()}`);
              });

              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 20000
                });
              });
              return;
            }

            //If department name doesn't exists
            let nameExists = false;
            let targetRole;
            await roles.forEach(item => {
              if (item.name.replace("¤", "").trim() == departmentName) {
                nameExists = true;
                targetRole = guild.roles.cache.get(item.id);
              }
            });

            if (!nameExists) {
              const responseEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`${departmentName} doesn't exists.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            //Add department rank
            await user.roles.add(targetRole)

            const responseEmbed = new Discord.MessageEmbed()
              .setColor("#00FF00")
              .setTitle(`${message.author.username}, I've assigned ${member.username} to department, ${targetRole.name}.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
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

      case "unassign":
        if (author._roles.includes(HoDRoleID) || (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID))) {
          if (user == undefined) {
            const noMentionEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription('Please provide who you want me to unassign from your department in the form of a mention.')
              .setFooter(`Example: !unassign @Example_User#0000`)
            await targetChannel.send(noMentionEmbed);
            return;
          }
          //If user already has a department
          if (!foundUser) {
            const warningEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${message.author.username}.\n${member.username}#${member.discriminator} Is not in any department.`)
              .setFooter("*I'll delete this message in 10 seconds")
            await targetChannel.send(warningEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          //If department leader
          if (author._roles.includes(HoDRoleID)) {
            //If author doesn't have a department
            if (!found) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`You don't have a department yet.\nI can make you one if you'd like. Just type, !department create`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            } else {
              //Grab department leader's department role
              let targetRole;
              await roleIDs.forEach(async (departmentRoles) => {
                await author._roles.forEach(authorRoles => {
                  if (departmentRoles == authorRoles) {
                    targetRole = guild.roles.cache.get(departmentRoles);
                  }
                });
              });

              //Get recruit rank
              const guestRank = await guild.roles.cache.get(guestRoleID);
              const traineeRole = await guild.roles.cache.get(traineeRoleID);

              //Remove trainee rank and add recruit rank
              if (user._roles.includes(traineeRoleID)) {
                await user.roles.remove(traineeRole);
                await user.roles.add(guestRank);
              }

              //Remove department rank
              await user.roles.remove(targetRole)

              const responseEmbed = new Discord.MessageEmbed()
                .setColor("#00FF00")
                .setTitle(`${message.author.username}, I've unassigned ${member.username} from your department, ${targetRole.name}.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
          }

          //For higher ups
          else if (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID)) {
            let roles = [];
            guild.roles.cache.forEach((item) => {
              let roleObject = {};
              if (item.name.includes("¤")) {
                roleObject.name = item.name;
                roleObject.id = item.id;
                roles.push(roleObject);
              }
            });

            if (roles.length == 0) {
              const warningEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`There are no available departments I could unassign ${member.username} from.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }

            const departmentName = msg.replace(`department `, '').replace(arg[0], "").replace(`<@!${user.id}>`, "").trim();

            //If department name is not defined
            if (departmentName == "") {
              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#bb018a")
                .setTitle(`${message.author.username}, I'll need some more information from you.`)
                .setDescription(`Please provide me the name of the department you want me to unassign ${member.username} from.\n**Example: !department unassign @Example_User#0000 [Department]**\n\nAvailable departments:`)
                .setFooter("*I'll delete this message in 20 seconds")

              await roles.forEach((item, i) => {
                responseEmbed.addField(`${i+1}:`, `${item.name.replace("¤", "").trim()}`);
              });

              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 20000
                });
              });
              return;
            }

            //If department name doesn't exists
            let nameExists = false;
            let targetRole;
            await roles.forEach(item => {
              if (item.name.replace("¤", "").trim() == departmentName) {
                nameExists = true;
                targetRole = guild.roles.cache.get(item.id);
              }
            });

            if (!nameExists) {
              const responseEmbed = new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setDescription(`${departmentName} doesn't exists.`)
                .setFooter("*I'll delete this message in 10 seconds.")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }


            //Get recruit rank
            const guestRank = await guild.roles.cache.get(guestRoleID);
            const traineeRole = await guild.roles.cache.get(traineeRoleID);

            //Remove trainee rank and add recruit rank
            if (user._roles.includes(traineeRoleID)) {
              await user.roles.remove(traineeRole);
              await user.roles.add(guestRank);
            }

            //Remove department rank
            await user.roles.remove(targetRole)

            const responseEmbed = new Discord.MessageEmbed()
              .setColor("#00FF00")
              .setTitle(`${message.author.username}, I've unassigned ${member.username} from department, ${targetRole.name}.`)
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
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

      case "resign":
        if (author._roles.includes(HoDRoleID) || (!author._roles.includes(accessIRole) && !author._roles.includes(accessIIRole) && !author._roles.includes(memberRoleID) && !author._roles.includes(diplomatKeyRoleID))) {
          const targetUser = message.mentions.users.array()[0];
          const replaceUser = message.mentions.users.array()[1];

          if (targetUser == undefined) {
            const noMentionEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription('Please provide who you want me to resign in the form of a mention.')
              .setFooter(`Example: !department resign @UserToResign#0000 @UserToTakePlace#0000`)
            await targetChannel.send(noMentionEmbed);
            return;
          }

          if (replaceUser == undefined) {
            const noMentionEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription('Please provide a user who will take the place of the one who is resigning in the form of a mention.')
              .setFooter(`Example: !department resign @UserToResign#0000 @UserToTakePlace#0000`)
            await targetChannel.send(noMentionEmbed);
            return;
          }

          const targetUserObj = await message.guild.member(targetUser.id);
          const replaceUserObj = await message.guild.member(replaceUser.id);

          const foundResUser = roleIDs.some(r => targetUserObj._roles.indexOf(r) >= 0);
          const foundResUser2 = roleIDs.some(r => replaceUserObj._roles.indexOf(r) >= 0);

          if (targetUserObj._roles.includes(leadershipRoleID)) {
            const warningEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription('I cannot resign somebody from the Leadership.')
              .setFooter("*I'll delete this message in 10 seconds.")
            await targetChannel.send(warningEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          //Get department role of resigning user
          let resigningRole;
          await roleIDs.forEach(async (departmentRoles) => {
            await targetUserObj._roles.forEach(userRoles => {
              if (departmentRoles == userRoles) {
                resigningRole = guild.roles.cache.get(departmentRoles);
              }
            });
          });

          //Get department role of replacing user
          let replacingRole;
          await roleIDs.forEach(async (departmentRoles) => {
            await replaceUserObj._roles.forEach(userRoles => {
              if (departmentRoles == userRoles) {
                replacingRole = guild.roles.cache.get(departmentRoles);
              }
            });
          });

          //If targetUser has no department
          if (!foundResUser || (foundResUser2 && resigningRole != replacingRole)) {
            let warningEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setFooter("*I'll delete this message in 10 seconds")
            if (!foundResUser) {
              warningEmbed.setDescription(`${targetUser.username}#${targetUser.discriminator} is not in any department.`)
            } else {
              warningEmbed.setDescription(`${replaceUser.username}#${replaceUser.discriminator} is already in a different department.`)
            }
            await targetChannel.send(warningEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 10000
              });
            });
            return;
          }

          let availableRanks = [];
          let userRoles = [];
          let authorRoles = [];

          //Get data from ranksCollection.json
          const rankMap = new Map(Object.entries(ranksCollection[0]))
          const rankKeys = Object.keys(ranksCollection[0])

          //Get userRoles
          await replaceUserObj.roles.cache.forEach(async (role) => {
            await rankKeys.map(x => {
              rankMap.get(x).map(y => {
                if (y.id == role.id) {
                  userRoles.push(role.id)
                }
              })
            })
          });

          //Get author roles
          await targetUserObj.roles.cache.forEach(async (role) => {
            await user.roles.cache.forEach(role => {
              rankKeys.map(x => {
                rankMap.get(x).map(y => {
                  if (y.id == role.id) {
                    authorRoles.push(role.id);
                  }
                })
              })
            });
          });

          let IDArray = [];
          let NameArray = [];
          let AllIDs = [];
          let removedArr = [];

          rankKeys.map(x => {
            let tempArray1 = [];
            NameArray.push(x);

            rankMap.get(x).map(y => {
              tempArray1.push(y.id)
            })

            if (!areArraysEqual(tempArray1, userRoles)) {
              AllIDs.push(tempArray1);
            } else {
              AllIDs.push([])
              removedArr = [...tempArray1]
            }
          })

          //Transform data into usable format
          const isEmpty = (element) => element.length == 0;
          const userRank = AllIDs.findIndex(isEmpty);

          let authorRolesIndex = 0;
          await AllIDs.forEach(async (item, i) => {
            if (areArraysEqual(item, authorRoles)) {
              return authorRolesIndex = i
            }
          })

          //If replaceUser is higher ranked than targetUser
          if (userRank > authorRolesIndex) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}.\n${replaceUser.username}#${replaceUser.discriminator} is ranked higher than ${targetUser.username}#${targetUser.discriminator}.`)
              .setFooter("*I'll delete this message in 15 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 15000
              });
            });
            return;
          }

          if (userRank <= 3) {
            let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription(`${replaceUser.username}#${replaceUser.discriminator}'s rank is too low for this.\nOnly users with Member II or higher ranks are eligible for replacing an officer.`)
              .setFooter("*I'll delete this message in 15 seconds.")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 15000
              });
            });
            return;
          }

          IDArray = [...AllIDs];
          const filtered = IDArray.filter((a) => a.length);

          //Remove old roles of replaceUser
          await replaceUserObj._roles.forEach(async (item) => {
            let role = guild.roles.cache.get(item);
            await replaceUserObj.roles.remove(role);
          })

          //Add new roles of replaceUser
          await AllIDs[authorRolesIndex].forEach(async (item) => {
            let role = guild.roles.cache.get(item);
            await replaceUserObj.roles.add(role);
          })

          //Transfer department role
          await replaceUserObj.roles.add(resigningRole);
          await targetUserObj.roles.remove(resigningRole);

          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#00FF00')
            .setTitle(`${message.author.username}, I've resigned ${targetUser.username}#${targetUser.discriminator}.`)
            .setDescription(`Their place have been taken by **${replaceUser.username}#${replaceUser.discriminator}**.`)
            .setFooter("*I'll delete this message in 20 seconds.")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 20000
            });
          });
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

      case "leave":
        if (!author.roles.cache.find(r => r.name.includes("¤"))) {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
            .setDescription(`You're currently not in any department.`)
            .setFooter("*I'll delete this message in 10 seconds")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 10000
            });
          });
          return;
        } else if (author._roles.includes(HoDRoleID)) {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
            .setDescription(`**${authorData.username}, you cannot leave a department if you are the head of department.**\nIf you want to stop leading your current department I can resign you, if you type: **!department resign** or disband your department, if you type **!department disband**`)
            .setFooter("*I'll delete this message in 15 seconds")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 15000
            });
          });
          return;
        } else {
          let targetDepartmentID;
          let targetDepartment;

          await author.roles.cache.find(r => {
            if (r.name.includes("¤")) {
              targetDepartmentID = r.id;
              targetDepartment = r.name;
            }
          });

          await author.roles.remove(targetDepartmentID);

          let responseEmbed = new Discord.MessageEmbed()
            .setColor('#00FF00')
            .setTitle(`${message.author.username}, I've unassigned you from the department ${targetDepartment}`)
            .setFooter("*I'll delete this message in 10 seconds")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({
              timeout: 10000
            });
          });
        }
        break;

        //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

      default:
        //Send Help Panel
        const args = await module.exports.department_args;
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
    name: ("department"),
    description: ("More information about the department system and it's usage."),
    example: ("!department"),
    tag: ("Public")
  },

  department_args: [{
      name: "create",
      description: "Create a new department.",
      example: "!department create [department name]",
      tag: "Head of Department"
    },
    {
      name: "disband",
      description: "Disband your department.",
      example: "!department disband",
      tag: "Head of Department"
    },
    {
      name: "rename",
      description: "Rename an existing department.",
      example: "!department rename [old name] to [new name]",
      tag: "Head of Department"
    },
    {
      name: "assign",
      description: "Assign somebody to your department.",
      example: "!department assign @Example_User#0000",
      tag: "Head of Department"
    },
    {
      name: "unassign",
      description: "Unassign somebody from your department.",
      example: "!department unassign @Example_User#0000",
      tag: "Head of Department"
    },
    {
      name: "resign",
      description: "Resign from a department.",
      example: "!department resign @UserToResign#0000 @UserToTakePlace#0000",
      tag: "Head of Department"
    },
    {
      name: "leave",
      description: "Leave your current department.",
      example: "!department leave",
      tag: "Access Rank I"
    }
  ]
}
