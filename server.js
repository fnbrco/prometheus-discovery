const rfr = require('rfr');
const restify = require('restify');
const server = restify.createServer();
const rewriter = rfr('lib/rewriter');

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

// Simple health check for monitoring systems
server.get('/_health', (req, res, next) => res.send(200, 'Alive', {'content-type' : 'text/plain'}));

// Endpoint to request target rewrite
server.get('/trigger', (req, res, next) => {
    if(req.query.key) {
        req.headers['webhook-key'] = req.query.key;
    }

    if(req.headers['webhook-key'] && config.webhookKeys.indexOf(req.headers['webhook-key']) >= 0) {
        rewriter.trigger().then((response) => res.json(response)).catch((error) => res.json(error.status, error));
    } else {
        res.send(401, {status: 401, error: 'Unauthorized', message: 'Invalid credentials provided.'});
    }
});

server.listen(process.env.PORT || 5001, () => console.log('Service started at ' + server.url));
