const http = require('http');
const JSSoup = require('jssoup').default;
const request = require('request');
const textVersion = require("textversionjs");
const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');
const PORT = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});


function removeDuplicates(data){
  return data.filter((value, index) => data.indexOf(value) === index);
}

function read(path) {
  try{
    const fileContent = fs.readFileSync(path);
    const array = JSON.parse(fileContent);
    return array;
  }
  catch{
    const array = [];
    return array;
  }
}

function write(array, path) {
    fs.writeFileSync(path, JSON.stringify(array));
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
  run: async (client, chn) => {
    const targetChannel = chn;
    request('https://forum.starbasegame.com/forums/early-access-announcements.47/', async (
      error,
      response,
      body
    )=>{
      const soup = new JSSoup(body);
      //Get all <a> elements and their tags from html
      let href = soup.findAll('a').map(t => t.toString());
      let links = [];

      let itemToRemove = href.find(a => a.includes("/page"));
      href = removeItemAll(href, itemToRemove);


      href.forEach(item => {
        //Get href links that contain update, but not latest or page
        if (item.includes("update") && !((item.includes("latest")) || (item.includes("page")))){
          links.push(`https://forum.starbasegame.com${(item.split('href="').pop().split('"')[0])}`);
        }
        else return;
      });
      let linksToBePosted = [];

      const postedLinks = await read(path.join(__dirname, '../../Data/starbase_updates.json'));
      linksToBePosted = await removeDuplicates(links).filter( ( element ) => !postedLinks.includes( element ) );

      if(linksToBePosted.length == 0){
        return;
      }
      else{
        write(removeDuplicates(links), path.join(__dirname, '../../Data/starbase_updates.json'));
        const revLinks = linksToBePosted.reverse();
        let itemsProcessed = 0;
        let updateObjects = [];

        revLinks.forEach(item => {
          request(item, async (
            error,
            response,
            body
          )=>{

            //Deconstruct website for data used in embedded message
            let updateData = {};
            let soup = new JSSoup(body);
            const div = soup.findAll('div', {class:'bbWrapper'}).map(t => t.toString());
            const title = soup.findAll('h1', {class:'p-title-value'}).map(t => t.toString());

            soup = new JSSoup(div[0]);
            const image = soup.findAll('img', {class:'bbImage'}).map(t => t.toString());
            const text1 = soup.findAll('b').map(t => t.toString());

            updateData.title = title[0].split('">').pop().split('</h1>')[0];
            updateData.url = item;

            if (image.length != 0){
              updateData.img = image[0].split('src="').pop().split('"')[0];
            }

            const htmlText = textVersion(div[0]).replace(/&quot;/g, '"').replace('&gt;', '>').replace(/---/g, '─').replace(/\[:.*/, '');
            const tempArr = htmlText.split(/(\r\n|\n|\r)/gm);

            let mainArr = removeItemAll(tempArr, '\n');

            //Remove not needed items
            mainArr = removeItemAll(mainArr, '');
            mainArr = removeItemAll(mainArr, mainArr.find(a => a.includes("https://forum.starbasegame.com/attachments/")));
            mainArr = removeItemAll(mainArr, mainArr.find(a => a.includes("png")));
            mainArr = removeItemAll(mainArr, mainArr.find(a => a.includes("jpg")));

            let tempArr2 = [];
            let MoreText = false;

            //If text too long reduce array size and add url
            while ((tempArr2.length > 1900) || (tempArr2.length == 0)) {
              tempArr2 = []
              mainArr.forEach(item => {
                const str = item.split('');
                tempArr2.push(...str);
              });
              if (tempArr2.length > 1900) {
                mainArr.splice(mainArr.length-1, 1);
                MoreText = true;
              }
            }

            if (MoreText == true) {
              mainArr.push(`\nRead more at:\n${item}`)
            }

            updateData.mainText = mainArr;

            itemsProcessed++;
            await updateObjects.push(updateData);

            //Post updates to discord server
            if(itemsProcessed === revLinks.length) {
              const func = client.basicFunctions.get("getFromConfig");

              let guild;
              await func.run(null, "guild", async (response) => {
                guild = await client.guilds.cache.get(response);
              });
              const updatesChannel = await guild.channels.cache.get(targetChannel);

              updateObjects.forEach(async (item) => {
                let image;
                if (item.hasOwnProperty('img')) {
                  image = item.img;
                }
                else{
                  image = null;
                }

                const UpdateEmbed = new Discord.MessageEmbed()
                .setColor('#bb018a')
                .setTitle(item.title)
                .setURL(item.url)
                .setThumbnail('https://www.starbasegame.com/img/sb_logo_small.png')
                .setFooter(item.mainText)
                .setImage(image)

                await updatesChannel.send(UpdateEmbed);
              });
            }
          });
        });
      }
    });
  },


  help: {
    name: ("starbaseUpdates")
  }
}
