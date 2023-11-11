const geolib = require('geolib')
function getDistanceString(point1, point2) {
    // Розрахунок відстані в метрах
    const distanceInMeters = geolib.getDistance(point1, point2);

    // Визначення одиниці вимірювання та відстані для виводу
    let unit, distance;

    // Якщо відстань менше 1 кілометра, виводимо в метрах
    if (distanceInMeters < 1000) {
        unit = 'м';
        distance = Math.round(distanceInMeters).toFixed(0);
    } else {
        // Якщо відстань 1 кілометр чи більше, конвертуємо в кілометри
        unit = 'км';
        distance = (distanceInMeters / 1000 ).toFixed(1);
    }

    // Виведення результату
    return `${distance} ${unit}`
}
module.exports = getDistanceString