var request = require("request");

function send_weather_service_info(user_id) {
    var options = {
        method: "GET",
        url: "https://community-open-weather-map.p.rapidapi.com/forecast",
        qs: { q: "Hamburg", units: "metric", lang: "en" },
        headers: {
            "x-rapidapi-host": "community-open-weather-map.p.rapidapi.com",
            "x-rapidapi-key":
                "991117eb8bmsh35cc04757284cd4p1154a7jsn8b05153dde84",
            useQueryString: true,
        },
    };

    request(options, function (err, res, body) {
        if (err) console.log(err);
        if (!err) {
            try {
                data = JSON.parse(body);
                console.log(data);
            } catch (err) {
                console.log(err);
            }
        } else {
        }
    });
}

send_weather_service_info();
