const Discord = require('discord.js');



module.exports = {
  run: async (client, msg, message, allCommands, user, member) => {
    const func = client.basicFunctions.get("getFromConfig");

    let guild;
    let targetChannel;
    let leadershipChannel;

    await func.run(null, "guild", async (response) => {
      guild = await client.guilds.cache.get(response);
    });
    //Get aboutChannel by default
    await func.run("Channels", "aboutChannel", async (response) => {
      targetChannel = await guild.channels.cache.get(response);
    });
    //Get Leadership Channel
    await func.run("Channels", "leadershipChannel", async (response) => {
      leaderShipChannel = await guild.channels.cache.get(response);
    });

    await message.delete();

    //If command is in leadership, send there, otherwise send it in about
    if (message.channel.id == leaderShipChannel.id) {
      targetChannel = await guild.channels.cache.get(message.channel.id);
    }

    const messagesArray =
    [
      //Forum
      [
        //color
        "#bb018a",
        //Title
        "Company forum page",
        //Description
        "",
        //Footer
        "A wise king knows what he knows and what he doesn’t. You’re young. A wise young king listens to his councilors and heeds their advice until he comes of age. And the wisest kings continue to listen to them long afterwards.\n-Tywin Lannister",
        //Thumbnail
        "",
        //Image
        "https://forum.starbasegame.com/attachments/angelwing-logo-gold-2-png.3309/",
        //URL
        "https://forum.starbasegame.com/threads/angelwing-empire.2105/#post-17224"
      ],

      //Recruit
      [
        //color
        "#f5c21d",
        //Title
        "Recruit",
        //Description
        "Recruits are new members who wish to join our cause. They have limited access and must find themselves a squad to join asap.",
        //Footer
        "",
        //Thumbnail
        "https://imgur.com/e0VxIGY.png",
        //Image
        "",
        //URL
        ""
      ],

      //Trainee
      [
        //color
        "#f14343",
        //Title
        "Trainee",
        //Description
        "If a recruit is accepted into a squad, he becomes a trainee. Still not a full member of the squad, he is on trial to see if he likes the squad or finds a more suitable one for himself.",
        //Footer
        "",
        //Thumbnail
        "https://imgur.com/e0VxIGY.png",
        //Image
        "",
        //URL
        ""
      ],

      //Member
      [
        //color
        "#4aff88",
        //Title
        "Member",
        //Description
        "Once fully accepted into a squad, the trainee becomes a member. The members are the backbone of the empire, they do all the physical tasks such as mining, hauling, pulling triggers, etc.",
        //Footer
        "",
        //Thumbnail
        "https://imgur.com/O7SxG2K.png",
        //Image
        "",
        //URL
        ""
      ],

      //Squad Leader
      [
        //color
        "#00ddff",
        //Title
        "Squad Leader",
        //Description
        "Squad Leaders are the first line of officers, they take care of the members within their squads, ensuring their wellbeing and development. They coordinate group tasks for the growth of every member of the empire.",
        //Footer
        "",
        //Thumbnail
        "https://imgur.com/ygIePDn.png",
        //Image
        "",
        //URL
        ""
      ],

      //Fleet Commander
      [
        //color
        "#0090ff",
        //Title
        "Fleet Commander",
        //Description
        "Fleet Commanders are skilled officers recruited from the best Squad Leaders, their ability in dealing with people is what makes them be at this position. Their job is to coordinate all the squads under their command to work together driving the faction towards success.",
        //Footer
        "",
        //Thumbnail
        "https://i.imgur.com/0YAzWRF.png",
        //Image
        "",
        //URL
        ""
      ]
    ]


    await messagesArray.forEach(async (item) => {
      let messageEmbed = new Discord.MessageEmbed()
      .setColor(item[0])
      .setTitle(item[1])
      .setDescription(item[2])
      .setFooter(item[3])
      .setThumbnail(item[4])
      .setImage(item[5])
      .setURL(item[6])
      await targetChannel.send(messageEmbed);
    });
  },


  help: {
    name: ("sendabout"),
    description: ("Send information about the company"),
    example: ("!sendabout"),
    tag: ("Admin")
  }
}
