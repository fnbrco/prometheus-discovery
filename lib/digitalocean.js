var digitalocean = require('digitalocean');

class DigitalOcean {

    constructor() {
        this.doclient = digitalocean.client(config.prometheus.do_token);
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
            var servers = [];

            this.doclient.droplets.list({tag_name: tag}).each((droplet) => {
                if(droplet.tags.indexOf(tag) < 0) {
                    console.log('[DO] Ignoring ' + droplet.name + ', DO API caught it but missing tag ' + tag);
                } else {
                    var v4 = droplet.networks.v4.filter((n) => n.type == networkType);

                    // Get the first IP assigned
                    if(v4.length > 0) {
                        servers.push({ip: v4[0].ip_address, name: droplet.name, id: droplet.id, region: droplet.region.slug});
                    }
                }
            }).then(() => resolve(servers)).catch((err) => {
                console.error('[DO] Error while fetching droplets matching tag: ' + tag, err);
                reject(err);
            });
        });
    }

}

module.exports = new DigitalOcean();
