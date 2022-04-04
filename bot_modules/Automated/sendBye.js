const Discord = require('discord.js');


//Ban Command
module.exports = {
  run: async (client, member) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    let systemChannel;

    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });
    await func.run("Channels", "joinAndLeaveChannel", async (response) => {
      systemChannel = await guild.channels.cache.get(response);
    });

    const memberData = await client.users.fetch(member.id);

    const byeMessages = [`**${memberData.username}#${memberData.discriminator}** Has left the Company.`,
                         `**${memberData.username}#${memberData.discriminator}** lost their wings.`,
                         `Godspeed, ${memberData.username}!`,
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
    const LeaveEmbed = new Discord.MessageEmbed()
  	.setColor('#FF0000')
  	.setTitle(`${memberData.username} Left`)
  	.setDescription(randomArray(byeMessages))
  	.setTimestamp()
  	.setFooter(`Total server members: ${memberCount}`);

    await systemChannel.send(LeaveEmbed);
  },


  help: {
    name: ("sendBye")
  }
}
