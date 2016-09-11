var locks = require('locks');
var request = require('request');

var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-tosr0x-fan', 'TOSR0x Fan', FanAccessory);
};

function FanAccessory(log, config) {
  this.log = log;

  this.host = config.host;
  this.name = config.name;

  this.state = {
    power: false,
    speed: 25,
  };
  this.mutex = locks.createMutex()
}

FanAccessory.prototype.getRelays = function(callback) {
  request({
    url: 'http://' + this.host + '/status',
    json: true,
  }, function(error, response, body) {
    if (error) {
      callback(error);
    } else if (response.statusCode == 200) {
      callback(null, body);
    } else {
      callback(new Error('HTTP response ' + response.statusCode + ': ' + JSON.stringify(body)));
    }
  });
};

FanAccessory.prototype.updateRelays = function(value, callback) {
  request({
    url: 'http://' + this.host + '/update',
    method: 'POST',
    json: true,
    body: value,
  }, function(error, response, body) {
    if (error) {
      callback(error);
    } else if (response.statusCode == 204) {
      callback(null);
    } else {
      callback(new Error('HTTP response ' + response.statusCode + ': ' + JSON.stringify(body)));
    }
  });
};

FanAccessory.prototype.getFanState = function(callback) {
  this.getRelays((error, data) => {
    if (error) {
      callback(error);
    } else {
      var state = {}
      if (data.states[3]) {
        state.power = true;
        state.speed = 100;
      } else if (data.states[2]) {
        state.power = true;
        state.speed = 50;
      } else if (data.states[1]) {
        state.power = true;
        state.speed = 25;
      } else {
        state.power = false;
        state.speed = 25;
      }
      state.temperature = data.temperature;

      this.state = state;
      callback(null, state);
    }
  });
};

FanAccessory.prototype.setFanState = function(state, callback) {
  var relay;
  if (state.power && state.speed > 50) {
    relay = 3;
  } else if (state.power && state.speed > 25) {
    relay = 2;
  } else if (state.power && state.speed > 0) {
    relay = 1;
  } else {
    relay = null;
  }

  this.log('active relay ' + relay);

  var update1 = {
  };
  if (relay) {
    update1[relay] = true;
  }

  var update2 = {
    1: false,
    2: false,
    3: false,
  };
  if (relay) {
    delete update2[relay];
  }

  this.mutex.timedLock(5000, (error) => {
    if (error) {
      callback(error);
      return;
    }

    this.updateRelays(update1, (error) => {
      if (error) {
        this.mutex.unlock();
        callback(error);
        return;
      }

      this.updateRelays(update2, (error) => {
        this.mutex.unlock();
        callback(error);
        return;
      });
    });
  });
}

FanAccessory.prototype.identify = function(callback) {
  this.log("Identify requested!");
  this.updateRelays({4: true}, (error) => {
    if (error) {
      callback(error);
      return;
    }
    setTimeout(() => {
      this.updateRelays({4: false}, callback);
    }, 500);
  });
};

FanAccessory.prototype.getServices = function() {
  this.fanService = new Service.Fan();
  this.fanService.getCharacteristic(Characteristic.On)
    .on('get', this.getOn.bind(this))
    .on('set', this.setOn.bind(this));
  this.fanService.getCharacteristic(Characteristic.RotationSpeed)
    .setProps({
      minValue: 0,
      maxValue: 100,
      minStep: 25,
    })
    .on('get', this.getSpeed.bind(this))
    .on('set', this.setSpeed.bind(this));

  this.temperatureService = new Service.TemperatureSensor();
  this.temperatureService.getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getTemperature.bind(this));

  return [this.fanService, this.temperatureService];
};

FanAccessory.prototype.getTemperature = function(callback) {
  this.getFanState(function(error, state) {
    callback(null, state && state.temperature);
  });
};

FanAccessory.prototype.getOn = function(callback) {
  this.getFanState(function(error, state) {
    callback(null, state && state.power);
  });
};

FanAccessory.prototype.setOn = function(value, callback) {
  if (this.state.power != value) {
    this.log('setting power to ' + value);
    this.state.power = value;
    this.setFanState(this.state, callback);
  } else {
    callback(null);
  }
};

FanAccessory.prototype.getSpeed = function(callback) {
  this.getFanState(function(error, state) {
    callback(null, state && state.speed);
  });
};

FanAccessory.prototype.setSpeed = function(value, callback) {
  if (this.state.speed != value) {
    this.log('setting speed to ' + value);
    this.state.speed = value;
    this.setFanState(this.state, callback);
  } else {
    callback(null);
  }
};
