async = require('async');
rcswitch = require("rcswitch");
var sys = require('sys')
var exec = require('child_process').exec;

var GoogleHomePlayer = require('google-home-player');

const TuyAPI = require('tuyapi');
const miio = require('miio');

const dehumidifierDevice = new TuyAPI(sails.config.dehumidifierDevice);

const lampDevice = 4;
const noelDevice = 3;

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
      soft = '/home/pi/dht-adafruit.py 22 4';
    else
      return ;

    console.log('Execute : ', soft);
    child = exec(soft, function (error, stdout, stderr) {
      if (error !== null)
        console.log('exec error: ' + error);
      res.send(stdout);
    });
  },
  plugStatus: function(req, res) {
    if (req.param('device') == 'dehumidifier')
      device = dehumidifierDevice;

    device.get().then(status => {
      res.send({'status': status});
    });
  },
  plugStatusChange: function(req, res) {
    if (req.param('device') == 'dehumidifier')
      device = dehumidifierDevice;

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
//      console.log('Connected to', device);

      var soft = '/usr/local/bin/mirobo --ip ' + sails.config.vacuumDevice.ip + ' --token ' + sails.config.miioToken + ' ' + (status ? 'start' : 'home');
      child = exec(soft, async function (error, stdout, stderr) {
        if (error)
          console.log(error);
        if (stderr)
          console.log(stderr);

        if ((status && stdout.includes('Starting cleaning')) || (!status && stdout.includes('return to home')))
          res.send({'status': true});
        else
          res.send({'status': false});

        //console.log(stdout);
      });
    })
    .catch(console.error);
  },
  vacuumStatus: async function(req, res) {
    miio.device(sails.config.vacuumDevice)
    .then(async function(device) {
      console.log('Connected to', device);
      const isCleaning = await device.cleaning();
      res.send({'status': isCleaning});
    })
    .catch(console.error);
  },
  rf433StatusChange: function(req, res) {
    rcswitch.enableTransmit(sails.config.switchDevice.pin);

    if (req.param('device') == 'lamp')
      device = lampDevice;
    else if (req.param('device') == 'noel')
      device = noelDevice;

    if (req.param('status') == 'on')
      rcswitch.switchOn(sails.config.switchDevice.code, device);
    else
      rcswitch.switchOff(sails.config.switchDevice.code, device);
    console.log("Switch " + req.param('status') + " " + sails.config.switchDevice.code + " " + device);
    res.send({'status': req.param('status') == 'on'});
  },
  ping: function(req, res) {
    var hosts;
    hosts = req.param('hosts');

    child = exec("sudo arp-scan --localnet", function (error, stdout, stderr) {
      if (error !== null)
        console.log('exec error: ' + error);
      console.log(stdout);

      async.map(hosts, (function(host, callback) {
        var regex = RegExp(host.replace('.', '\.'),'gm');
        callback(null, {'host': host, ping: regex.test(stdout) });
      }), function(err, results) {
        res.send(results);
      });
    });
  }
};
