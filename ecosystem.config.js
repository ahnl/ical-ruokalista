module.exports = {
    apps : [{
      name: 'ical-ruokalista',
      script: 'main.js',
      env_hook: {
        command: 'pm2 pull ical-ruokalista'
      }
    }]
  };