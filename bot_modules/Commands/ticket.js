const Discord = require('discord.js');
const dayjs = require('dayjs')



function cleanString(input) {
    let output = "";
    for (let i=0; i<input.length; i++) {
        if (input.charCodeAt(i) <= 127) {
          output += input.charAt(i);
        }
        else {
          output += "?";
        }
    }
    return output;
}

function removeItemAll(arr, value) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}


module.exports = {
  run: async (client, msg, message, allCommands, user, member, connection, query) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;

    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    let HoDRoleID;
    await func.run("Roles", "HeadOfDepartment", async (response) => {
      HoDRoleID = response;
    });
    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const author = await message.guild.member(message.author);
    const authorData = await client.users.fetch(author.id);

    await message.delete();
    const arg = msg.replace("ticket", "").trim().toLowerCase().split(" ");

    let departmentIDs = [];
    await guild.roles.cache.forEach((item) => {
      if (item.name.includes("¤")){
        departmentIDs.push(item.id);
      }
    });

    let departmentNames = [];
    await guild.roles.cache.forEach((item) => {
      if (item.name.includes("¤")){
        departmentNames.push(item.name);
      }
    });

    //True if author has department and is a HoD
    let IsLeader = false;
    if (author.roles.cache.find(r => r.name.includes("¤")) && author.roles.cache.find(r => r.id == (HoDRoleID))) {
      IsLeader = true;
    }

    switch (arg[0]) {
      //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
      case "create":
        let selectedDepartment;
        let description;
        let count = 0;

        await query(`SELECT * FROM tickets WHERE UserID = "${authorData.id}"`, async (error, rows, field) => {
          if (error) {
           console.log(error)
           let responseEmbed = new Discord.MessageEmbed()
           .setColor("#FF0000")
           .setTitle("── Fault Detected ──")
           .setDescription(`${error}`)
           await targetChannel.send(responseEmbed);
           return;
          }

          await rows.forEach(async (item, i) => {
            count++;
          });
          if (count >= 5) {
            let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid you can only have 5 tickets in total.`)
            .setDescription("I can give you a list of your existing tickets if you type: '!ticket list'\nAlternatively I can delete one of your tickets if you type '!ticket delete TicketID'")
            .setFooter("*I'll delete this message in 15 seconds")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              return await sent.delete({timeout:15000});
            });
          }
          else {
            try {
              let dmEmbed = new Discord.MessageEmbed()
              .setColor('#bb018a')
              .setTitle('Ticket Creation Step 1/2')
              .setDescription(`**Please type the name of the department you want me to send your ticket to.\nDepartments:**`)
              .setFooter("I'll cancel this operation in 1 minute if I don't hear from you.")

              await departmentNames.forEach(async (item, i) => {
                const name = await item.replace("¤", "").trim();
                await dmEmbed.addField(`─ [${i+1}] ─`, `**${name}**`, false);
                if (i+1 == departmentNames.length) {
                  await message.author.send(dmEmbed).then(() => {message.author.dmChannel.awaitMessages((response) => message.content, {
                     max: 1,time: 60000, errors: ['time']
                  }).then(async (collected) => {
                    try {
                      let msg = collected.first().content.trim().toLowerCase();
                      if (departmentNames.includes(`¤ ${msg}`)) {
                        selectedDepartment = `¤ ${msg}`;

                        let targetDepartmentID;
                        await guild.roles.cache.forEach(async (item) => {
                          if (item.name.includes(selectedDepartment)){
                            targetDepartmentID = await item.id;
                          }
                        });

                        let count = 0;
                        await query(`SELECT * FROM tickets WHERE DepartmentID = "${targetDepartmentID}"`, async (error, rows, field) => {
                          if (error) {
                           console.log(error)
                           let responseEmbed = new Discord.MessageEmbed()
                           .setColor("#FF0000")
                           .setTitle("── Fault ──")
                           .setDescription(`${error}`)
                           await message.author.send(responseEmbed);
                           return;
                          }
                          await rows.forEach(async (item, i) => {
                            count++;
                          });
                          if (count >= 15) {
                            let responseEmbed = new Discord.MessageEmbed()
                            .setColor("#FF0000")
                            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid ${selectedDepartment} has reached it's maximum ticket limit.`)
                            .setDescription("I've cancelled the Ticket Creation.\nIf you'd like me to start one again, you can do so by typing '!ticket create' in the server")
                            await message.author.send(responseEmbed);
                          }
                          else {
                            let responseEmbed = new Discord.MessageEmbed()
                            .setColor("#00FF00")
                            .setTitle(`You've selected "${msg}"`)
                            await message.author.send(responseEmbed).then(async (sent) => {
                              let dmEmbed = new Discord.MessageEmbed()
                              .setColor('#bb018a')
                              .setTitle('Ticket Creation Step 2/2')
                              .setDescription(`**Please type a short, (max. 500 characters) description of the ticket and just press enter.\nMake sure to include the following:**\n\n─Ticket type. Example: Mining\n─What do you need. Example: 5 stacks of Charodium\n─Miscallenious instructions to ${selectedDepartment}`)
                              .setFooter("I'll cancel this operation in 5 minutes if I don't hear from you.")

                              await message.author.send(dmEmbed).then(() => {message.author.dmChannel.awaitMessages((response) => message.content, {
                                max: 1,time: 300000, errors: ['time']
                              }).then(async (collected) => {
                                try {
                                  let msg;
                                  if (collected.first().content.includes('"')) {
                                    msg = collected.first().content.replaceAll('"',"'").trim();
                                  }
                                  else {
                                    msg = collected.first().content.trim();
                                  }
                                  let check = Array.from(msg)

                                  if (check.length <= 1000) {
                                    description = cleanString(msg);

                                    let isError = false;
                                    await query(`INSERT INTO tickets (Description, UserID, DepartmentID) VALUES ("${description}", "${message.author.id}", "${targetDepartmentID}")`, async (error) => {
                                      if (error) {
                                        isError = true;
                                        console.log(error)
                                        let responseEmbed = new Discord.MessageEmbed()
                                        .setColor("#FF0000")
                                        .setTitle("── Fault ──")
                                        .setDescription(`${error}`)
                                        await message.author.send(responseEmbed);
                                        return;
                                      }
                                    });

                                    if (!isError) {
                                      let responseEmbed = new Discord.MessageEmbed()
                                      .setColor("#00FF00")
                                      .setTitle(`${message.author.username}, I've created your Ticket.`)
                                      .setDescription("I can give you a list of your existing tickets if you type '!ticket list' in the server.")
                                      await message.author.send(responseEmbed);

                                      await guild.members.fetch().then(async (members) => {
                                  	     await members.forEach(async (member) => {
                                          if (member._roles.includes(targetDepartmentID) && member._roles.includes(HoDRoleID)) {
                                            const memberData = await client.users.fetch(member.id);
                                            let notifyEmbed = new Discord.MessageEmbed()
                                            .setColor("#bb018a")
                                            .setTitle(`${memberData.username}, Your department got a new Ticket.`)

                                            await query(`SELECT * FROM tickets WHERE UserID = "${authorData.id}" ORDER BY CreatedAt DESC`, async (error, rows, field) => {
                                              if (error) {
                                                console.log(error)
                                                let responseEmbed = new Discord.MessageEmbed()
                                                .setColor("#FF0000")
                                                .setTitle("── Fault ──")
                                                .setDescription(`${error}`)
                                                await message.author.send(responseEmbed);
                                                return;
                                              }
                                              await rows.forEach(async (item, i) => {
                                                const creator = await client.users.fetch(item.UserID)
                                                const department = await guild.roles.cache.get(item.DepartmentID);
                                                const date = dayjs((item.CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

                                                if (i == 0) {
                                                  await notifyEmbed.addField(`─ Ticket #${item.TicketID} ─`, `**| Description:** ${item.Description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
                                                  return await member.send(notifyEmbed);
                                                }
                                              })
                                            });
                                          }
                                        });
                                      });
                                    }
                                  }
                                  else {
                                    let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#FF0000")
                                    .setTitle(`I'm sorry, ${message.author.username}. I'm afraid your ticket description is too long.`)
                                    .setDescription("I've cancelled the Ticket Creation.\nIf you'd like me to start one again, you can do so by typing '!ticket create' in the server")
                                    await message.author.send(responseEmbed);
                                  }
                                }
                                catch(error) {
                                   console.log(error)
                                   let responseEmbed = new Discord.MessageEmbed()
                                   .setColor("#FF0000")
                                   .setTitle(`── Ticket Creation Fatal Fault ──`)
                                   .setDescription(`Error: ${error}`)
                                   await message.author.send(responseEmbed);
                                }
                                 }).catch(async (collected) => {
                                   if (!Object.keys(collected).length && !error) {
                                     let responseEmbed = new Discord.MessageEmbed()
                                     .setColor("#FF0000")
                                     .setTitle(`${message.author.username}, I've cancelled the ticket creation.`)
                                     .setDescription("If you'd like me to start one again, you can do so by typing '!ticket create' in the server")
                                     await message.author.send(responseEmbed);
                                     }
                                 });
                              });
                            });
                          }
                        });
                      }
                      else {
                        let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#FF0000")
                        .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I couldn't find ${msg}.`)
                        .setDescription("I've cancelled the Ticket Creation.\nIf you'd like me to start one again, you can do so by typing '!ticket create' in the server")
                        await message.author.send(responseEmbed);
                      }
                    }
                    catch(error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle(`── Ticket Creation Fatal Fault ──`)
                      .setDescription(`Error: ${error}`)
                      await message.author.send(responseEmbed);
                    }
                  }).catch(async (collected) => {
                    if (!Object.keys(collected).length && !error) {
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle(`${message.author.username}, I've cancelled the ticket creation.`)
                      .setDescription("If you'd like me to start one again, you can do so by typing '!ticket create' in the server")
                      await message.author.send(responseEmbed);
                    }
                  });
                });
              };
            });
            }
            catch(e) {
              const warningEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I couldn't send you a private message.`)
              .setDescription("Please make sure you have DMs enabled.")
              .setFooter("*I'll delete this message in 15 seconds")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({timeout:15000});
              });
            }

            const responseEmbed = new Discord.MessageEmbed()
            .setColor('#00FF00')
            .setTitle(`${message.author.username}, I've sent you a private message with instructions to creating a ticket.`)
            .setDescription("")
            .setFooter("*I'll delete this message in 10 seconds")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({timeout:10000});
            });
          }
        });
        break;

      //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
      case "delete":
        let secondArg = msg.replace("ticket", "").replace(arg[0], "").trim().toLowerCase();
        secondArg.match(/\d+/g);

        if (!secondArg) {
          let warningEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
          .setDescription(`**Please provide a TicketID so I can search for your ticket.**\n\I can get you a list of your tickets and TicketIDs if you type, '!ticket list'\nTicketID looks like: **Ticket #1** where **1 is the ID**\n\nExample: !ticket delete 1`)
          .setFooter("*I'll delete this message in 15 seconds")
          await targetChannel.send(warningEmbed).then(async (sent) => {
            await sent.delete({timeout:15000});
            return;
          });
        }
        else {
          await query(`SELECT * FROM tickets WHERE TicketID = "${secondArg}"`, async (error, rows, field) => {
            if (error) {
             console.log(error)
             let responseEmbed = new Discord.MessageEmbed()
             .setColor("#FF0000")
             .setTitle("── Fault ──")
             .setDescription(`${error}`)
             await targetChannel.send(responseEmbed);
             return;
            }

            if (rows.length == 0) {
              let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription(`**I can't find Ticket #${secondArg}**\n\nI can get you a list of your tickets and TicketIDs if you type, '!ticket list'`)
              .setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({timeout:10000});
                return;
              });
            }
            else {
              const creator = await client.users.fetch(rows[0].UserID)
              const DepartmentID = rows[0].DepartmentID;
              const department = await guild.roles.cache.get(rows[0].DepartmentID);
              const description = rows[0].Description
              const date = dayjs((rows[0].CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

              if (((authorData.id != creator.id) && !IsLeader) || (IsLeader && !author._roles.includes(department.id))) {
                let responseEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setFooter("*I'll delete this message in 10 seconds")

                if (!IsLeader) {
                  responseEmbed.setDescription(`I can only delete tickets you created.`)
                }
                else {
                  responseEmbed.setDescription(`I can only delete tickets you created or tickets that are for your department.`)
                }

                await targetChannel.send(responseEmbed).then(async (sent) => {
                  await sent.delete({timeout:10000});
                  return;
                });
              }
              else {
                //If department leader deletes
                if (IsLeader && author._roles.includes(DepartmentID)) {
                  await query(`SELECT * FROM users WHERE TicketID = "${secondArg}"`, async (error, rows, fields) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }

                    rows.forEach(async (item) => {
                      if (item.UserID != creator.id) {
                        let user = await client.users.fetch(item.UserID);

                        let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#bb018a")
                        .setTitle(`${user.username} a ticket you've been assigned to has been deleted by the Head of Department.`)
                        .addField(`─ Ticket #${secondArg} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
                        try {
                          await user.send(responseEmbed);
                        }
                        catch (error) {
                          if (error.message == "Cannot send messages to this user") {
                            let responseEmbed = new Discord.MessageEmbed()
                            .setColor('#FF0000')
                            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I couldn't notify ${user.username}`)
                            .setFooter("*I'll delete this message in 10 seconds")
                            await targetChannel.send(responseEmbed).then(async (sent) => {
                              await sent.delete({timeout:10000});
                            });
                          }
                        }
                      }
                    });
                  });

                  await query(`DELETE FROM tickets WHERE TicketID = "${secondArg}"`, async (error) => {
                    if (error) {
                     console.log(error)
                     let responseEmbed = new Discord.MessageEmbed()
                     .setColor("#FF0000")
                     .setTitle("── Fault ──")
                     .setDescription(`${error}`)
                     await targetChannel.send(responseEmbed);
                     return;
                    }
                  });
                  await query(`DELETE FROM users WHERE TicketID = "${secondArg}"`, async (error) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }
                  });

                  await guild.members.fetch().then(async (members) => {
                    await members.forEach(async (member) => {
                      if (member.id == creator.id) {
                        const memberData = await client.users.fetch(member.id);
                        let notifyEmbed = new Discord.MessageEmbed()
                        .setColor("#bb018a")
                        .setTitle(`${memberData.username}, your ticket has been deleted by the Head of Department.`)
                        .addField(`─ Ticket #${secondArg} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
                        await member.send(notifyEmbed);
                      }
                    });
                  });
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#00FF00")
                  .setTitle(`${message.author.username}, I've deleted the Ticket.`)
                  .addField(`─ Ticket #${secondArg} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false)
                  .setFooter("*I'll delete this message in 15 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:15000});
                  });
                }

                //If user deletes
                else{
                  await query(`SELECT * FROM users WHERE TicketID = "${secondArg}"`, async (error, rows, fields) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }

                    rows.forEach(async (item) => {
                      if (item.UserID != creator.id) {
                        let user = await client.users.fetch(item.UserID);

                        let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#bb018a")
                        .setTitle(`${user.username} a ticket you've been assigned to has been deleted by the Ticket creator.`)
                        .addField(`─ Ticket #${secondArg} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
                        try {
                          await user.send(responseEmbed);
                        }
                        catch (error) {
                          if (error.message == "Cannot send messages to this user") {
                            let responseEmbed = new Discord.MessageEmbed()
                            .setColor('#FF0000')
                            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I couldn't notify ${user.username}`)
                            .setFooter("*I'll delete this message in 10 seconds")
                            await targetChannel.send(responseEmbed).then(async (sent) => {
                              await sent.delete({timeout:10000});
                            });
                          }
                        }
                      }
                    });
                  });

                  await query(`DELETE FROM tickets WHERE TicketID = "${secondArg}"`, async (error) => {
                    if (error) {
                     console.log(error)
                     let responseEmbed = new Discord.MessageEmbed()
                     .setColor("#FF0000")
                     .setTitle("── Fault ──")
                     .setDescription(`${error}`)
                     await targetChannel.send(responseEmbed);
                     return;
                    }
                  });
                  await query(`DELETE FROM users WHERE TicketID = "${secondArg}"`, async (error) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }
                  });

                  await guild.members.fetch().then(async (members) => {
                    await members.forEach(async (member) => {
                      if (member._roles.includes(DepartmentID) && member._roles.includes(HoDRoleID)) {
                        const memberData = await client.users.fetch(member.id);
                        let notifyEmbed = new Discord.MessageEmbed()
                        .setColor("#bb018a")
                        .setTitle(`${memberData.username}, a ticket for your department has been deleted by the Ticket creator.`)
                        .addField(`─ Ticket #${secondArg} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
                        await member.send(notifyEmbed);
                      }
                    });
                  });
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#00FF00")
                  .setTitle(`${message.author.username}, I've deleted the Ticket.`)
                  .addField(`─ Ticket #${secondArg} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false)
                  .setFooter("*I'll delete this message in 15 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:15000});
                  });
                }
              }
            }
          });
        }
        break;

      //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
      case "edit":
        try {
          let dmEmbedFirst = new Discord.MessageEmbed()
          .setColor('#bb018a')
          .setTitle('Ticket Edit Step 1/2')
          .setDescription(`**Please type the TicketID of the ticket you want me to edit.\nYour tickets:**`)
          .setFooter("I'll cancel this operation in 1 minute if I don't hear from you.")

          await query(`SELECT * FROM tickets WHERE UserID = "${authorData.id}"`, async (error, rows, field) => {
            if (error) {
             console.log(error)
             let responseEmbed = new Discord.MessageEmbed()
             .setColor("#FF0000")
             .setTitle("── Fault Detected ──")
             .setDescription(`${error}`)
             await author.send(responseEmbed);
             return;
            }

            let noTicketEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.\nYou don't have any tickets.`)

            if (rows.length <= 0) {
              noTicketEmbed.setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(noTicketEmbed).then(async (sent) => {
                await sent.delete({timeout:10000});
              });
              return;
            }
            let counter = 0;

            const firstLoop = rows.length;
            await rows.forEach(async (item) => {
              const targetID = item.TicketID;
              const desc = item.Description;
              const creator = await client.users.fetch(item.UserID)
              const department = await guild.roles.cache.get(item.DepartmentID);
              const date = dayjs((item.CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

              await query(`SELECT * FROM tickets WHERE DepartmentID = "${item.DepartmentID}" ORDER BY CreatedAt ASC`, async (error, rows, field) => {
                if (error) {
                 console.log(error)
                 let responseEmbed = new Discord.MessageEmbed()
                 .setColor("#FF0000")
                 .setTitle("── Fault ──")
                 .setDescription(`${error}`)
                 await message.author.send(responseEmbed);
                 return;
                }

                counter++;
                const filter = (a) => a.TicketID == targetID
                const position = await rows.findIndex(filter)+1;

                if (position <= 5) {
                  dmEmbedFirst.addField(`─ Ticket #${targetID} ─`, `**| Description:** ${desc}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\n**| Status:** Active | Positon: ${position}`, false);
                }

                else {
                  dmEmbedFirst.addField(`─ Ticket #${targetID} ─`, `**| Description:** ${desc}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\n**| Status:** In Queue | Positon: ${position}`, false);
                }

                if (counter == firstLoop) {
                  await author.send(dmEmbedFirst).then(() => {message.author.dmChannel.awaitMessages((response) => message.content, {
                  max: 1,time: 60000, errors: ['time']
                  }).then(async (collected) => {
                    try {
                      let msg = collected.first().content.trim().toLowerCase();
                      let matches = msg.match(/\d+/g);

                      if (matches[0] != undefined) {
                        const selectedID = matches[0];
                        await query(`SELECT * FROM tickets WHERE TicketID = "${selectedID}" ORDER BY CreatedAt ASC`, async (error, rows, field) => {
                          if (rows.length == 0) {
                            let responseEmbed = new Discord.MessageEmbed()
                            .setColor("#FF0000")
                            .setTitle(`I'm sorry, ${message.author.username}. I couldn't find Ticket #${selectedID}.`)
                            .setDescription("I've cancelled the Ticket Edit.\nIf you'd like me to start one again, you can do so by typing '!ticket edit' in the server.")
                            await message.author.send(responseEmbed);
                            return
                          }

                          if (rows[0].UserID != creator.id) {
                            let responseEmbed = new Discord.MessageEmbed()
                            .setColor("#FF0000")
                            .setTitle(`I'm sorry, ${message.author.username}. You can't edit Tickets you didn't make.`)
                            .setDescription("I've cancelled the Ticket Edit.\nIf you'd like me to start one again, you can do so by typing '!ticket edit' in the server.")
                            await message.author.send(responseEmbed);
                            return
                          }
                          else{
                            let firstStepComplete = new Discord.MessageEmbed()
                            .setColor("#00FF00")
                            .setTitle(`${message.author.username}, I've found your Ticket.`)
                            .setDescription(`**| Description:** ${desc}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}**\n\n\n**Please type down the description you'd like to change it to.`)
                            .setFooter("I'll cancel this operation in 5 minutes if I don't hear from you.")
                            await author.send(firstStepComplete).then(() => {message.author.dmChannel.awaitMessages((response) => message.content, {
                            max: 1,time: 300000, errors: ['time']
                            }).then(async (collected) => {
                              try {
                                let msg;
                                if (collected.first().content.includes('"')) {
                                  msg = collected.first().content.replaceAll('"',"'").trim();
                                }
                                else {
                                  msg = collected.first().content.trim();
                                }
                                let check = Array.from(msg)

                                if (check.length <= 1000) {
                                  const description = cleanString(msg);

                                  let targetDepartmentID = department;

                                  let isError = false;
                                  await query(`UPDATE tickets SET Description = "${msg}" WHERE TicketID = ${selectedID}`, async (error) => {
                                    if (error) {
                                      isError = true;
                                      console.log(error)
                                      let responseEmbed = new Discord.MessageEmbed()
                                      .setColor("#FF0000")
                                      .setTitle("── Fault ──")
                                      .setDescription(`${error}`)
                                      await message.author.send(responseEmbed);
                                      return;
                                    }
                                  });

                                  if (!isError) {
                                    let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#00FF00")
                                    .setTitle(`${message.author.username}, I've updated your Ticket.`)
                                    .setDescription("I can give you a list of your tickets if you type, '!ticket list' in the server.")
                                    await message.author.send(responseEmbed);

                                    await guild.members.fetch().then(async (members) => {
                                	     await members.forEach(async (member) => {
                                        if (member._roles.includes(department.id) && member._roles.includes(HoDRoleID)) {
                                          const memberData = await client.users.fetch(member.id);
                                          let notifyEmbed = new Discord.MessageEmbed()
                                          .setColor("#bb018a")
                                          .setTitle(`${memberData.username}, one of your existing Tickets, Ticket#${selectedID} was updated.`)
                                          .setDescription(`**| Description:** ${msg}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`);
                                          await member.send(notifyEmbed);
                                        }
                                      });
                                    });
                                  }
                                }
                                else {
                                  let responseEmbed = new Discord.MessageEmbed()
                                  .setColor("#FF0000")
                                  .setTitle(`I'm sorry, ${message.author.username}. I'm afraid your ticket description is too long.`)
                                  .setDescription("I've cancelled the Ticket Edit.\nIf you'd like me to start one again, you can do so by typing '!ticket edit' in the server")
                                  await message.author.send(responseEmbed);
                                }
                              }
                              catch(error) {
                                 console.log(error)
                                 let responseEmbed = new Discord.MessageEmbed()
                                 .setColor("#FF0000")
                                 .setTitle(`── Ticket Edit Fatal Fault ──`)
                                 .setDescription(`Error: ${error}`)
                                 await message.author.send(responseEmbed);
                              }
                            }).catch(async (collected) => {
                              if (!Object.keys(collected).length && !error) {
                                let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle(`${message.author.username}, I've cancelled the ticket creation.`)
                                .setDescription("If you'd like me to start one again, you can do so by typing '!ticket edit' in the server")
                                await message.author.send(responseEmbed);
                                }
                              });
                            });
                          }
                        });
                      }
                      else {
                        let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#FF0000")
                        .setTitle(`I'm sorry, ${message.author.username}. "${selectedID}" is not a valid TicketID.`)
                        .setDescription("I've cancelled the Ticket Edit.\nIf you'd like me to start one again, you can do so by typing '!ticket edit' in the server")
                        await message.author.send(responseEmbed);
                      }
                    }
                    catch(error) {
                       console.log(error)
                       let responseEmbed = new Discord.MessageEmbed()
                       .setColor("#FF0000")
                       .setTitle(`── Ticket Edit Fatal Fault ──`)
                       .setDescription(`Error: ${error}`)
                       await message.author.send(responseEmbed);
                    }
                     }).catch(async (collected) => {
                       if (!Object.keys(collected).length && !error) {
                         let responseEmbed = new Discord.MessageEmbed()
                         .setColor("#FF0000")
                         .setTitle(`${message.author.username}, I've cancelled the ticket creation.`)
                         .setDescription("If you'd like me to start one again, you can do so by typing '!ticket edit' in the server")
                         await message.author.send(responseEmbed);
                         }
                       });
                    });
                  }
                });
              })
            });
        }
        catch(e) {
          const warningEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`I'm sorry, ${message.author.username}. I couldn't send you a private message.`)
          .setDescription("Please make sure you have DMs enabled.")
          .setFooter("*I'll delete this message in 15 seconds")
          await targetChannel.send(warningEmbed).then(async (sent) => {
            await sent.delete({timeout:15000});
          });
          return;
        }

        const responseEmbed = new Discord.MessageEmbed()
        .setColor('#00FF00')
        .setTitle(`${message.author.username}, I've sent you a private message with instructions to editing a ticket.`)
        .setDescription("")
        .setFooter("*I'll delete this message in 10 seconds")
        await targetChannel.send(responseEmbed).then(async (sent) => {
          await sent.delete({timeout:10000});
        });
        break;

      //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
      case "list":
      //If Leadership
      if (author._roles.includes("870350960369750096")) {
        let secondArg = "";

        if (msg.includes("department")) {
          secondArg = "department";
        }
        else if (msg.includes("personal")) {
          secondArg = "personal";
        }

        const departmentArg = await msg.replace("ticket", "").replace(arg[0], "").replace("department", "").trim().toLowerCase();

        if (secondArg == "") {
          let warningEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
          .setDescription(`Please provide if you want to see your own tickets or a department's tickets.\n\nFor tickets you created, please type: **!ticket list personal**\nFor a department's tickets, please type: **!ticket list department departmentname**`)
          .setFooter("*I'll delete this message in 15 seconds")
          await targetChannel.send(warningEmbed).then(async (sent) => {
            await sent.delete({timeout:15000});
          });
          return;
        }

        if (departmentArg == "") {
          let warningEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
          .setDescription(`Please provide the name of the department who's active tickets you want to see.\nExample, !ticket list department departmentname`)
          .setFooter("*I'll delete this message in 10 seconds")
          await targetChannel.send(warningEmbed).then(async (sent) => {
            await sent.delete({timeout:10000});
          });
          return;
        }

        const targetDepartment = await guild.roles.cache.find(r => r.name == `¤ ${departmentArg}`);

        if (secondArg == "department") {
          if (!targetDepartment) {
            let warningEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't find department "${departmentArg}".`)
            .setFooter("*I'll delete this message in 10 seconds")
            await targetChannel.send(warningEmbed).then(async (sent) => {
              await sent.delete({timeout:10000});
            });
            return;
          }

          await query(`SELECT * FROM tickets WHERE DepartmentID = "${targetDepartment.id}" ORDER BY CreatedAt ASC LIMIT 5`, async (error, rows, field) => {
            if (error) {
             console.log(error)
             let responseEmbed = new Discord.MessageEmbed()
             .setColor("#FF0000")
             .setTitle("── Fault ──")
             .setDescription(`${error}`)
             await targetChannel.send(responseEmbed);
             return;
            }

            let responseEmbed = new Discord.MessageEmbed()
            .setColor('#bb018a')
            .setTitle(`${message.author.username}. Here's the active Tickets of ${targetDepartment.name}`)
            .setFooter("*I'll delete this message in 1 minute")

            if (rows.length <= 0) {
              responseEmbed.setDescription(`I'm sorry, ${message.author.username}. ${targetDepartment.name} has no active tickets.`)
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({timeout:60000});
              });
              return;
            }

            await rows.forEach(async (item, i) => {
              const creator = await client.users.fetch(item.UserID)
              const department = await guild.roles.cache.get(item.DepartmentID);
              const date = dayjs((item.CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

              await responseEmbed.addField(`─ Ticket #${item.TicketID} ─`, `**| Description:** ${item.Description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
              if (i+1 == rows.length) {
                await targetChannel.send(responseEmbed).then(async (sent) => {
                  await sent.delete({timeout:60000});
                });
              }
            });
          });
        }

        else if (secondArg == "personal") {
          await query(`SELECT * FROM tickets WHERE UserID = "${authorData.id}"`, async (error, rows, field) => {
            if (error) {
             console.log(error)
             let responseEmbed = new Discord.MessageEmbed()
             .setColor("#FF0000")
             .setTitle("── Fault ──")
             .setDescription(`${error}`)
             await targetChannel.send(responseEmbed);
             return;
            }

            let responseEmbed = new Discord.MessageEmbed()
            .setColor('#bb018a')
            .setTitle(`${message.author.username}, here's a list of your Tickets.`)

            if (rows.length <= 0) {
              responseEmbed.setDescription(`I'm sorry, ${message.author.username}. I'm afraid you don't have any Tickets.`)
              responseEmbed.setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({timeout:10000});
              });
              return;
            }
            let counter = 0;

            const firstLoop = rows.length;
            await rows.forEach(async (item) => {
              const targetID = item.TicketID;
              const desc = item.Description;
              const creator = await client.users.fetch(item.UserID)
              const department = await guild.roles.cache.get(item.DepartmentID);
              const date = dayjs((item.CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

              await query(`SELECT * FROM tickets WHERE DepartmentID = "${item.DepartmentID}" ORDER BY CreatedAt ASC`, async (error, rows, field) => {
                if (error) {
                 console.log(error)
                 let responseEmbed = new Discord.MessageEmbed()
                 .setColor("#FF0000")
                 .setTitle("── Fault ──")
                 .setDescription(`${error}`)
                 await targetChannel.send(responseEmbed);
                 return;
                }

                counter++;
                const filter = (a) => a.TicketID == targetID
                const position = await rows.findIndex(filter)+1;

                if (position <= 5) {
                  responseEmbed.addField(`─ Ticket #${targetID} ─`, `**| Description:** ${desc}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\n**| Status:** Active | Positon: ${position}`, false);
                }

                else {
                  responseEmbed.addField(`─ Ticket #${targetID} ─`, `**| Description:** ${desc}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\n**| Status:** In Queue | Positon: ${position}`, false);
                }

                if (counter == firstLoop) {
                  responseEmbed.setFooter("*I'll delete this message in 1 minute")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:60000});
                  });
                  return;
                }
              });
            });
          });
        }

      }

      else if (IsLeader) {
        const secondArg = msg.replace("ticket", "").replace(arg[0], "").trim().toLowerCase();

        if (secondArg == "department") {
          //If leader doesn't have department
          if (!departmentIDs.some(r=> author._roles.indexOf(r) >= 0)) {
            let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
            .setDescription(`You do not have a department.\nIf you'd like me to create one for you, please type, **!createdepartment**\nAt the moment I can only create a list of Tickets you created if you type, **!ticket list personal**`)
            .setFooter("*I'll delete this message in 20 seconds")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({timeout:20000});
            });
            return;
          }

          let targetDepartment;
          await author.roles.cache.forEach(async (item) => {
            if (item.name.includes("¤")){
              targetDepartment = await guild.roles.cache.get(item.id);
            }
          });

          await query(`SELECT * FROM tickets WHERE DepartmentID = "${targetDepartment.id}" ORDER BY CreatedAt ASC LIMIT 5`, async (error, rows, field) => {
            if (error) {
             console.log(error)
             let responseEmbed = new Discord.MessageEmbed()
             .setColor("#FF0000")
             .setTitle("── Fault ──")
             .setDescription(`${error}`)
             await targetChannel.send(responseEmbed);
             return;
            }

            let responseEmbed = new Discord.MessageEmbed()
            .setColor('#bb018a')
            .setTitle(`${message.author.username}, here's the currently active Tickets of ${targetDepartment.name}.`)
            .setFooter("*I'll delete this message in 1 minute")

            if (rows.length <= 0) {
              responseEmbed.setTitle(`I'm sorry, ${message.author.username}. ${targetDepartment.name} has no active Tickets.`)
              responseEmbed.setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({timeout:10000});
              });
              return;
            }

            await rows.forEach(async (item, i) => {
              const creator = await client.users.fetch(item.UserID)
              const department = await guild.roles.cache.get(item.DepartmentID);
              const date = dayjs((item.CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

              await responseEmbed.addField(`─ Ticket #${item.TicketID} ─`, `**| Description:** ${item.Description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
              if (i+1 == rows.length) {
                await targetChannel.send(responseEmbed).then(async (sent) => {
                  await sent.delete({timeout:60000});
                });
              }
            });
          });
        }
        else if (secondArg == "personal") {
          await query(`SELECT * FROM tickets WHERE UserID = "${authorData.id}"`, async (error, rows, field) => {
            if (error) {
             console.log(error)
             let responseEmbed = new Discord.MessageEmbed()
             .setColor("#FF0000")
             .setTitle("── Fault ──")
             .setDescription(`${error}`)
             await targetChannel.send(responseEmbed);
             return;
            }

            let responseEmbed = new Discord.MessageEmbed()
            .setColor('#bb018a')
            .setTitle(`${message.author.username}, here's a list of your Tickets.`)

            if (rows.length <= 0) {
              responseEmbed.setTitle(`I'm sorry, ${message.author.username}. I'm afraid you don't have any Tickets.`)
              responseEmbed.setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(warningEmbed).then(async (sent) => {
                await sent.delete({timeout:10000});
              });
              return;
            }
            let counter = 0;

            const firstLoop = rows.length;
            await rows.forEach(async (item) => {
              const targetID = item.TicketID;
              const desc = item.Description;
              const creator = await client.users.fetch(item.UserID)
              const department = await guild.roles.cache.get(item.DepartmentID);
              const date = dayjs((item.CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

              await query(`SELECT * FROM tickets WHERE DepartmentID = "${item.DepartmentID}" ORDER BY CreatedAt ASC`, async (error, rows, field) => {
                if (error) {
                 console.log(error)
                 let responseEmbed = new Discord.MessageEmbed()
                 .setColor("#FF0000")
                 .setTitle("── Fault ──")
                 .setDescription(`${error}`)
                 await targetChannel.send(responseEmbed);
                 return;
                }

                counter++;
                const filter = (a) => a.TicketID == targetID
                const position = await rows.findIndex(filter)+1;

                if (position <= 5) {
                  responseEmbed.addField(`─ Ticket #${targetID} ─`, `**| Description:** ${desc}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\n**| Status:** Active | Positon: ${position}`, false);
                }

                else {
                  responseEmbed.addField(`─ Ticket #${targetID} ─`, `**| Description:** ${desc}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\n**| Status:** In Queue | Positon: ${position}`, false);
                }

                if (counter == firstLoop) {
                  responseEmbed.setFooter("*I'll delete this message in 1 minute")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:60000});
                  });
                  return;
                }
              });
            });
          });
        }
        else {
          let responseEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
          .setDescription("Please provide if you want to see your department's tickets or the tickets you created.\n\nFor department's tickets, please type: **!ticket list department**\nFor tickets you created, please type: **!ticket list personal**")
          .setFooter("*I'll delete this message in 20 seconds")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({timeout:20000});
          });
          return;
        }
      }

      else {
        await query(`SELECT * FROM tickets WHERE UserID = "${authorData.id}"`, async (error, rows, field) => {
          if (error) {
           console.log(error)
           let responseEmbed = new Discord.MessageEmbed()
           .setColor("#FF0000")
           .setTitle("── Fault ──")
           .setDescription(`${error}`)
           await targetChannel.send(responseEmbed);
           return;
          }

          let responseEmbed = new Discord.MessageEmbed()
          .setColor('#bb018a')
          .setTitle(`${message.author.username}, here's a list of your Tickets.`)

          if (rows.length <= 0) {
            responseEmbed.setTitle(`I'm sorry, ${message.author.username}. I'm afraid you don't have any Tickets.`)
            responseEmbed.setFooter("*I'll delete this message in 10 seconds")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({timeout:10000});
            });
            return;
          }
          let counter = 0;

          const firstLoop = rows.length;
          await rows.forEach(async (item) => {
            const targetID = item.TicketID;
            const desc = item.Description;
            const creator = await client.users.fetch(item.UserID)
            const department = await guild.roles.cache.get(item.DepartmentID);
            const date = dayjs((item.CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

            await query(`SELECT * FROM tickets WHERE DepartmentID = "${item.DepartmentID}" ORDER BY CreatedAt ASC`, async (error, rows, field) => {
              if (error) {
               console.log(error)
               let responseEmbed = new Discord.MessageEmbed()
               .setColor("#FF0000")
               .setTitle("── Fault ──")
               .setDescription(`${error}`)
               await targetChannel.send(responseEmbed);
               return;
              }

              counter++;
              const filter = (a) => a.TicketID == targetID
              const position = await rows.findIndex(filter)+1;

              if (position <= 5) {
                responseEmbed.addField(`─ Ticket #${targetID} ─`, `**| Description:** ${desc}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\n**| Status:** Active | Positon: ${position}`, false);
              }

              else {
                responseEmbed.addField(`─ Ticket #${targetID} ─`, `**| Description:** ${desc}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\n**| Status:** In Queue | Positon: ${position}`, false);
              }

              if (counter == firstLoop) {
                responseEmbed.setFooter("*I'll delete this message in 1 minute")
                await targetChannel.send(responseEmbed).then(async (sent) => {
                  await sent.delete({timeout:10000});
                });
                return;
              }
            });
          });
        });
      }
      break;

      //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
      case "complete":
        let secondArgCompl = msg.replace("ticket", "").replace(arg[0], "").trim().toLowerCase();
        secondArgCompl.match(/\d+/g);

        if (!secondArgCompl) {
          let warningEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
          .setDescription(`**Please provide a TicketID so I can search for your ticket.**\n\I can get you a list of your tickets and TicketIDs if you type, '!ticket list'\nTicketID looks like: **Ticket #1** where **1 is the ID**\n\nExample: !ticket delete 1`)
          .setFooter("*I'll delete this message in 15 seconds")
          await targetChannel.send(warningEmbed).then(async (sent) => {
            await sent.delete({timeout:15000});
            return;
          });
        }
        else {
          await query(`SELECT * FROM tickets WHERE TicketID = "${secondArgCompl}"`, async (error, rows, field) => {
            if (error) {
              console.log(error)
              let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle("── Fault ──")
              .setDescription(`${error}`)
              await targetChannel.send(responseEmbed);
              return;
            }

            if (rows.length == 0) {
              let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription(`**I can't find Ticket #${secondArg}**\n\nI can get you a list of your tickets and TicketIDs if you type, '!ticket list'`)
              .setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({timeout:10000});
                return;
              });
            }
            else {
              const creator = await client.users.fetch(rows[0].UserID)
              const DepartmentID = rows[0].DepartmentID;
              const department = await guild.roles.cache.get(rows[0].DepartmentID);
              const description = rows[0].Description
              const date = dayjs((rows[0].CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

              if (((authorData.id != creator.id) && !IsLeader) || (IsLeader && !author._roles.includes(department.id))) {
                let responseEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                .setFooter("*This message will self destruct in 10 seconds")

                if (!IsLeader) {
                  responseEmbed.setDescription(`I can only mark tickets as complete that you created.`)
                }
                else {
                  responseEmbed.setDescription(`I can only mark tickets as complete that you created or tickets that are for your department.`)
                }

                await targetChannel.send(responseEmbed).then(async (sent) => {
                  await sent.delete({timeout:10000});
                  return;
                });
              }
              else {
                //If department leader completes
                if (IsLeader && author._roles.includes(DepartmentID)) {
                  await query(`SELECT * FROM users WHERE TicketID = "${secondArgCompl}"`, async (error, rows, fields) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }

                    rows.forEach(async (item) => {
                      if (item.UserID != creator.id) {
                        let user = await client.users.fetch(item.UserID);

                        let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#bb018a")
                        .setTitle(`${user.username} a ticket you've been assigned to has been marked as complete by the Head of Department.`)
                        .addField(`─ Ticket #${secondArgCompl} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
                        try {
                          await user.send(responseEmbed);
                        }
                        catch (error) {
                          if (error.message == "Cannot send messages to this user") {
                            let responseEmbed = new Discord.MessageEmbed()
                            .setColor('#FF0000')
                            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I couldn't notify ${user.username}`)
                            .setFooter("*I'll delete this message in 10 seconds")
                            await targetChannel.send(responseEmbed).then(async (sent) => {
                              await sent.delete({timeout:10000});
                            });
                          }
                        }
                      }
                    });
                  });

                  await query(`DELETE FROM tickets WHERE TicketID = "${secondArgCompl}"`, async (error) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }
                  });
                  await query(`DELETE FROM users WHERE TicketID = "${secondArgCompl}"`, async (error) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }
                  });

                  await guild.members.fetch().then(async (members) => {
                    await members.forEach(async (member) => {
                      if (member.id == creator.id) {
                        const memberData = await client.users.fetch(member.id);
                        let notifyEmbed = new Discord.MessageEmbed()
                        .setColor("#bb018a")
                        .setTitle(`${memberData.username}, your ticket has been marked as complete by the Head of Department.`)
                        .addField(`─ Ticket #${secondArgCompl} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
                        await member.send(notifyEmbed);
                      }
                    });
                  });
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#00FF00")
                  .setTitle(`${message.author.username}, I've marked the Ticket as complete.`)
                  .addField(`─ Ticket #${secondArgCompl} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false)
                  .setFooter("*I'll delete this message in 15 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:15000});
                  });
                }

                //If user completes
                else{
                  await query(`SELECT * FROM users WHERE TicketID = "${secondArgCompl}"`, async (error, rows, fields) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }

                    rows.forEach(async (item) => {
                      if (item.UserID != creator.id) {
                        let user = await client.users.fetch(item.UserID);

                        let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#bb018a")
                        .setTitle(`${user.username} a ticket you've been assigned to has been marked as complete by the Ticket creator.`)
                        .addField(`─ Ticket #${secondArgCompl} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
                        try {
                          await user.send(responseEmbed);
                        }
                        catch (error) {
                          if (error.message == "Cannot send messages to this user") {
                            let responseEmbed = new Discord.MessageEmbed()
                            .setColor('#FF0000')
                            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I couldn't notify ${user.username}`)
                            .setFooter("*I'll delete this message in 10 seconds")
                            await targetChannel.send(responseEmbed).then(async (sent) => {
                              await sent.delete({timeout:10000});
                            });
                          }
                        }
                      }
                    });
                  });

                  await query(`DELETE FROM tickets WHERE TicketID = "${secondArgCompl}"`, async (error) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }
                  });
                  await query(`DELETE FROM users WHERE TicketID = "${secondArgCompl}"`, async (error) => {
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle("── Fault ──")
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }
                  });

                  await guild.members.fetch().then(async (members) => {
                    await members.forEach(async (member) => {
                      if (member._roles.includes(DepartmentID) && member._roles.includes(HoDRoleID)) {
                        const memberData = await client.users.fetch(member.id);
                        let notifyEmbed = new Discord.MessageEmbed()
                        .setColor("#bb018a")
                        .setTitle(`${memberData.username}, a ticket for your department has been marked as complete by the Ticket creator.`)
                        .addField(`─ Ticket #${secondArgCompl} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false);
                        await member.send(notifyEmbed);
                      }
                    });
                  });
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#00FF00")
                  .setTitle(`${message.author.username}, I've marked the Ticket as complete.`)
                  .addField(`─ Ticket #${secondArgCompl} ─`, `**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`, false)
                  .setFooter("*I'll delete this message in 15 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:15000});
                  });
                }
              }
            }
          });
        }
        break;

      //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
      case "assigned":
        await query(`SELECT * FROM users WHERE UserID = ${author.id}`, async (error, rows, fields) => {
          if (error) {
            console.log(error)
            let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`── Fault when checking ${user.username} ──`)
            .setDescription(`${error}`)
            await targetChannel.send(responseEmbed);
            return;
          }
          else if (rows.length == 0) {
            let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`${message.author.username}, I'm afraid you're not assigned to any Tickets yet.`)
            .setFooter("*I'll delete this message in 10 seconds")
            await targetChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({timeout:10000});
            });
            return;
          }
          else {
            let mainResponseEmbed = new Discord.MessageEmbed()
            .setColor("#00FF00")
            .setTitle(`${message.author.username}, here's a list of the Tickets you're assigned to.`)
            .setFooter("*I'll delete this message in 20 seconds")

            let tickets = [];
            let counter = 0;

            await rows.forEach(async (item) => {
              if (!tickets.includes(item.TicketID)) {
                await query(`SELECT * FROM tickets WHERE TicketID = "${item.TicketID}"`, async (error, rows2, field) => {
                  counter++;
                  if (error) {
                    console.log(error)
                    let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle("── Fault ──")
                    .setDescription(`${error}`)
                    await targetChannel.send(responseEmbed);
                    return;
                  }

                  const creator = await client.users.fetch(rows2[0].UserID)
                  const DepartmentID = rows2[0].DepartmentID;
                  const department = await guild.roles.cache.get(rows2[0].DepartmentID);
                  const description = rows2[0].Description
                  const date = dayjs((rows2[0].CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

                  await tickets.push(`**─ Ticket #${item.TicketID} ─**\n**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\n`)

                  if (counter == rows.length) {
                    let desc = tickets.join("\n");
                    mainResponseEmbed.setDescription(`${desc}`);
                    await targetChannel.send(mainResponseEmbed).then(async (sent) => {
                      await sent.delete({timeout:20000});
                    });
                  }
                });
              }
            });
          }
        });
        break;
      //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
      case "assign":
        if (IsLeader) {
          let secondArgAssign = await msg.replace("ticket", "").replace(arg[0], "").trim().toLowerCase();
          let secondArgAssignArr = await Array.from(secondArgAssign.match(/\d+/g));
          let secondArgAssignNum;

          await message.mentions.members.map(item => {
            secondArgAssignArr.splice(secondArgAssignArr.indexOf(item.id), 1);
          });
          secondArgAssignNum = await parseInt(secondArgAssignArr.toString());

          if (!secondArgAssignNum){
            let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
            .setDescription(`Please provide the ID of the Ticket you want me to assign to.`)
            .setFooter("Example, !ticket assign TicketID @Example_User#0000")
            await targetChannel.send(responseEmbed);
            return;
          }

          if (user == undefined){
            const noMentionEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
            .setDescription('Please provide who you want me to assign to the ticket in the form of a mention.')
            .setFooter(`Example, !ticket assign TicketID @Example_User#0000`)
            await targetChannel.send(noMentionEmbed);
            return;
          }

          let userDepartmentID;
          let departmentMatch;
          let stop;

          await query(`SELECT * FROM tickets WHERE TicketID = "${secondArgAssignNum}"`, async (error, rows, field) => {
            if (error) {
              console.log(error)
              let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle("── Fault ──")
              .setDescription(`${error}`)
              await targetChannel.send(responseEmbed);
              return;
            }

            const creator = await client.users.fetch(rows[0].UserID)
            const DepartmentID = rows[0].DepartmentID;
            const department = await guild.roles.cache.get(rows[0].DepartmentID);
            const description = rows[0].Description
            const date = dayjs((rows[0].CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

            if (rows.length == 0) {
              let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription(`**I can't find Ticket #${secondArgAssignNum}**\n\nI can get you a list of your tickets and TicketIDs if you type, '!ticket list'`)
              .setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({timeout:10000});
                return;
              });
            }
            else {
              const check = message.mentions.members.map(async (item) => {
                let userObj = await message.guild.member(item.id);
                let userData = await client.users.fetch(item.id);
                userDepartmentID = await departmentIDs.some(r=> userObj._roles.indexOf(r) >= 0);

                if (!userDepartmentID) {
                  stop = true;
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor('#FF0000')
                  .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                  .setDescription(`${userData.username} is not in any department.`)
                  .setFooter("*I'll delete this message in 10 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:10000});
                  });
                  return stop = true;
                }
                departmentMatch = await userObj._roles.some(r=> author._roles.indexOf(r) >= 0);

                if (!departmentMatch) {
                  stop = true;
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor('#FF0000')
                  .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                  .setDescription(`${userData.username} is not in your department.`)
                  .setFooter("*I'll delete this message in 10 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:10000});
                  });
                  return stop = true;
                }
                return await stop;
              });

              let mainResponseEmbed = new Discord.MessageEmbed()
              .setColor('#00FF00')
              .setTitle(`${message.author.username}, I've assigned the following users to Ticket #${secondArgAssignNum}`)
              .setFooter("*I'll delete this message in 20 seconds")

              let alreadyAssignedEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription(`The following user(s) are already assigned to this ticket:`)
              .setFooter("*I'll delete this message in 20 seconds")

              let isContinue = true;
              let fault = false;

              let counter = 0;
              let counterCheck = 0;
              const promise = await Promise.all(check);

              await promise.forEach(item => {
                if (item == true) {
                  isContinue = false;
                }
              });

              if (isContinue) {
                await message.mentions.members.map(async (item, index) => {
                  await query(`SELECT * FROM users WHERE TicketID = ${secondArgAssignNum} AND UserID = ${item.id}`, async (error, rows, fields) => {
                    counterCheck++;
                    let user = await client.users.fetch(item.id);
                    if (error) {
                      console.log(error)
                      let responseEmbed = new Discord.MessageEmbed()
                      .setColor("#FF0000")
                      .setTitle(`── Fault when checking ${user.username} ──`)
                      .setDescription(`${error}`)
                      await targetChannel.send(responseEmbed);
                      return;
                    }
                    if (rows.length != 0) {
                      fault = await true;
                      await rows.forEach(async (row) => {
                        let user = await client.users.fetch(row.UserID);
                        await alreadyAssignedEmbed.addField(`**${user.username}**`,"\u200B",false);
                      });
                    }
                    if (message.mentions.members.size == counterCheck && fault) {
                      await targetChannel.send(alreadyAssignedEmbed).then(async (sent) => {
                        await sent.delete({timeout:20000});
                      });
                    }
                    if (rows.length == 0 && (counterCheck == message.mentions.members.size) && !fault) {
                      await message.mentions.members.map(async (item, index) => {
                          let isError = false;
                          await query(`INSERT INTO users (UserID, TicketID) VALUES ("${item.id}", "${secondArgAssignNum}")`, async (error) => {
                            let user = await client.users.fetch(item.id);
                            counter++

                            if (error) {
                              isError = true;
                              console.log(error)
                              let responseEmbed = new Discord.MessageEmbed()
                              .setColor("#FF0000")
                              .setTitle(`── Fault when assigning ${user.username} ──`)
                              .setDescription(`${error}`)
                              await targetChannel.send(responseEmbed);
                            }
                            if (isError == false){
                              await mainResponseEmbed.addField(`${user.username}`,"\u200B", false);
                            }

                            if ((message.mentions.members.size == counter) && (isError == false)) {
                              await query(`SELECT * FROM users WHERE TicketID = ${secondArgAssignNum}`, async (error, rows, field) => {
                                if (error) {
                                  console.log(error)
                                  let responseEmbed = new Discord.MessageEmbed()
                                  .setColor("#FF0000")
                                  .setTitle(`── Fault ──`)
                                  .setDescription(`${error}`)
                                  await targetChannel.send(responseEmbed);
                                  return;
                                }
                                else if (rows.length == 1){
                                  await message.mentions.members.map(async (item, index) => {
                                    let user = await client.users.fetch(item.id);

                                    let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#bb018a")
                                    .setDescription(`**─ Ticket #${secondArgAssignNum} ─**\n**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\nOther user(s) assigned to this Ticket:`)

                                    if (item.id == author.id) {
                                      responseEmbed.setTitle(`${user.username}, you've assigned yourself to a Ticket!`)
                                    }
                                    else {
                                      responseEmbed.setTitle(`${user.username}, you've been assigned to a Ticket by your Head of Department!`)
                                    }
                                    if (rows[0].UserID == item.id) {
                                      await responseEmbed.addField(`None`, "\u200B", false);
                                    }
                                    try {
                                      await item.send(responseEmbed);
                                    }
                                    catch (error) {
                                      if (error.message == "Cannot send messages to this user") {
                                        let responseEmbed = new Discord.MessageEmbed()
                                        .setColor('#FF0000')
                                        .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I couldn't notify ${user.username}`)
                                        .setFooter("*I'll delete this message in 10 seconds")
                                        await targetChannel.send(responseEmbed).then(async (sent) => {
                                          await sent.delete({timeout:10000});
                                        });
                                      }
                                    }
                                  });
                                  return;
                                }
                                else {
                                  await message.mentions.members.map(async (item, index) => {
                                    let user2 = await client.users.fetch(item.id);

                                    let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#bb018a")
                                    .setDescription(`**─ Ticket #${secondArgAssignNum} ─**\n**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}\nOther user(s) assigned to this Ticket:`)

                                    await rows.forEach(async (row) => {
                                      if (row.UserID != item.id) {
                                        let user = await client.users.fetch(row.UserID);
                                        if (item.id == author.id) {
                                          responseEmbed.setTitle(`${user2.username}, you've assigned yourself to a Ticket!`)
                                        }
                                        else {
                                          responseEmbed.setTitle(`${user2.username}, you've been assigned to a Ticket by your Head of Department!`)
                                        }
                                        await responseEmbed.addField(`${user.username}`, "\u200B", false);
                                      }
                                    });
                                    try {
                                      await item.send(responseEmbed);
                                    }
                                    catch (error) {
                                      if (error.message == "Cannot send messages to this user") {
                                        let responseEmbed = new Discord.MessageEmbed()
                                        .setColor('#FF0000')
                                        .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I couldn't notify ${user2.username}`)
                                        .setFooter("*I'll delete this message in 10 seconds")
                                        await targetChannel.send(responseEmbed).then(async (sent) => {
                                          await sent.delete({timeout:10000});
                                        });
                                      }
                                    }
                                  });
                                  return;
                                }
                              });
                              await targetChannel.send(mainResponseEmbed).then(async (sent) => {
                                await sent.delete({timeout:20000});
                                return;
                              });
                              return;
                            }
                          });
                      });
                    }
                  });
                });
              }
            }
          });
        }
        else {
          let responseEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
          .setDescription(`You don't have the required permissions for this command.`)
          .setFooter("*I'll delete this message in 10 seconds.")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({timeout:10000});
          });
          return;
        }
        break;

      //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
      case "unassign":
        if (IsLeader) {
          let secondArgAssign = await msg.replace("ticket", "").replace(arg[0], "").trim().toLowerCase();
          let secondArgAssignArr = await Array.from(secondArgAssign.match(/\d+/g));
          let secondArgAssignNum;

          await message.mentions.members.map(item => {
            secondArgAssignArr.splice(secondArgAssignArr.indexOf(item.id), 1);
          });
          secondArgAssignNum = await parseInt(secondArgAssignArr.toString());

          if (!secondArgAssignNum){
            let responseEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
            .setDescription(`Please provide the ID of the Ticket you want me to unassign from.`)
            .setFooter("Example, !ticket unassign TicketID @Example_User#0000")
            await targetChannel.send(responseEmbed);
            return;
          }

          if (user == undefined){
            const noMentionEmbed = new Discord.MessageEmbed()
            .setColor('#FF0000')
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
            .setDescription('Please provide who you want me to unassign from the ticket in the form of a mention.')
            .setFooter(`Example, !ticket unassign TicketID @Example_User#0000`)
            await targetChannel.send(noMentionEmbed);
            return;
          }

          await query(`SELECT * FROM tickets WHERE TicketID = "${secondArgAssignNum}"`, async (error, rows, field) => {
            if (error) {
              console.log(error)
              let responseEmbed = new Discord.MessageEmbed()
              .setColor("#FF0000")
              .setTitle("── Fault ──")
              .setDescription(`${error}`)
              await targetChannel.send(responseEmbed);
              return;
            }
            if (rows.length == 0) {
              let responseEmbed = new Discord.MessageEmbed()
              .setColor('#FF0000')
              .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
              .setDescription(`**Ticket #${secondArgAssignNum} does not exists.**`)
              .setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({timeout:10000});
                return;
              });
            }
            else {
              const creator = await client.users.fetch(rows[0].UserID)
              const DepartmentID = rows[0].DepartmentID;
              const department = await guild.roles.cache.get(rows[0].DepartmentID);
              const description = rows[0].Description
              const date = dayjs((rows[0].CreatedAt)).format("YYYY.MM.DD ─ HH:mm:ss")

              await query(`SELECT * FROM users WHERE TicketID = "${secondArgAssignNum}"`, async (error, rows, field) => {
                if (error) {
                  console.log(error)
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#FF0000")
                  .setTitle("── Fault ──")
                  .setDescription(`${error}`)
                  await targetChannel.send(responseEmbed);
                  return;
                }

                if (rows.length == 0) {
                  let responseEmbed = new Discord.MessageEmbed()
                  .setColor('#FF0000')
                  .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                  .setDescription(`**Nobody is assigned to Ticket #${secondArgAssignNum}.**`)
                  .setFooter("*I'll delete this message in 10 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    await sent.delete({timeout:10000});
                    return;
                  });
                }
                else {
                  let mainResponseEmbed = new Discord.MessageEmbed()
                  .setColor('#00FF00')
                  .setTitle(`${message.author.username}, I've unassigned the following users from Ticket #${secondArgAssignNum}`)
                  .setFooter("*I'll delete this message in 20 seconds")

                  let alreadyUnAssignedEmbed = new Discord.MessageEmbed()
                  .setColor('#FF0000')
                  .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                  .setDescription(`The following user(s) are not assigned to this ticket:`)
                  .setFooter("*I'll delete this message in 20 seconds")

                  let isContinue = true;
                  let fault = false;

                  let counter = 0;
                  let counterCheck = 0;

                  await message.mentions.members.map(async (item, index) => {
                    await query(`SELECT * FROM users WHERE TicketID = ${secondArgAssignNum} AND UserID = ${item.id}`, async (error, rows, fields) => {
                      counterCheck++;
                      let user = await client.users.fetch(item.id);
                      if (error) {
                        console.log(error)
                        let responseEmbed = new Discord.MessageEmbed()
                        .setColor("#FF0000")
                        .setTitle(`── Fault when checking ${user.username} ──`)
                        .setDescription(`${error}`)
                        await targetChannel.send(responseEmbed);
                        return;
                      }
                      if (rows.length == 0) {
                        fault = await true;
                        await message.mentions.members.map(async (item) => {
                          let user = await client.users.fetch(item.id);
                          await alreadyUnAssignedEmbed.addField(`**${user.username}**`,"\u200B",false);
                        });
                      }
                      if (message.mentions.members.size == counterCheck && fault) {
                        await targetChannel.send(alreadyUnAssignedEmbed).then(async (sent) => {
                          await sent.delete({timeout:20000});
                        });
                      }
                      if (rows.length != 0 && (counterCheck == message.mentions.members.size) && !fault) {
                        await message.mentions.members.map(async (item, index) => {
                            let isError = false;
                            await query(`DELETE FROM users WHERE UserID = "${item.id}" AND TicketID = "${secondArgAssignNum}"`, async (error) => {
                              let user = await client.users.fetch(item.id);
                              counter++

                              if (error) {
                                isError = true;
                                console.log(error)
                                let responseEmbed = new Discord.MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle(`── Fault when unassigning ${user.username} ──`)
                                .setDescription(`${error}`)
                                await targetChannel.send(responseEmbed);
                              }
                              if (isError == false){
                                await mainResponseEmbed.addField(`${user.username}`,"\u200B", false);
                              }

                              if ((message.mentions.members.size == counter) && (isError == false)) {
                                await message.mentions.members.map(async (item, index) => {
                                  let user = await client.users.fetch(item.id);

                                  let responseEmbed = new Discord.MessageEmbed()
                                  .setColor("#bb018a")
                                  .setDescription(`**─ Ticket #${secondArgAssignNum} ─**\n**| Description:** ${description}\n**| Creator:** ${creator.username}#${creator.discriminator}\n**| Department:** ${department.name}\n**| Created At:** ${date}`)

                                  if (item.id == author.id) {
                                    responseEmbed.setTitle(`${user.username}, you've unassigned yourself from a Ticket!`)
                                  }
                                  else {
                                    responseEmbed.setTitle(`${user.username}, you've been unassigned from a Ticket by your Head of Department!`)
                                  }
                                  try {
                                    await item.send(responseEmbed);
                                  }
                                  catch (error) {
                                    if (error.message == "Cannot send messages to this user") {
                                      let responseEmbed = new Discord.MessageEmbed()
                                      .setColor('#FF0000')
                                      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I couldn't notify ${user.username}`)
                                      .setFooter("*I'll delete this message in 10 seconds")
                                      await targetChannel.send(responseEmbed).then(async (sent) => {
                                        await sent.delete({timeout:10000});
                                      });
                                    }
                                  }
                                });
                                await targetChannel.send(mainResponseEmbed).then(async (sent) => {
                                  await sent.delete({timeout:20000});
                                  return;
                                });
                                return;
                              }
                            });
                        });
                      }
                    });
                  });
                }
              });
            }
          });
        }
        else {
          let responseEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
          .setDescription(`You don't have the required permissions for this command.`)
          .setFooter("*I'll delete this message in 10 seconds.")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({timeout:10000});
          });
          return;
        }
        break;

      //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
      default:
        //Send Help Panel
        const args = await module.exports.ticket_args;
        const argsArray = Object.values(args);
        const size = argsArray.length;

        let helpEmbed = new Discord.MessageEmbed()
        .setColor('#bb018a')
        .setTitle(`${message.author.username}, here's a list of what I can do for you.`)
        .setDescription('**Some of the commands will require me to send you a private message.\nPlease make sure you have DMs enabled.**')
        .setFooter("*I'll delete this message in 1 minute")

        argsArray.forEach(async (item, i) => {
          const name = (item.name.charAt(0).toUpperCase() + item.name.slice(1));

          if (IsLeader) {
            helpEmbed.addField(`─ ${name} ─`, `**| Description:** ${item.description}\n**| Example:** ${item.example}\n**| Available from:** ${item.tag}`, true);
          }
          else if (!IsLeader && item.tag == "Access Rank II") {
            helpEmbed.addField(`─ ${name} ─`, `**| Description:** ${item.description}\n**| Example:** ${item.example}\n**| Available from:** ${item.tag}`, true);
          }

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
    name: ("ticket"),
    description: ("More information about ticket system and it's usage."),
    example: ("!ticket"),
    tag: ("Access Rank II")
  },

  ticket_args: [
    {name: "create", description: "Create a new ticket (I will send you a DM!)", example: "!ticket create", tag:"Access Rank II"},
    {name: "delete", description: "Delete an existing ticket.", example: "!ticket delete ticketID", tag:"Access Rank II"},
    {name: "edit", description: "Edit one of your existing tickets (I will send you a DM!)", example: "!ticket edit ticketID", tag:"Access Rank II"},
    {name: "list", description: "List all available tickets and TicketIDs", example: "!ticket list", tag:"Access Rank II"},
    {name: "assigned", description: "View the list of tickets you're assigned to", example: "!ticket assigned", tag:"Access Rank II"},
    {name: "complete", description: "Mark an existing ticket as complete.", example: "!ticket complete ticketID", tag:"Head of Department"},
    {name: "assign", description: "Assign one or multiple members to a ticket.", example: "!ticket assign ticketID @Example_User#0000", tag:"Head of Department"},
    {name: "unassign", description: "Unassign one or multiple members from a ticket.", example: "!ticket unassign ticketID @Example_User#0000", tag:"Head of Department"}
  ],
}
