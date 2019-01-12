# HomeBox Probe

## Download
```bash
git clone https://github.com/p-bizouard/HomeBox-Probe.git
```

## Configure config/local.js
Pour rappel, ports WiringPi : https://fr.pinout.xyz/pinout/wiringpi
```js
module.exports = {
  port: 8081,
  temperatureHumiditysensor: {
    type: 'dht',
    version: 22,
    port: 4
  },
  // temperatureHumiditysensor: {
  //   type: 'bme280'
  // },
  
  // https://github.com/aholstenson/miio
  vacuumDevice: {
    address: '',
    token: ''
  },
  
  // https://github.com/codetheweb/tuyapi
  dehumidifierDevice: {
    id: '',
    key: '',
    ip: ''
  },
  
  // https://github.com/mihyaeru21/google-home-player
  googleHomeDevice: {
    ip: '',
    lang: 'fr',
  },
  
  // https://github.com/marvinroger/node-rcswitch
  switchDevice: {
    pin: 16,
    code: '11111',
    devices: {
      'nas' : 1,
      'lamp' : 4
    }
  }
};
```

## Todo
- [ ] Standardiser les "plugDevices" de tuyApi
- [ ] Option pour désactiver les webcam si au moins une personne à la maison
- [X] Récupération asynchrone des images webcam
