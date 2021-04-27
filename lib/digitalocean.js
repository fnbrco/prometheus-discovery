const DigitalOceanClient = require('do-wrapper').default;

class DigitalOcean {

    constructor() {
        this.doclient = new DigitalOceanClient(config.prometheus.do_token);
    }

    /**
     * Get droplets matching a given tag
     * 
     * @param {String} tag The droplet tag to search by
     * @param {String} networkType The type of network to obtain ip from
     * @return {Promise}
     */
    getDroplets(tag, networkType) {
        return new Promise((resolve, reject) => {
            let servers = [];

            // Get all droplets matching tag from digitalocean api
            this.doclient.droplets.getAll(tag, true).then((allDroplets) => {
                // Loop through the droplets returned
                allDroplets.forEach((droplet) => {
                    // Check that the droplet has the correct tag
                    if(droplet.tags.indexOf(tag) < 0) {
                        console.log('[DO] Ignoring ' + droplet.name + ', DO API caught it but missing tag ' + tag);
                    } else {
                        // Get the IPv4 addresses assigned matching networkType (can be private or public)
                        let v4 = droplet.networks.v4.filter((n) => n.type == networkType);

                        // Get the first IPv4 assigned
                        if(v4.length > 0) {
                            servers.push({ip: v4[0].ip_address, name: droplet.name, id: droplet.id, region: droplet.region.slug});
                        }
                    }
                });

                // Pass back the servers matching criteria
                return resolve(servers);
            }).catch((err) => {
                console.error('[DO] Error while fetching droplets matching tag: ' + tag, err);
                return reject(err);
            });
        });
    }

}

module.exports = new DigitalOcean();
