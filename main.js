const ical = require('ical-generator');
const express = require('express');
const app = express();
const { dateWithTime } = require('./utils.js');
const { createLogger, format, transports } = require('winston');
const logdnaWinston = require('logdna-winston');

const ruokalista = {
    "jamix": require('./services/jamix.js')
}

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        format.errors({stack: true}),
        format.splat(),
        format.json()
    ),
    transports: [
        new transports.File({filename: 'error.log', level: 'error'}),
        new transports.File({filename: 'combined.log'}),
        new transports.Console({format: format.combine(format.colorize(), format.simple())})
    ]
});

if (process.env.logdnaToken) {
    logger.add(new logdnaWinston({
        key: process.env.logdnaToken.toString().trim(),
        app: 'ical-ruokalista',
        index_meta: true
    }));
    logger.info('[LOGGING] Added logdna transport!');
}

function createCalendar(service, query) {
    return new Promise((resolve, reject) => {
        try {
            ruokalista[service](query).then(data => {
                const cal = ical({
                    prodId: '//na//ical-ruokalista//FI',
                    name: 'Ruokalista - ' + data.title,
                    timezone: 'Europe/Helsinki'
                });

                for (let day in data.menu) {
                    const event = cal.createEvent({
                        start: dateWithTime(day, ...query.start.split(':')),
                        end: dateWithTime(day, ...query.end.split(':')),
                        summary: data.menu[day].title,
                        description: data.menu[day].description
                    });
                }
                resolve(cal.toString());
            }).catch(reason => {
                reject(reason);
            });
        } catch (e) {
            reject(e);
        }
    });
}

app.get('/ics/:service', (req, res, next) => {
    const ip = (req.headers['cf-connecting-ip'] || req.connection.remoteAddress);
    const meta = {...req.query, ip: ip, userAgent: req.headers['user-agent']};
    logger.info('[HTTP] Requested service ' + req.params.service + ' by ' + ip, {...meta})
    try {
        createCalendar(req.params.service, req.query).then(ics => {
            res.writeHead(200, {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': 'attachment; filename="ical-ruokalista.ics"'
            });
            res.end(ics, 'utf8');
        }).catch(reason => {
            res.status(500).end('Bad Request');
            logger.error(reason, {...meta});
        });
    } catch (e) {
        res.status(500).end('Internal Server Error');
        logger.error(e, {...meta});
    }
})

app.get('/', (req, res) => {
    res.redirect('https://github.com/ahnl/ical-ruokalista');
});
app.listen((process.env.PORT || 80), () => {
    logger.info('[HTTP] Server ready!');
});
