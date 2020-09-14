module.exports = {
    dateWithTime: function (date, hours, minutes) {
        let dt = new Date(date);
        dt.setHours(hours);
        dt.setMinutes(minutes);
        return dt;
    }
}
