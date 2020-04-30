const rfr = require('rfr');

(async () => {
    await rfr('lib/config-wrapper').read();

    if(typeof global.config == 'undefined') {
        return;
    }

    if(!config.prometheus) {
        console.error('Config is missing prometheus object');
        return;
    }

    if(!config.prometheus.do_token) {
        console.error('Config is missing digitalocean token');
        return;
    }

    rfr('server');
})();
