const axios = require('axios')
function reverseGeocode(lat, lng) {
    const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json?language=uk';
    const params = {
        latlng: `${lat},${lng}`,
        key: process.env.GOOGLE_API_KEY,
    };
    return axios.get(baseUrl, { params })
        .then(response => {
            if (response.status === 200) {
                const result = response.data;
                if (result.results.length > 0) {
                    const address =  result.results[0];
                    return address;
                } else {
                    return 'Адресу не знайдено.';
                }
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        })
        .catch(error => {
            console.error(error.message);
            return 'Помилка при виконанні запиту.';
        });
}

module.exports = reverseGeocode