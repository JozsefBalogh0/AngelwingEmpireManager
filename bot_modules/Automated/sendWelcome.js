const Discord = require('discord.js');


//Ban Command
module.exports = {
  run: async (client, member) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    let rulesChannel;
    let systemChannel;

    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });
    await func.run("Channels", "rulesChannel", async (response) => {
      rulesChannel = await guild.channels.cache.get(response);
    });
    await func.run("Channels", "joinAndLeaveChannel", async (response) => {
      systemChannel = await guild.channels.cache.get(response);
    });

    const memberData = await client.users.fetch(member.id);

    const welcomeMessages = [`${memberData.username} Welcome to the Angelwing Empire Discord Server!\nPlease make sure to read the ${rulesChannel}.`,
                             `Welcome to the Angelwing Empire Company, ${memberData.username}.\nMake sure to read the ${rulesChannel}.`,
                             `Greetings, ${memberData.username}!\nPlease make sure to read the ${rulesChannel}.`,
                             `Hello my friend, stay awhile and listen!\nTake a look at the ${rulesChannel}.`,
                             `It's dangerous to go alone, take this!\n${rulesChannel}`,
                           ];

    const randomArray = (array) => {
      const Choice = (array[Math.floor(Math.random()*array.length)]);
      return Choice;
    }

    let memberCount = 0;

    await guild.members.fetch().then(async (members) => {
      await members.forEach(async (member) => {
        memberCount++;
      });
    });

    //Construct Embeded message
    const WelcomeEmbed = new Discord.MessageEmbed()
  	.setColor('#bb018a')
  	.setTitle(`${memberData.username} Joined`)
  	.setDescription(randomArray(welcomeMessages))
  	.setTimestamp()
  	.setFooter(`Total server members: ${memberCount}`);

    await systemChannel.send(WelcomeEmbed);
  },


  help: {
    name: ("sendWelcome")
  }
}
