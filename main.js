const ical = require('ical-generator');
const express = require('express');
const app = express();
const {dateWithTime} = require('./utils.js');
const ruokalista = {
    "jamix": require('./services/jamix.js')
}

function createCalendar(service, query) {
    return new Promise( (resolve, reject) => {
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
    console.log(req.params.service, req.query)
    try {
        createCalendar(req.params.service, req.query).then(ics => {
            res.writeHead(200, {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': 'attachment; filename="ical-ruokalista.ics"'
            });
            res.end(ics, 'utf8');
        }).catch(reason => {
            res.status(500).end('Bad Request');            
        });
    } catch (e) {
        res.status(500).end('Internal Server Error');
    }

})

app.listen(80);

