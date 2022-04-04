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


//Promote Command
module.exports = {
  run: async (client, msg, message, allCommands, user, member) => {
    const func = client.basicFunctions.get("getFromConfig");
    let ranksCollection;

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    let everybodyRoleID;
    let leadershipRoleID;
    let accessIRoleID;
    await func.run("Roles", "Everybody", async (response) => {
      everybodyRoleID = response;
    });
    await func.run("Roles", "Leadership", async (response) => {
      leadershipRoleID = response;
    });
    await func.run(null, "enabled", async (response) => {
      if (response == "true") {
        ranksCollection = require('../../Data/ranksCollectionDEV.json');
      }
      else {
        ranksCollection = require('../../Data/ranksCollection.json');
      }
    });



    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const author = message.guild.member(message.author);



    if (user == undefined){
      const noMentionEmbed = new Discord.MessageEmbed()
      .setColor('#FF0000')
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription('Please provide who you want me to promote in the form of a mention.')
      .setFooter(`Example: !promote @Example_User#0000`)
      await targetChannel.send(noMentionEmbed);
      return;
    }

    await message.delete();

    let mainEmbed = new Discord.MessageEmbed()
    .setColor("#bb018a")
    .setTitle(`${message.author.username}, please specify what rank do you want me to promote ${member.username}#${member.discriminator} to`)
    .setDescription("Available promotes are:")
    .setFooter("*I'll cancel this operation in 30 seconds if I don't hear from you.")

    let availableRanks = [];
    let userRoles = [];
    let authorRoles = [];

    //Get data from ranksCollection.json
    const rankMap = new Map(Object.entries(ranksCollection[0]))
    const rankKeys = Object.keys(ranksCollection[0])

    //Get userRoles
    await user.roles.cache.forEach(async (role) => {
      await rankKeys.map(x => {
        rankMap.get(x).map(y => {
          if (y.id == role.id) {
            userRoles.push(role.id)
          }
        })
      })
    });

    //Get author roles
    await author.roles.cache.forEach(async (role) => {
      rankKeys.map(x => {
        rankMap.get(x).map(y => {
          if ((y.id == role.id) && role.id != everybodyRoleID) {
            authorRoles.push(role.id);
          }
        })
      })
    });

    authorRoles.reverse();
    //If user is already at highest rank
    const highestLimit = [leadershipRoleID]
    if (areArraysEqual(highestLimit, userRoles)) {
      let responseEmbed = new Discord.MessageEmbed()
      .setColor('#FF0000')
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription(`${member.username}#${member.discriminator} is already at the highest rank I can give them.`)
      .setFooter("*I'll delete this message in 10 seconds.")
      await targetChannel.send(responseEmbed).then(async (sent) => {
        await sent.delete({timeout:10000});
      });
      return;
    }

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
      }
      else {
        AllIDs.push([])
        removedArr = [...tempArray1]
      }
    })
    //Transform data into usable format
    const isEmpty = (element) => element.length == 0;
    const userRank = AllIDs.findIndex(isEmpty);

    await author.roles.cache.forEach(async (role) => {
      if (role.id == leadershipRoleID) {
        authorRoles = []
        await authorRoles.push(role.id);
      }
    })

    let authorRolesIndex = 0;
    await AllIDs.forEach(async (item, i) => {
      if (areArraysEqual(item, authorRoles)) {
        return authorRolesIndex = i
      }
    })

    //If target is higher ranked than author
    if (userRank >= authorRolesIndex) {
      let responseEmbed = new Discord.MessageEmbed()
      .setColor('#FF0000')
      .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
      .setDescription(`You lack the required permissions for this.`)
      .setFooter("*I'll delete this message in 10 seconds.")
      await targetChannel.send(responseEmbed).then(async (sent) => {
        await sent.delete({timeout:10000});
      });
      return;
    }

    IDArray = [...AllIDs];

    IDArray.splice(0, userRank)
    IDArray.splice(authorRolesIndex-userRank, IDArray.length)
    NameArray.splice(0, userRank+1)
    NameArray.splice(authorRolesIndex-userRank-1, NameArray.length)

    const filtered = IDArray.filter((a) => a.length);

    const emojiArray = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

    //Add fields for each possible promote
    filtered.forEach((item, i)=> {
      mainEmbed.addField(`${NameArray[i]}:`, `Press '${emojiArray[i]}' to promote **${member.username}#${member.discriminator}** to **${NameArray[i]}** rank.`)
    });

    //Add emojis to message
    await targetChannel.send(mainEmbed).then(async (main) => {
      NameArray.forEach(async (item, i) => {
        await main.react(emojiArray[i]);
      });
      await main.awaitReactions((reaction, user) => user.id == message.author.id && (emojiArray.includes(reaction.emoji.name)), { max: 1, time: 30000 }).then(async (collected) => {
        //Emoji and input/output handler
        let tempArr2 = [];
        const isEqual = (element) => element == collected.first().emoji.name
        const indexOfID = emojiArray.findIndex(isEqual);

        removedArr.forEach(async (item) => {
          let role = await guild.roles.cache.get(item);
          if (!role.name.includes("¤")) {
            await user.roles.remove(role);
          }
        });

        filtered[indexOfID].forEach(async (item) => {
          tempArr2.push(item);

          let role = await guild.roles.cache.get(item);
          await user.roles.add(role);
        });

        let index = 0;
        AllIDs.forEach((item, i) => {
          if (areArraysEqual(item, tempArr2)) index = i;
        });

        AllIDs.splice(index, 1);
        const AllFiltered = AllIDs.filter((a) => a.length);

        //Message if successful
        let responseEmbed = new Discord.MessageEmbed()
        .setColor("#00FF00")
        .setTitle(`${message.author.username}, I've promoted ${member.username}#${member.discriminator} to ${NameArray[indexOfID]}.`)
        .setFooter("*I'll delete this message in 15 seconds")
        await targetChannel.send(responseEmbed).then(async (sent) => {
          await sent.delete({timeout:15000});
        });
        return;

        //Message if error
      }).catch(async (err) => {
        if (err.message == "Cannot read properties of undefined (reading 'emoji')"){
          let responseEmbed = new Discord.MessageEmbed()
          .setColor("#FF0000")
          .setTitle(`${message.author.username}, I've cancelled the promote operation.`)
          .setFooter("*I'll delete this message in 15 seconds.")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            await sent.delete({timeout:15000});
          });
        }
        else {
          let responseEmbed = new Discord.MessageEmbed()
          .setColor("#FF0000")
          .setTitle(`── Fault Detected: ──`)
          .setDescription(`Promote Operation Cancelled:\n*${err.name}*\n*${err.message}*\n\nMore info in console.`)
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
    name: ("promote"),
    description: ("Promote a user."),
    example: ("!promote @Example_User#0000"),
    tag: ("Head of Department")
  }
}
