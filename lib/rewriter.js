const rfr = require('rfr');
const digitalocean = rfr('lib/digitalocean');
const fs = require('fs');
const path = require('path');

class FileRewriter {

    trigger() {
        return new Promise(async (resolve, reject) => {
            console.log('[FW] Rewrite triggered, fetching droplets..');

            var searchTags = config.prometheus.searchTags;
            var fileMode = config.prometheus.fileMode;
            var error = false;
            var fileOutput = [];

            if(searchTags.length <= 0) {
                console.error('[FW] Rewrite failed because no search tags are defined');
                return reject({ status: 400, error: 'Bad Request', errorMessage: 'No search tags defined' });
            }

            for (const tagObject of searchTags) {
                if(fileMode == 'multi' && !tagObject.outputFileName) {
                    console.error('[FW] Rewrite failed because "outputFileName" is missing for tag "' + tagObject.tag + '" while in multi file mode.');
                    error = { status: 400, error: 'Bad Request', errorMessage: 'Invalid config in multi mode, tag "' + tagObject.tag + '" did not contain outputFileName' }
                    return;
                }

                if(!error) {
                    try {
                        const result = await this.processTag(tagObject);

                        if(result) {
                            // In 'multi' file mode, put each tag result into a separate file
                            if(fileMode == 'multi') {
                                // Write generated JSON in a 'pretty' format if manual changes are wanted
                                await this.promiseWriteFile(path.join(process.cwd(), tagObject.outputFileName), JSON.stringify(result.allowEmpty ? [] : [result], null, 4), 'utf8');
                            } else if(!result.allowEmpty) {
                                fileOutput.push(result);
                            }
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

            // In 'single' file mode, put all tags into one file
            if(fileMode == 'single') {
                return this.promiseWriteFile(path.join(process.cwd(), searchTags[0].outputFileName), JSON.stringify(fileOutput, null, 4), 'utf8').then(() => {
                    console.log('[FW] Rewrite complete: single mode');
                    return resolve({ status: 200, message: 'Rewrite complete' });
                }).catch((writeErr) => reject(writeErr));
            }

            console.log('[FW] Rewrite complete: multi mode');
            return resolve({ status: 200, message: 'Rewrite complete' });
        });
    }

    processTag(tagObject) {
        return new Promise((resolve, reject) => {
            digitalocean.getDroplets(tagObject.tag, tagObject.network).then((droplets) => {
                if(droplets.length <= 0) {
                    return tagObject.allowEmpty ? resolve({targets: [], allowEmpty: true}) : reject({status: 404, error: 'Not Found', errorMessage: 'No droplets found with tag: ' + tagObject.tag});
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
