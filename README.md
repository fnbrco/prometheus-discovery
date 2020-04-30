# prometheus-discovery
Service to discover active web servers for [prometheus](https://prometheus.io) scraping

## How does this work?
This is a service to listen for 'events' to signify when servers have been added or removed from the active cluster.  
When this happens a request is sent to [DigitalOcean](https://developers.digitalocean.com/documentation/v2/)'s API to get a list of droplets with the tag defined in the config.  

Once this has happened a `targets.json` (name can be customised in config) file is written in [a format prometheus understands](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#file_sd_config) and will automatically notice changes and begin scraping those nodes for data with the criteria defined for that prometheus instance, such as scrape path and interval.

## Config
This service can be configured to fetch more than one 'group' of servers and attach labels (used in prometheus queries) relevant to them, for example: region or role.  
It also allows for multiple 'webhook keys' to allow more than one external service to trigger a rewrite of the targets file.

See [config/config.default.js](https://github.com/fnbrco/prometheus-discovery/blob/master/config/config.default.js) for an example config file, without any API credentials.
