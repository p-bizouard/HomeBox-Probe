const async = require('async');
const rcswitch = require("rcswitch");
var sys = require('sys')
var exec = require('child_process').exec;
var ip = require('ip');
var GoogleHomePlayer = require('google-home-player');
const awaitExec = require('await-exec');
const TuyAPI = require('tuyapi');
const miio = require('miio');
var sleep = require('sleep');
var median = require('median')

module.exports = {
  home: function(req, res) {
    res.status(404);
    return res.send('File not found');
  },
  sensors: async function(req, res) {
    var soft = '';

    if (sails.config.temperatureHumiditysensor.type == 'bme280')
      soft = '/home/pi/bme280-adafruit.py';
    else if (sails.config.temperatureHumiditysensor.type == 'dht')
      soft = '/home/pi/dht-adafruit.py ' + sails.config.temperatureHumiditysensor.version + ' ' + sails.config.temperatureHumiditysensor.port;
    else
      return ;

    if (!sails.config.temperatureHumiditysensor.hasOwnProperty('temperatureCalibration'))
      sails.config.temperatureHumiditysensor.temperatureCalibration = 0;
    if (!sails.config.temperatureHumiditysensor.hasOwnProperty('humidityCalibration'))
      sails.config.temperatureHumiditysensor.humidityCalibration = 0;

    var temperatureArray = [];
    var humidityArray = [];
    for (let i = 0; i < 6; i++)
    {
      var result = await awaitExec(soft);
      if (result.stderr) continue ;
      result = JSON.parse(result.stdout.replace('\n', ''));
      
      temperature = parseFloat(result.temperature) + parseFloat(sails.config.temperatureHumiditysensor.temperatureCalibration);
      humidity = parseFloat(result.humidity) + parseFloat(sails.config.temperatureHumiditysensor.humidityCalibration); 

      temperatureArray.push(temperature);
      humidityArray.push(humidity);

      sleep.sleep(1);
    }
      
    res.send(JSON.stringify({
      temperature: Math.round(median(temperatureArray) * 10) / 10,
      humidity: Math.round(median(humidityArray) * 10) / 10,
    }));
  },
  plugDeviceStatus: function(req, res) {
    if (!sails.config.plugDevices.hasOwnProperty(req.param('device')))
    {
      res.send({'status': 'error'});
      sails.log.error('Plug device [' + req.param('device') + ']  not found');
      return ;
    }

    device = new TuyAPI(sails.config.plugDevices[req.param('device')]);

    device.get().then(status => {
      res.send({'status': status});
    });
  },
  plugDeviceStatusChange: function(req, res) {
    if (!sails.config.plugDevices.hasOwnProperty(req.param('device')))
    {
      res.send({'status': 'error'});
      sails.log.error('Plug device [' + req.param('device') + ']  not found');
      return ;
    }

    device = new TuyAPI(sails.config.plugDevices[req.param('device')]);

    device.set({set: req.param('status') == 'on'}).then(result => {
      device.get().then(status => {
        res.send({'status': status});
      });
    });
  },
  googleHomeSay: async function(req, res) {
    var googleHome = new GoogleHomePlayer(sails.config.googleHomeDevice.ip, sails.config.googleHomeDevice.lang, 1);
    googleHome.say(req.param('say')).catch(console.error);
    res.send({'status': true});
  },
  vacuumStatusChange: async function(req, res) {
    if (req.param('status') == 'on')
      status = true;
    else
      status = false;

    miio.device(sails.config.vacuumDevice)
    .then(async function(device) {
      await device.clean();
      const isCleaning = await device.cleaning();
      console.log("Vacuum status set to " + req.param('status'));
      res.send({'status': isCleaning});
    })
    .catch(console.error);
  },
  vacuumStatus: async function(req, res) {
    miio.device(sails.config.vacuumDevice)
    .then(async function(device) {
      const isCleaning = await device.cleaning();
      res.send({'status': isCleaning});
    })
    .catch(console.error);
  },
  xiaomiSensorStatus: async function(req, res) {
    miio.device(sails.config.xiaomiDevices)
    .then(async function(device) {
    
      var sensorDeviceConfiguration = sails.config.xiaomiDevices.devices[req.param('device')];
      const children = device.children();

      if (!sensorDeviceConfiguration.hasOwnProperty('temperatureCalibration'))
        sensorDeviceConfiguration.temperatureCalibration = 0;
      if (!sensorDeviceConfiguration.hasOwnProperty('humidityCalibration'))
        sensorDeviceConfiguration.humidityCalibration = 0;

      for(const child of children) {
        if (child.matches('type:miio:subdevice') && child.matches('cap:temperature') && child.internalId == sensorDeviceConfiguration.id) {

          const temperature = Math.round(((await child.temperature()).value + parseFloat(sensorDeviceConfiguration.temperatureCalibration)) * 10) / 10;
          const humidity = Math.round(((await child.relativeHumidity()) + parseFloat(sensorDeviceConfiguration.humidityCalibration)) * 10) / 10;

          res.send(JSON.stringify({
            temperature: temperature,
            humidity: humidity,
          }));
          return ;
        }
      }
      res.send({'status': false});
    })
    .catch(console.error);
  },
  rf433StatusChange: function(req, res) {
    rcswitch.enableTransmit(sails.config.switchDevice.pin);
    const device = sails.config.switchDevice.devices[req.param('device')];

    if (req.param('status') == 'on')
      rcswitch.switchOn(sails.config.switchDevice.code, device);
    else
      rcswitch.switchOff(sails.config.switchDevice.code, device);
    console.log("Switch " + req.param('status') + " " + sails.config.switchDevice.code + " " + device);
    res.send({'status': req.param('status') == 'on'});
  },
  ping: function(req, res) {
    var hosts = req.param('hosts');
    var mask = 24;
    var currentNetwork = ip.mask(ip.address(), ip.fromPrefixLen(24));

    child = exec("sudo nmap -sP " + currentNetwork + "/" + mask + " ; sudo arp-scan --localnet ; sudo nmap -sP " + currentNetwork + "/" + mask, function (error, stdout, stderr) {
      if (error !== null)
      {
        console.log('NMAP & ARP-SCAN error : ', error);
        res.send({'status': 'error'});
        return false;
      }

      async.map(hosts, (function(host, callback) {
        var regex = RegExp(host.replace('.', '\.'),'gm');
        callback(null, {'host': host, ping: regex.test(stdout) });
      }), function(err, results) {
        res.send(results);
      });
    });
  }
};
