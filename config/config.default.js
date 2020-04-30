var config = {};

// Array of valid 'keys' to authenticate incoming webhooks
config.webhookKeys = [
];

config.prometheus = {
    // API Token to access DigitalOcean API
    do_token: '',
    // Tag list to look for droplets
    searchTags: [
        {
            // Tag to use
            tag: 'prod-web-nyc',
            // Network type to use to obtain ipv4 (public/private)
            network: 'private',
            // Whether the IP address or droplet name should be used in the target (useful if using pushprox)
            keyType: 'ip',
            // Prometheus labels to apply to all 'found' servers
            labels: {
                region: 'nyc'
            },
            // Chosen port where prometheus metrics are exposed - to be appended to the IP address
            scrapePort: '5001',
            // The name of the generated file
            outputFileName: 'targets.json'
        },
        {
            tag: 'prod-web-ams',
            network: 'public',
            keyType: 'name',
            labels: {
                region: 'ams',
                group: 'web_remote'
            },
            scrapePort: '5001',
            outputFileName: 'targets_ams.json'
        },
        {
            tag: 'prod-web-sfo',
            network: 'public',
            keyType: 'name',
            labels: {
                region: 'sfo',
                group: 'web_remote'
            },
            scrapePort: '5001',
            outputFileName: 'targets_sfo.json'
        }
    ]
};

module.exports = config;
