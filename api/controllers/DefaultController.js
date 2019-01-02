async = require('async');
rcswitch = require("rcswitch");
var sys = require('sys')
var exec = require('child_process').exec;
var ip = require('ip');
var GoogleHomePlayer = require('google-home-player');

const TuyAPI = require('tuyapi');
const miio = require('miio');

module.exports = {
  home: function(req, res) {
    res.status(404);
    return res.send('File not found');
  },
  sensors: function(req, res) {
    var soft = '';

    if (sails.config.temperatureHumiditysensor.type == 'bme280')
      soft = '/home/pi/bme280-adafruit.py';
    else if (sails.config.temperatureHumiditysensor.type == 'dht')
      soft = '/home/pi/dht-adafruit.py ' + sails.config.temperatureHumiditysensor.version + ' ' + sails.config.temperatureHumiditysensor.port;
    else
      return ;

    child = exec(soft, function (error, stdout, stderr) {
      if (error !== null)
        console.log('exec error: ' + error);
      res.send(stdout);
    });
  },
  plugStatus: function(req, res) {
    if (req.param('device') == 'dehumidifier')
      device = new TuyAPI(sails.config.dehumidifierDevice);;

    device.get().then(status => {
      res.send({'status': status});
    });
  },
  plugStatusChange: function(req, res) {
    if (req.param('device') == 'dehumidifier')
      device = new TuyAPI(sails.config.dehumidifierDevice);;

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
