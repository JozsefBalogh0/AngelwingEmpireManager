// LOAD CONFIG
const config = require(__dirname + '/Data/config.json')

const configMap = new Map(Object.entries(config[0]))
const configKeys = Object.keys(config[0])

//GLOBAL VARIABLES
let DevMode = false;
let prefix;
let version;
let guildID;
let dotenvPath;
let updatesChannel;
let rulesChannel;
let rulesMessage;
let appChannel;
let ownID;


//Data
configKeys.map(x => {
  if (x == "DATA") {
    configMap.get(x).map(y => {
      prefix = y.prefix;
      version = y.version;
      guildID = y.guild;
      dotenvPath = y.env;
      ownID = y.selfID;

      updatesChannel = y.Channels.sbUpdates;
      rulesChannel = y.Channels.rulesChannel;
      rulesMessage = y.Messages.rulesMessage;
      appChannel = y.Channels.appChannel;
    });
  }
  else if (x == "DEV_MODE") {
    configMap.get(x).map(y => {
        if (y.enabled == "true") DevMode = true;
    });
  }
});

//Dev Mode Data
if (DevMode == true) {
  configKeys.map(x => {
    if (x == "DEV_MODE") {
      configMap.get(x).map(y => {
        guildID = y.guild;
        dotenvPath = y.env;
        ownID = y.selfID;

        updatesChannel = y.Channels.sbUpdates;
        rulesChannel = y.Channels.rulesChannel;
        rulesMessage = y.Messages.rulesMessage;
        appChannel = y.Channels.appChannel;
      });
    }
  });
}

//MAIN
require('dotenv').config({path: __dirname + dotenvPath});
const schedule = require('node-schedule');
const sleep = require('sleep-promise');
const Discord = require('discord.js');
const mysql = require("mysql");
const glob = require("glob");

const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: ['GUILD_MEMBERS', 'GUILD_PRESENCES', 'DIRECT_MESSAGES'] });
const TOKEN = (process.env.DISCORD_TOKEN);

//Establish Database Connection
const db_config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

let connectionClient = mysql.createConnection(db_config);

async function handleDisconnect(connection, manual, channel) {
  if (manual == true) {
    connectionClient.destroy();
    connectionClient = mysql.createConnection(db_config);
    await handleDisconnect(connectionClient, false, channel);
    return;
  }
  connection.connect(async (err) => {
    if (connection.state == "disconnected" && connectionAtempt >= 30) {
      console.log(`\nWarning: Ticket System Database Error: Connection Lost\nReconnection attempt reached limit\nPlease manually reconnect to Database`);
      client.user.setActivity(`Error: DB Connection`, {
        type: "PLAYING",
      });
      return;
    }

    if (err) {
      if (channel) {
        let responseEmbed = new Discord.MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`── Fault Detected ──`)
          .setDescription(`I couldn't connect to the Database: ${err.code}`)
          .setFooter("*I'll delete this message in 10 seconds.")
        await channel.send(responseEmbed).then(async (sent) => {
          await sent.delete({
            timeout: 10000
          });
        });
      }
      connectionClient.destroy();
      connectionAtempt++;
      if (err.fatal) {
        console.trace('fatal error: ' + err.message);
      }
      console.error(`\nError connecting to ${process.env.DB_NAME} Database: ${err.code}\nAttempt [${connectionAtempt}]`);
      client.user.setActivity(`Error DB Connection x${connectionAtempt}`, {
        type: "PLAYING",
      });
      await sleep(60000) //Wait one minute
      connectionClient = mysql.createConnection(db_config);
      return await handleDisconnect(connectionClient);
    }
    else if (connection.state == "connected" || connection.state == "authenticated") {
      connectionAtempt = 0;
      if (channel) {
        let responseEmbed = new Discord.MessageEmbed()
          .setColor('#00FF00')
          .setTitle(`── Success ──`)
          .setDescription(`I've connected to the Database as: id ${connection.threadId}`)
          .setFooter("*I'll delete this message in 10 seconds.")
        await channel.send(responseEmbed).then(async (sent) => {
          await sent.delete({
            timeout: 10000
          });
        });
      }
      console.log(`Connected to ${process.env.DB_NAME} Database as: id ${connection.threadId}\n`)
      client.user.setActivity("Starbase", {
        type: "PLAYING",
      });
    }
  });
  connection.on('error', async function(err) {
      connectionClient.destroy();
      connectionClient = mysql.createConnection(db_config);
      console.log(`Ticket System Database Error: ${err.code}\nReconnecting...\n`);
      if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        return await handleDisconnect(connectionClient);
      }
      else {
        console.log(err);
        return;
      }
  });
};

//Variables
let messagesArray = [];
let connectionAtempt = 0;

client.commands = new Discord.Collection()
client.automatedFunctions = new Discord.Collection()
client.basicFunctions = new Discord.Collection()


//──────────────────────────────────────────────────────────────────────────────
//Functions
//GetAllMessages
async function getAllMessages(channelID) {
  const func = client.automatedFunctions.get("appChannelHandler");

  await func.run(client, channelID, response => {
    messagesArray = response;
  });
}

//Post Game Updates
function postGameUpdates() {
  const func = client.automatedFunctions.get("starbaseUpdates");
  const chn = updatesChannel;
  func.run(client, chn);
}

//Get Collections
async function getFunctions(path, collection, description) {
  return new Promise(function(resolve, reject) {
    const getDirectories = (src, callback) => {
      glob(src + '/**/*', callback);
    }

    getDirectories(path, (err, res) => {
      if (err) {
        console.log(`Error:\n${err}`);
      }
      else {
        //Only get files with the extension .js
        let jsFiles = res.filter(f => f.split('.').pop() == ('js'))
        //If no .js files
        if (jsFiles.length <= 0) {
          console.log(`\n\nNo ${description} to load!`);
          return;
        }

        console.log(`\n\n── Loading ${jsFiles.length} ${description}! ──`);
        jsFiles.forEach((item, i) => {
          //Load
          let props = require(`./${item}`)
          console.log(`[${i+1}] ${item} loaded. Name: ${props.help.name}`)

          //Add to collection
          resolve(collection.set(props.help.name, props));
        })
      }
    })
  })
}

//──────────────────────────────────────────────────────────────────────────────
//Startup
client.on('ready', async () => {
  //Set basic data
  const guild = await client.guilds.cache.get(guildID);
  console.log(`${client.user.tag} is connected to the following server(s):\n${guild.name} (${guild.id})`);
  client.user.setActivity("Starbase", {
    type: "PLAYING",
  });

  //Get collection of commands
  await getFunctions('bot_modules/Commands', client.commands, 'commands');
  //Get collection of automated functions
  await getFunctions('bot_modules/Automated', client.automatedFunctions, 'automated functions');
  //Get collection of basic functions
  await getFunctions('bot_modules/Basic', client.basicFunctions, 'basic functions');

  //Establish Connection to Database
  console.log("\n\n── Database: ──")
  await handleDisconnect(connectionClient);

  //Get rules msg
  const ruleChannel = guild.channels.cache.get(rulesChannel);
  const msg = await ruleChannel.messages.fetch(rulesMessage);
  //Add reaction to rules msg
  await msg.react('✅');

  //Get all messages from applications channel
  await getAllMessages(appChannel);
});


//On user join
client.on('guildMemberAdd', async member => {
  const func = client.automatedFunctions.get("sendWelcome");
  func.run(client, member);
});


//On user leave
client.on("guildMemberRemove", async member => {
  const func = client.automatedFunctions.get("sendBye");
  func.run(client, member);
});


//Call Commands Handler
client.on('message', async message => {
  if (message.content.includes(`${prefix}reconnect`)) {
    message.delete()
    const guild = client.guilds.cache.get(guildID);
    const targetChannel = await guild.channels.cache.get(message.channel.id);
    const func = client.basicFunctions.get("getFromConfig");
    let leadershipRoleID;
    await func.run("Roles", "Leadership", async (response) => {
      leadershipRoleID = response;
    });
    if (!(message.member.roles.cache.find(r => r.id === leadershipRoleID))) {
      let responseEmbed = new Discord.MessageEmbed()
        .setColor('#FF0000')
        .setTitle(`── Permission Denied ──`)
        .setFooter("*I'll delete this message in 10 seconds.")
      await targetChannel.send(responseEmbed).then(async (sent) => {
        await sent.delete({
          timeout: 10000
        });
      });
      return;
    }

    await handleDisconnect(connectionClient, true, targetChannel);
    return;
  }
  const func = client.basicFunctions.get("commandsHandler");
  const commands = client.commands;
  func.run(client, message, commands, prefix, connectionClient, version);
});


//Only allow one message in a channel
client.on('message', async message => {
  if ((message.channel.id != appChannel) || (message.author.id == ownID)) return;
  const guild = client.guilds.cache.get(guildID);

  if (messagesArray.includes(message.author.id)){
    message.delete();
  }

  await getAllMessages(appChannel);
});


//Remove ID from messagesArray on message deleted
client.on('messageDelete', async (messageDelete) => {
  if (messageDelete.author == null) return;
  if ((messageDelete.channel.id != appChannel) && (messagesArray.includes(messageDelete.author.id))) return;
  const guild = client.guilds.cache.get(guildID);

  //Get message into cache if it's been deleted when the bot was off
  if(messageDelete.partial){
    let messageDelete = await message.fetch()
  }

  //Remove ID
  const index = messagesArray.indexOf(messageDelete.author.id);
  if (index > -1) {
    messagesArray.splice(index, 1);
  }
});



//If reaction added
client.on('messageReactionAdd', async (reaction, user) => {
  const func = client.basicFunctions.get("reactionHandler");
  func.run(client, reaction, user);
});


//partial reactions handler
client.on('raw', packet => {
  //Don't want this to run on unrelated packets
  if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
  //Grab channel
  const channel = client.channels.cache.get(packet.d.channel_id);
  //If reaction is already cached, return
  if (channel.messages.cache.has(packet.d.message_id)) return;
  //Fetch message
  channel.messages.fetch(packet.d.message_id).then(message => {
    const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
    const reaction = message.reactions.cache.get(emoji);
    if (reaction) reaction.users.cache.set(packet.d.user_id, client.users.cache.get(packet.d.user_id));

    if (packet.t === 'MESSAGE_REACTION_ADD') {
      client.emit('messageReactionAdd', reaction, client.users.cache.get(packet.d.user_id));
    }
    if (packet.t === 'MESSAGE_REACTION_REMOVE') {
      client.emit('messageReactionRemove', reaction, client.users.cache.get(packet.d.user_id));
    }
  });
});


schedule.scheduleJob('0 0 */1 * * *', () => {postGameUpdates()});
/*
                *    *    *    *    *    *
                ┬    ┬    ┬    ┬    ┬    ┬
                │    │    │    │    │    |
                │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
                │    │    │    │    └───── month (1 - 12)
                │    │    │    └────────── day of month (1 - 31)
                │    │    └─────────────── hour (0 - 23)
                │    └──────────────────── minute (0 - 59)
                └───────────────────────── second (0 - 59, OPTIONAL)
*/
client.login(TOKEN);
