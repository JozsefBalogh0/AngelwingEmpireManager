const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');


const leaderboardFilePath = '../../Data/leaderboards.json';
const leaderboards = require(path.join(__dirname, leaderboardFilePath));

function write(data) {
  fs.writeFileSync(path.join(__dirname, leaderboardFilePath), JSON.stringify(data, null, 2), function writeJSON(err) {
    if (err) return console.log(err)
  });
}


module.exports = {
  run: async (client, query) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    let devMode;
    let goldLeaderboardChannelID;
    let combatLeaderboardChannelID;
    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });
    await func.run(null, "enabled", async (response) => {
      devMode = response;
    });

    await func.run("Channels", "goldLeaderboard", async (response) => {
      goldLeaderboardChannelID = response;
    });
    await func.run("Channels", "combatLeaderboard", async (response) => {
      combatLeaderboardChannelID = response;
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

    const goldChannel = await guild.channels.cache.get(goldLeaderboardChannelID);
    const combatChannel = await guild.channels.cache.get(combatLeaderboardChannelID);

    const leaderMap = new Map(Object.entries(leaderboards[0]))
    const leaderKeys = Object.keys(leaderboards[0])

    let goldMessageID = undefined;
    let combatMessageID = undefined;

    leaderKeys.map(x => {
      if (x == "Gold") {
        leaderMap.get(x).map(y => {
          if (y.Message != "") {
            goldMessageID = y.Message;
          }
          if (devMode == "true" && y.DEV.Message != "") {
            goldMessageID = y.DEV.Message;
          }
        });
      } else {
        leaderMap.get(x).map(y => {
          if (y.Message != "") {
            combatMessageID = y.Message;
          }
          if (devMode == "true" && y.DEV.Message != "") {
            combatMessageID = y.DEV.Message;
          }
        });
      }
    });

    //CONSTUCT GOLD LEADERBOARD
    let goldLeaderboardEmbed = new Discord.MessageEmbed()
      .setColor('#bb018a')
      .setTitle(`Gold Leaderboards`)

    await query(`SELECT * FROM feathers ORDER BY GoldAmount DESC LIMIT 20`, async (error, rows, field) => {
      if (error) {
        console.log(error)
        return;
      } else {
        let placementArray = [];
        let count = 0;
        await new Promise((resolve) => {
          rows.forEach(async (item) => {
            try {
              if (item.GoldAmount != 0) {
                let placementData = {}
                placementData.userData = await client.users.fetch(item.UserID)
                placementData.Data = item;
                placementArray.push(placementData);
              }
              count++;
            } catch (e) {
              // error handling
              console.log(e)
              return;
            } finally {
              if (count == rows.length) {
                resolve()
              }
            }
          });
        });

        placementArray.sort((a,b)=> (b.Data.GoldAmount - a.Data.GoldAmount || a.userData.username.toLowerCase().localeCompare(b.userData.username.toLowerCase())  ));

        await placementArray.forEach(async (item, i) => {
          await goldLeaderboardEmbed.addField(`${i+1}. ─> ${item.userData.username} <─`, `Golden Feathers: **${item.Data.GoldAmount}** ${GoldFeather}`, false);
          if (placementArray.length == i + 1) {
            try {
              const goldEmbed = await goldChannel.messages.fetch(goldMessageID);
              await goldEmbed.edit(goldLeaderboardEmbed);
            } catch (error) {
              // IF MESSAGE NOT EXISTENT
              await goldChannel.send(goldLeaderboardEmbed).then(sent => {
                leaderKeys.map(x => {
                  if (x == "Gold") {
                    leaderMap.get(x).map(y => {
                      if (devMode == "true") {
                        y.DEV.Message = sent.id.toString();
                      } else {
                        y.Message = sent.id.toString();
                      }
                    });
                  }
                });
                write(leaderboards);
              });
            }
          }
        });
      }
    });

    //CONSTUCT COMBAT LEADERBOARD -------------------------------------------------------------------------------------------------------------------

    let combatLeaderboardEmbed = new Discord.MessageEmbed()
      .setColor('#bb018a')
      .setTitle(`Combat Leaderboards`)

    await query(`SELECT * FROM feathers ORDER BY RedAmount DESC LIMIT 20`, async (error, rows, field) => {
      if (error) {
        console.log(error)
        return;
      } else {
        let placementArray = [];
        let count = 0;
        await new Promise((resolve) => {
          rows.forEach(async (item) => {
            try {
              if (item.RedAmount != 0) {
                let placementData = {}
                placementData.userData = await client.users.fetch(item.UserID)
                placementData.Data = item;
                placementArray.push(placementData);
              }
              count++;
            } catch (e) {
              // error handling
              console.log(e)
              return;
            } finally {
              if (count == rows.length) {
                resolve()
              }
            }
          });
        });

        placementArray.sort((a,b)=> (b.Data.RedAmount - a.Data.RedAmount || a.userData.username.toLowerCase().localeCompare(b.userData.username.toLowerCase())  ));

        await placementArray.forEach(async (item, i) => {
          await combatLeaderboardEmbed.addField(`${i+1}. ─> ${item.userData.username} <─`, `Combat Feathers: **${item.Data.RedAmount}** ${CombatFeather}`, false);
          if (placementArray.length == i + 1) {
            try {
              const combatEmbed = await combatChannel.messages.fetch(combatMessageID);
              await combatEmbed.edit(combatLeaderboardEmbed);
            } catch (error) {
              // IF MESSAGE NOT EXISTENT
              await combatChannel.send(combatLeaderboardEmbed).then(sent => {
                leaderKeys.map(x => {
                  if (x == "Combat") {
                    leaderMap.get(x).map(y => {
                      if (devMode == "true") {
                        y.DEV.Message = sent.id.toString();
                      } else {
                        y.Message = sent.id.toString();
                      }
                    });
                  }
                });
                write(leaderboards);
              });
            }
          }
        });
      }
    });
  },

  help: {
    name: ("leaderboardHandler")
  }
}
