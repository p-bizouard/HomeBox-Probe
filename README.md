# HomeBox UI

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
        port: 17
  },
  // temperatureHumiditysensor: {
  //       type: 'bme280'
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
  }
};

```
