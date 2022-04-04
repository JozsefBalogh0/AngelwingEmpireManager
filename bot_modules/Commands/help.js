const Discord = require('discord.js');
const sortArray = require('sort-array');

async function defaultMenu(filtered, helpEmbed, size) {
  filtered[0].map((x, i) => {
    const name = (x.name.charAt(0).toUpperCase() + x.name.slice(1));

    helpEmbed.addField(`─ ${name} ─`, `**| Description:** ${x.description}\n**| Example:** ${x.example}\n**| Available from:** ${x.tag}`, true)

    if ((i % 2 !== 0) && (i !== size-1)) {
      helpEmbed.addField("\u200B","\u200B")
    }
  });
}

//Help Command
module.exports = {
  run: async (client, msg, message, allCommands, user, member, connection, query, version) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });

    let leadershipRole;
    let accessIVRole;
    let shipCaptainRole;
    let admiralRole;
    let HoDRoleID;
    let fleetCommanderRole;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
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

    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const author = await message.guild.member(message.author);
    const authorData = await client.users.fetch(author.id);

    const helpEmbed = new Discord.MessageEmbed()
    .setColor('#bb018a')
    .setTitle(`${authorData.username}, here's a list of what I can do for you:`)
    .setFooter(`Bot version: ${version}\n\nPage: 1\nTo view other pages type: !help 2, !help 3, etc\n*I'll delete this message in 1 minute`)

    await message.delete();

    let chunked = [];
    let tempArr = [];
    let size = 6;
    let i = 0;
    let commandsArray = allCommands.map(item => item.help);
    sortArray(commandsArray, {by: 'tag', order: 'desc'})

    await allCommands.forEach(async (item) => {
      await Object.entries(item).forEach(x => {
        if (x[1].tag != undefined) {
          switch (x[1].tag) {
            case "Public":
              tempArr.push(item.help);
              i++;
              if (i >= size) {
                chunked.push(tempArr);
                tempArr = [];
                i = 0;
              }
              break;

            case "Access Rank II":
              if ((author._roles.includes(HoDRoleID)) || (author._roles.includes(shipCaptainRole)) || (author._roles.includes(fleetCommanderRole)) || (author._roles.includes(admiralRole)) || (author._roles.includes(leadershipRole))){
                tempArr.push(item.help);
                i++;
                if (i >= size) {
                  chunked.push(tempArr);
                  tempArr = [];
                  i = 0;
                }
              }
              break;

            case "Head of Department":
              if (author._roles.includes(HoDRoleID) || author._roles.includes(leadershipRole)){
                tempArr.push(item.help);
                i++;
                if (i >= size) {
                  chunked.push(tempArr);
                  tempArr = [];
                  i = 0;
                }
              }
              break;

            case "Fleet Commander":
              if ((message.member.roles.cache.find(r => r.id === accessIVRole)) || (message.member.roles.cache.find(r => r.id === shipCaptainRole)) || (message.member.roles.cache.find(r => r.id === admiralRole)) || (author._roles.includes(leadershipRole))){
                tempArr.push(item.help);
                i++;
                if (i >= size) {
                  chunked.push(tempArr);
                  tempArr = [];
                  i = 0;
                }
              }
              break;

            case "Admin":
              if (author._roles.includes(leadershipRole)){
                tempArr.push(item.help);
                i++;
                if (i >= size) {
                  chunked.push(tempArr);
                  tempArr = [];
                  i = 0;
                }
              }
              break;
          }
        }
      })
    });
    chunked.push(tempArr);

    const filtered = chunked.filter((a) => a.length)

    let matches = msg.match(/\d+/g);
    if (matches != null) matches = matches[0];

    if (!((matches == null) || (matches == 1))) {
      if (filtered[matches-1]) {
        filtered[matches-1].map((x, i) => {
          const name = (x.name.charAt(0).toUpperCase() + x.name.slice(1));

          helpEmbed.addField(`─ ${name} ─`, `**| Description:** ${x.description}\n**| Example:** ${x.example}\n**| Available from:** ${x.tag}`, true)
          helpEmbed.setFooter(`Bot version: ${version}\n\nPage: ${matches}\n*I'll delete this message in 1 minute`)

          if ((i % 2 !== 0) && (i !== size-1)) {
            helpEmbed.addField("\u200B","\u200B")
          }
        });
      }
      else {
        defaultMenu(filtered, helpEmbed, size)
      }
    }
    else {
      defaultMenu(filtered, helpEmbed, size)
    }
    await targetChannel.send(helpEmbed).then(async (sent) => {
      await sent.delete({timeout:60000});
    });
  },


  help: {
    name: ("help"),
    description: ("Display a list of commands"),
    example: ("!help"),
    tag: ("Public")
  }
}
