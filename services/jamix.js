const got = require('got');

module.exports = function(params) {
    return new Promise( async (resolve, reject) => {
        try {
            let response = await got('http://fi.jamix.cloud/apps/menuservice/rest/haku/menu/' + params.customerID + '/' + params.kitchenID + '?lang=fi');
            response = JSON.parse(response.body);
            function jamixFormatDate(dt) {
                dt = dt.toString();
                return new Date(dt.substring(0,4) + '-' + dt.substring(4,6) + '-' + dt.substring(6,8));
            }
            let menu = response[0].menuTypes[params.menuType].menus[0];
            let title = menu.menuName + ' - ' + response[0].kitchenName;
    
            let out = {};
            menu.days.forEach(day => {
                let primaryMeals = [];
                let meals = {};
    
                day.mealoptions.forEach(mealOption => {
                    meals[mealOption.name] = [];
                    if (mealOption.menuItems[0]) {
                        primaryMeals.push(mealOption.menuItems[0].name);
                    }
                    mealOption.menuItems.forEach(menuItem => {
                        meals[mealOption.name].push(menuItem.name);
                    })
                });
    
                let description = [];
                for (let meal in meals) {
                    description.push(meal + ': ' + meals[meal].join(', '));
                }
                description = description.join('\n\n');
    
                out[jamixFormatDate(day.date)] = {
                    title: primaryMeals.join(', '),
                    description: description
                }
            });
            return resolve({title: title, menu: out});
        } catch (e) {
            reject(e);
        }
        
    })
};