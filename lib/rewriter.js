const rfr = require('rfr');
const digitalocean = rfr('lib/digitalocean');
const fs = require('fs');
const path = require('path');

class FileRewriter {

    trigger() {
        return new Promise(async (resolve, reject) => {
            console.log('[FW] Rewrite triggered, fetching droplets..');

            var searchTags = config.prometheus.searchTags;
            var error = false;

            for (const tagObject of searchTags) {
                if(!error) {
                    try {
                        const result = await this.processTag(tagObject);

                        if(result) {
                            // Write generated JSON in a 'pretty' format if manual changes are wanted
                            await this.promiseWriteFile(path.join(process.cwd(), tagObject.outputFileName), JSON.stringify([result], null, 4), 'utf8');
                        } else {
                            error = { status: 500, error: 'Internal Server Error', errorMessage: 'Unable to process search tag: ' + tagObject.tag };
                        }
                    } catch(e) {
                        console.error('[FW] Rewrite failed at ' + tagObject.tag, e);
                        error = e;
                    }
                }
            }

            if(error) {
                return reject(error);
            }

            console.log('[FW] Rewrite complete');
            return resolve({ status: 200, message: 'Rewrite complete' });
        });
    }

    processTag(tagObject) {
        return new Promise((resolve, reject) => {
            digitalocean.getDroplets(tagObject.tag, tagObject.network).then((droplets) => {
                if(droplets.length <= 0) {
                    return reject({status: 404, error: 'Not Found', errorMessage: 'No droplets found with tag: ' + tagObject.tag});
                }

                var out = {
                    targets: [],
                    labels: tagObject.labels
                };

                for(const droplet of droplets) {
                    if(tagObject.keyType == 'ip') {
                        out.targets.push(droplet.ip + ':' + tagObject.scrapePort);
                    } else if(tagObject.keyType == 'name') {
                        out.targets.push(droplet.name + ':' + tagObject.scrapePort);
                    }
                }

                return out.targets.length > 0 ? resolve(out) : reject({status: 500, error: 'Internal Server Error', errorMessage: 'No targets could be identified, config may be malformed'});
            }).catch((dropletErr) => {
                console.error('[FW] Unable to fetch droplets for tag: ' + tagObject.tag, dropletErr);
                return reject({status: 500, error: 'Internal Server Error', errorMessage: 'Unable to fetch droplets matching tag: ' + tagObject.tag});
            });
        });
    }

    // Could replace with fs.promises
    promiseWriteFile(targetFile, content, options) {
        return new Promise((resolve, reject) => {
            fs.writeFile(targetFile, content, options, (writeError) => {
                if(writeError) {
                    console.error('[FW] Unable to update ' + outputFileName, writeError);
                    return reject({status: 500, error: 'Internal Server Error', errorMessage: 'Unable to update ' + outputFileName});
                }

                return resolve();
            });
        });
    }

}

module.exports = new FileRewriter();
