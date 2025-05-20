const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = 3001;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Load config
let config = {};
try {
    const configData = fs.readFileSync(path.join(__dirname, 'wix.config.json'), 'utf8');
    config = JSON.parse(configData);
} catch (error) {
    console.error('Error loading config:', error);
}

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Handle API proxy requests
    if (req.method === 'POST' && req.url === '/api/contacts/query') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            // Set up the request to the Wix API
            const options = {
                hostname: 'www.wixapis.com',
                path: '/contacts/v4/contacts/query',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                    'wix-site-id': config.siteId
                }
            };

            // Make the request to the Wix API
            const wixReq = https.request(options, wixRes => {
                let data = '';

                wixRes.on('data', chunk => {
                    data += chunk;
                });

                wixRes.on('end', () => {
                    // Set CORS headers
                    res.writeHead(wixRes.statusCode, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    });

                    res.end(data);
                    console.log('API Response:', data);
                });
            });

            wixReq.on('error', error => {
                console.error('Error making Wix API request:', error);
                res.writeHead(500, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ error: 'Failed to make Wix API request' }));
            });

            // Send the request body to the Wix API
            wixReq.write(body);
            wixReq.end();
        });
    }
    // Handle orders query by member ID
    else if (req.method === 'GET' && req.url.startsWith('/api/orders/member/')) {
        const memberId = req.url.split('/api/orders/member/')[1];

        // Set up the request to the Wix API
        const options = {
            hostname: 'www.wixapis.com',
            path: `/pricing-plans/v2/orders?memberId=${memberId}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
                'wix-site-id': config.siteId
            }
        };

        // Make the request to the Wix API
        const wixReq = https.request(options, wixRes => {
            let data = '';

            wixRes.on('data', chunk => {
                data += chunk;
            });

            wixRes.on('end', () => {
                try {
                    // Parse the response data
                    const responseData = JSON.parse(data);

                    // Filter orders to only include those for the requested member
                    if (responseData.orders && Array.isArray(responseData.orders)) {
                        responseData.orders = responseData.orders.filter(order =>
                            order.buyer && order.buyer.memberId === memberId
                        );
                    }

                    // Set CORS headers
                    res.writeHead(wixRes.statusCode, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    });

                    // Send the filtered response
                    res.end(JSON.stringify(responseData));
                    console.log('Filtered Orders API Response for member:', memberId);
                } catch (error) {
                    // If there's an error parsing the data, just return the original response
                    res.writeHead(wixRes.statusCode, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    });

                    res.end(data);
                    console.error('Error filtering orders:', error);
                }
            });
        });

        wixReq.on('error', error => {
            console.error('Error making Wix API request:', error);
            res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: 'Failed to make Wix API request' }));
        });

        wixReq.end();
    }

    // Handle OPTIONS requests for CORS preflight
    else if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
    }
    // Handle static file requests
    else {
        // Handle the root path
        let filePath = req.url === '/'
            ? path.join(__dirname, 'index.html')
            : path.join(__dirname, req.url);

        // Get the file extension
        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';

        // Read the file
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    // File not found
                    res.writeHead(404);
                    res.end('404 Not Found');
                } else {
                    // Server error
                    res.writeHead(500);
                    res.end(`Server Error: ${error.code}`);
                }
            } else {
                // Success
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
