const config = require('../../Data/config.json')

module.exports = {
  run: async (category, dataToGet, callback) => {
    const configMap = await new Map(Object.entries(config[0]))
    const configKeys = await Object.keys(config[0])

    let DevMode = false;
    let returned;
    //GENERAL DATA
    await configKeys.map(async (x) => {
      if (x == "DATA") {
        await configMap.get(x).map(async (y) => {
          if (category == null) {
            returned = await y[dataToGet];
          }
          else {
            returned = await y[category][dataToGet];
          }
        });
      }
      else if (x == "DEV_MODE") {
        configMap.get(x).map(y => {
            if (y.enabled == "true") DevMode = true;
        });
      }
    });

    //DEV MODE DATA
    if (DevMode == true) {
      await configKeys.map(async (x) => {
        if (x == "DEV_MODE") {
          await configMap.get(x).map(async (y) => {
            if (category == null) {
              returned = await y[dataToGet];
            }
            else {
              returned = await y[category][dataToGet];
            }
          });
        }
      });
    }
    callback(returned);
  },


  help: {
    name: ("getFromConfig")
  }
}
