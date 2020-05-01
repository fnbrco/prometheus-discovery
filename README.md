# prometheus-discovery
Service to discover active web servers for [Prometheus](https://prometheus.io) scraping

## How does this work?
This is a service to listen for 'events' to signify when servers have been added or removed from the active cluster.  
When this happens a request is sent to [DigitalOcean](https://developers.digitalocean.com/documentation/v2/)'s API to get a list of droplets with the tag defined in the config.  

Once this has happened a `targets.json` (name can be customised in config) file is written in [a format Prometheus understands](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#file_sd_config) and will automatically notice changes and begin scraping those nodes for data with the criteria defined for that prometheus instance, such as scrape path and interval.

## Triggering
This service is triggered via a web request sent to `/trigger` with either the header `webhook-key` or GET parameter `key`. The request must use a valid webhook key defined in `config.webhookKeys`.  
For example:
```
curl http://localhost:5001/trigger?key=super-strong-auth-key-here
```  
Or with a header:
```
curl -H "webhook-key: super-strong-auth-key-here" http://localhost:5001/trigger
```

This approach allows both internal & external monitoring tools to trigger a rewrite.  

## Config
This service can be configured to fetch more than one 'group' of servers and attach labels (used in Prometheus queries) relevant to them, for example: region or role.  
It also allows for multiple 'webhook keys' to allow more than one external service to trigger a rewrite of the targets file.

See [config/config.default.js](https://github.com/fnbrco/prometheus-discovery/blob/master/config/config.default.js) for an example config file, without any API credentials.

### Config: File Mode
The service can be configured to write targets within tags to separate files or all into one master file. This can be useful depending on the deployment setting, for example if you are using a `proxy_url` within Prometheus for some of your targets (as is the case with [PushProx](https://github.com/RobustPerception/PushProx)).  
If using `single` mode the `outputFileName` value does not need to be set for each tag section, as the `outputFileName` of the first tag will be used. If using `multi` mode there *must* be a file name for each tag.  

**Config key:** `config.prometheus.fileMode`  
**Available config options:** `single` or `multi`

### Config: Network & Key Type
You can decide on a per-tag basis the type of IPv4 address that is obtained from a droplet.  

**Config key:** `config.prometheus.searchTags.$.network`  
**Available config options:** `public` or `private`

Additionally you can decide whether the IP address or droplet name is used in the target string. This is useful in certain usecases such as when using [PushProx](https://github.com/RobustPerception/PushProx) which uses hostname resolution.  

**Config key:** `config.prometheus.searchTags.$.keyType`  
**Available config options:** `ip` or `name`

