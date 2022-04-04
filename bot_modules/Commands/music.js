const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const streamBuffers = require('stream-buffers');


async function play(client, guild, song) {
    const func = client.basicFunctions.get("getFromConfig");
    const serverQueue = queue.get(guild.id);
    let botCommChannel;
    await func.run("Channels", "botCommandsChannel", async (response) => {
      botCommChannel = await guild.channels.cache.get(response);
    });

    if (!song) {
      queue.delete(guild.id);
      leaveTimer = setTimeout(async function(guild) {
        serverQueue.voiceChannel.leave();
        let responseEmbed = new Discord.MessageEmbed()
          .setColor("#bb018a")
          .setTitle(`No activity, leaving ${serverQueue.voiceChannel.name}.`)
          .setFooter("*I'll delete this message in 30 seconds")
        await botCommChannel.send(responseEmbed).then(async (sent) => {
          return await sent.delete({
            timeout: 30000
          });
        });
        return;
      }, 300000);
      return;
    }

    //const dispatcher = serverQueue.connection.play(await ytdl(song.url), {type: 'opus'}, {filter: 'audioonly', quality: 'lowestaudio', highWaterMark: 1<<25}).on("finish", () => {
    const dispatcher = serverQueue.connection.play(await ytdl(song.url, {
        filter: 'audioonly',
        quality: 'lowestaudio',
        highWaterMark: 1<<25
      })).on("finish", () => {
        if (!loop) {
          serverQueue.songs.shift();
        }
        play(client, guild, serverQueue.songs[0]);
      }).on("error", async (error) => {
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        console.error(error);
        let responseEmbed = new Discord.MessageEmbed()
          .setColor("#FF0000")
          .setTitle(`Unknown Error!`)
          .setDescription(`${error.message}`)
        await serverQueue.textChannel.send(responseEmbed)
      }); dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
      let responseEmbed = new Discord.MessageEmbed()
        .setColor("#bb018a")
        .setTitle(`Currently Playing: **${song.title}**`)
        .setDescription(`${song.url}`)
        .setThumbnail(`${song.thumbnail.url}`)
        .setFooter("*I'll delete this message in 1 minute")
      if (loop) {
        responseEmbed.setTitle(`Currently Looped: **${song.title}**`)
      }
      await serverQueue.textChannel.send(responseEmbed).then(async (sent) => {
        return await sent.delete({
          timeout: 60000
        });
      });
    }

    let loop = false;
    let leaveTimer;
    let channelLeave;
    const queue = new Map();


    module.exports = {
      run: async (client, msg, message, allCommands, user, member, connection, query) => {
        const func = client.basicFunctions.get("getFromConfig");

        let guild;
        let botCommChannel;
        await func.run(null, "guild", async (response) => {
          guild = await client.guilds.cache.get(response);
        });
        await func.run("Channels", "botCommandsChannel", async (response) => {
          botCommChannel = await guild.channels.cache.get(response);
        });

        const targetChannel = await guild.channels.cache.get(message.channel.id);
        const author = await message.guild.member(message.author);
        const authorData = await client.users.fetch(author.id);

        await message.delete();
        const arg = msg.replace("music", "").toLowerCase().trim().split(" ");

        const serverQueue = queue.get(message.guild.id);


        //Leave voice channel if channel is empty
        client.on('voiceStateUpdate', async (oldState, newState) => {
          const func = client.basicFunctions.get("getFromConfig");

          let guild;
          await func.run(null, "guild", async (response) => {
            guild = await client.guilds.cache.get(response);
          });
          const serverQueue = queue.get(message.guild.id);

          if (oldState.channelID !== oldState.guild.me.voice.channelID || newState.channel) {
            return;
          }

          if (oldState.channel.members.size == 1) {
            channelLeave = setTimeout(async () => {
              if (oldState.channel.members.size == 1) {
                if (!serverQueue.connection.dispatcher == null) {
                  serverQueue.connection.dispatcher.end();
                }
                serverQueue.songs = [];
                oldState.channel.leave();
                let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#bb018a")
                  .setTitle(`No activity, leaving ${serverQueue.voiceChannel.name}.`)
                  .setFooter("*I'll delete this message in 30 seconds")
                await botCommChannel.send(responseEmbed).then(async (sent) => {
                  return await sent.delete({
                    timeout: 30000
                  });
                });
              }
            }, 300000);
          }
        });


        if (!message.member.voice.channel && (arg[0] == "p" || arg[0] == "s" || arg[0] == "stop" || arg[0] == "queue" || arg[0] == "loop")) {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
            .setDescription("You need to be in a voice channel for this.")
            .setFooter("*I'll delete this message in 10 seconds")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            return await sent.delete({
              timeout: 10000
            });
          });
          return;
        }

        if (serverQueue && (message.member.voice.channel.id != serverQueue.voiceChannel.id) && (arg[0] == "p" || arg[0] == "s" || arg[0] == "stop" || arg[0] == "queue" || arg[0] == "loop")) {
          let responseEmbed = new Discord.MessageEmbed()
            .setColor("#FF0000")
            .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
            .setDescription(`I'm currently busy streaming to ${serverQueue.voiceChannel.name}.`)
            .setFooter("*I'll delete this message in 15 seconds")
          await targetChannel.send(responseEmbed).then(async (sent) => {
            return await sent.delete({
              timeout: 15000
            });
          });
          return;
        }

        switch (arg[0]) {
          // PLAY
          case "p":
          case "play":
            const voiceChannel = message.member.voice.channel;
            try {
              if (message.content.replace("!music", "").trim().split(" ")[1] == undefined) {
                let responseEmbed = new Discord.MessageEmbed()
                  .setColor("#FF0000")
                  .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                  .setDescription(`Please provide a youtube link for me to play.`)
                  .setFooter("*I'll delete this message in 15 seconds")
                await targetChannel.send(responseEmbed).then(async (sent) => {
                  return await sent.delete({
                    timeout: 15000
                  });
                });
                return;
              }
              const songInfo = await ytdl.getInfo(await message.content.replace("!music", "").trim().split(" ")[1].trim());
              const song = {
                title: songInfo.videoDetails.title,
                thumbnail: songInfo.videoDetails.thumbnails[0],
                url: songInfo.videoDetails.video_url,
              };

              if (!serverQueue) {
                const queueContruct = {
                  textChannel: targetChannel,
                  voiceChannel: voiceChannel,
                  connection: null,
                  songs: [],
                  volume: 5,
                  playing: true
                };

                queue.set(guild.id, queueContruct);

                queueContruct.songs.push(song);
                try {
                  const connection = await voiceChannel.join();
                  queueContruct.connection = connection;
                  clearTimeout(leaveTimer);
                  clearTimeout(channelLeave);
                  play(client, guild, queueContruct.songs[0]);
                } catch (err) {
                  console.log(err);
                  queue.delete(guild.id);
                }
              } else {
                if (serverQueue.songs.length >= 15) {
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`I'm sorry, ${message.author.username}. I'm afraid I can't do that.`)
                    .setDescription(`The queue has reached it's limit (15)\nI can get you the list if you type !music queue`)
                    .setFooter("*I'll delete this message in 30 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    return await sent.delete({
                      timeout: 30000
                    });
                  });
                  return;
                } else {
                  clearTimeout(channelLeave);
                  clearTimeout(leaveTimer);
                  serverQueue.songs.push(song);
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#bb018a")
                    .setTitle(`${song.title} has been added to the queue!`)
                    .setFooter("*I'll delete this message in 15 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    return await sent.delete({
                      timeout: 15000
                    });
                  });
                }
              }
            } catch (error) {
              serverQueue.songs = [];
              serverQueue.connection.dispatcher.end();
              switch (error.message) {
                case `No video id found: ${await message.content.replace("!music","").trim().split(" ")[1].trim()}`:
                  let responseEmbed = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`Error`)
                    .setDescription(`Could not find video "${await message.content.replace("!music","").trim().split(" ")[1].trim()}"`)
                    .setFooter("*I'll delete this message in 10 seconds")
                  await targetChannel.send(responseEmbed).then(async (sent) => {
                    return await sent.delete({
                      timeout: 10000
                    });
                  });
                  return;
                  break;

                case `Status code: 410`:
                  let responseEmbed2 = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`Error: ${error.message}`)
                    .setDescription(`That video is no longer available or has been deleted.`)
                    .setFooter("*I'll delete this message in 10 seconds")
                  await targetChannel.send(responseEmbed2).then(async (sent) => {
                    return await sent.delete({
                      timeout: 10000
                    });
                  });
                  return;
                  break;

                case `Status code: 403`:
                  let responseEmbed3 = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`Error: ${error.message}`)
                    .setDescription(`Requested resource is blocked for me.\n(Probably country restricted.)`)
                    .setFooter("*I'll delete this message in 10 seconds")
                  await targetChannel.send(responseEmbed3).then(async (sent) => {
                    return await sent.delete({
                      timeout: 10000
                    });
                  });
                  return;
                  break;

                case `Not a YouTube domain`:
                  let responseEmbed4 = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`Error: ${error.message}`)
                    .setDescription(`I can only stream music from YouTube.`)
                    .setFooter("*I'll delete this message in 10 seconds")
                  await targetChannel.send(responseEmbed4).then(async (sent) => {
                    return await sent.delete({
                      timeout: 10000
                    });
                  });
                  return;
                  break;

                case `This is a private video. Please sign in to verify that you may see it.`:
                  let responseEmbed5 = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`Error: This is a private video.`)
                    .setDescription(`I cannot play private videos.`)
                    .setFooter("*I'll delete this message in 10 seconds")
                  await targetChannel.send(responseEmbed5).then(async (sent) => {
                    return await sent.delete({
                      timeout: 10000
                    });
                  });
                  return;
                  break;

                default:
                  let responseEmbed6 = new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`Unknown Error`)
                    .setDescription(`Unhandled Error Report:\n${error.message}\n\nInput: ${message.content}`)
                  await targetChannel.send(responseEmbed6);
                  console.log(error)
                  return;
                  break;
              }
            }
            break;

            // SKIP
          case "s":
          case "skip":
            if (!serverQueue || serverQueue.connection.dispatcher == null) {
              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#bb018a")
                .setTitle(`There is no song that I could skip.`)
                .setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                return await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
            serverQueue.connection.dispatcher.end();
            let responseEmbed = new Discord.MessageEmbed()
              .setColor("#bb018a")
              .setTitle(`Skipped: **${serverQueue.songs[0].title}**`)
              .setFooter("*I'll delete this message in 15 seconds")
            await serverQueue.textChannel.send(responseEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 15000
              });
            });
            break;

            // LOOP
          case "loop":
            if (!loop) {
              loop = true;
              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#bb018a")
                .setTitle(`Looped: **${serverQueue.songs[0].title}**`)
                .setFooter("*I'll delete this message in 15 seconds")
              await serverQueue.textChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 15000
                });
              });
            } else {
              loop = false;
              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#bb018a")
                .setTitle(`**${serverQueue.songs[0].title}** is no longer looped.`)
                .setFooter("*I'll delete this message in 15 seconds")
              await serverQueue.textChannel.send(responseEmbed).then(async (sent) => {
                await sent.delete({
                  timeout: 15000
                });
              });
            }
            break;

            // STOP
          case "stop":
            if (!serverQueue || serverQueue.connection.dispatcher == null) {
              let responseEmbed = new Discord.MessageEmbed()
                .setColor("#bb018a")
                .setTitle(`There is no song that I could stop.`)
                .setFooter("*I'll delete this message in 10 seconds")
              await targetChannel.send(responseEmbed).then(async (sent) => {
                return await sent.delete({
                  timeout: 10000
                });
              });
              return;
            }
            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
            let responseEmbed2 = new Discord.MessageEmbed()
              .setColor("#bb018a")
              .setTitle(`Playback stopped, queue cleared.`)
              .setFooter("*I'll delete this message in 15 seconds")
            await serverQueue.textChannel.send(responseEmbed2).then(async (sent) => {
              await sent.delete({
                timeout: 15000
              });
            });
            break;

            // QUEUE
          case "queue":
            let queueEmbed = new Discord.MessageEmbed()
              .setColor('#bb018a')
              .setTitle(`${message.author.username}, here's a list of the queue.`)
              .setFooter("*I'll delete this message in 1 minute")

            await serverQueue.songs.forEach(async (item, i) => {
              if (i == 0) {
                if (loop) {
                  queueEmbed.addField(`Currently Looped: ─ ${item.title} ─`, `**| URL:** ${item.url}\n**──────────────────────────────**\n`, false);
                } else {
                  queueEmbed.addField(`Currently Playing: ─ ${item.title} ─`, `**| URL:** ${item.url}\n**──────────────────────────────**\n`, false);
                }
              } else {
                queueEmbed.addField(`#${i+1} ─ ${item.title} ─`, `**| URL:** ${item.url}\n**──────────────────────────────**\n`, false);
              }
            });

            await targetChannel.send(queueEmbed).then(async (sent) => {
              await sent.delete({
                timeout: 60000
              });
            });
            return;
            break;

          default:
            //Send Help Panel
            const args = await module.exports.music_args;
            const argsArray = Object.values(args);
            const size = argsArray.length;

            let helpEmbed = new Discord.MessageEmbed()
              .setColor('#bb018a')
              .setTitle(`${message.author.username}, here's a list of what I can do for you.`)
              .setFooter("*I'll delete this message in 1 minute")

            argsArray.forEach(async (item, i) => {
              const name = (item.name.charAt(0).toUpperCase() + item.name.slice(1));

              helpEmbed.addField(`─ ${name} ─`, `**| Description:** ${item.description}\n**| Example:** ${item.example}\n`, true);

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
        name: ("music"),
        description: ("More information about the music system and it's usage"),
        example: ("!music"),
        tag: ("Access Rank II")
      },

      music_args: [{
          name: "play",
          description: "Start playing music or add to queue.",
          example: "!music play [youtube link]"
        },
        {
          name: "skip",
          description: "Skip a track.",
          example: "!music skip"
        },
        {
          name: "loop",
          description: "Toggle looping of currently playing track.",
          example: "!music loop"
        },
        {
          name: "stop",
          description: "Stop playing music.",
          example: "!music stop"
        },
        {
          name: "queue",
          description: "View the music queue.",
          example: "!music queue"
        }
      ],
    }
