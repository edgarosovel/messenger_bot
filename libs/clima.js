const fb = require(`./facebook_api`);
const db = require(`./db`);
var request = require("request");
var weekday = new Array(7);
weekday[0] = "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";

function ask_location(user_id) {
    db.update(
        { _id: user_id },
        { useLocationFor: "clima" },
        `users`,
        (e, r) => {}
    );
    fb.askUserLocationMessage(
        user_id,
        `Para informarte sobre el clima necesito que compartas conmigo tu ubicación.`,
        `climalocation`
    );
}

function clima(user_id, lat, long) {
    request(
        {
            uri: `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=25efee1324d5f5aa1ec2bea01f863448&units=metric&lang=es`,
            method: "GET",
        },
        function (err, res, body) {
            if (!err) {
                try {
                    datos = JSON.parse(body);
                    response = `Clima de hoy en ${datos.name}\nEstado: ${datos.weather[0].description}\nTemperatura: ${datos.main.temp}°C \nMínima: ${datos.main.temp_min}°C\nMáxima: ${datos.main.temp_max}°C\nHumedad: ${datos.main.humidity}%`; // http://openweathermap.org/img/w/${datos.weather[0].icon}.png
                    fb.sendTextMessage(user_id, response);
                } catch (err) {
                    fb.sendTextMessage(
                        user_id,
                        `Tuve un problema para obtener el clima. Una disculpa.`
                    );
                }
            } else {
                fb.sendTextMessage(
                    user_id,
                    `Tuve un problema para obtener el clima. Una disculpa.`
                );
            }
        }
    );
}

function send_weather_service_messages(fireDate) {
    console.log(`weather service fire date is ${fireDate}`);
    db.select_all(`weatherservice`, (err, res) => {
        if (err) console.log(err);
        if (!err) {
            for (r of res) {
                console.log(`sending weather service to ${r.user_id}`);
                send_weather_service_info(r.user_id);
            }
        }
    });
}

function subscribe_weather_service(user_id) {
    db.insert({ user_id: user_id }, `weatherservice`, (err, res) => {
        if (!err) fb.sendTextMessage(user_id, `Subscribed!`);
    });
}

function send_weather_service_info(user_id) {
    var options = {
        method: "GET",
        url: "https://community-open-weather-map.p.rapidapi.com/forecast",
        qs: { q: "hamburg", units: "metric", lang: "en" },
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
                msg = format_weather_service_message(data);
                fb.sendTextMessage(user_id, msg);
            } catch (err) {
                console.log(err);
                fb.sendTextMessage(
                    user_id,
                    `Tuve un problema para obtener el clima. Una disculpa.`
                );
            }
        } else {
            fb.sendTextMessage(
                user_id,
                `Tuve un problema para obtener el clima. Una disculpa.`
            );
        }
    });
}

function format_weather_service_message(data) {
    let city_name = data.city.name;
    let city_timezone = data.city.timezone;
    let current_dt = new Date(
        (data.list[0].dt + city_timezone) * 1000
    ).getUTCDate();
    let msg = format_weather_date_separation();
    for (const weather_info of data.list) {
        let new_date = new Date(
            (weather_info.dt + city_timezone) * 1000
        ).getUTCDate();
        if (current_dt != new_date) {
            current_dt = new_date;
            msg += format_weather_date_separation(
                weather_info.dt,
                city_timezone
            );
        }
        msg += format_weather_hour_info(weather_info, city_timezone);
    }

    return `WEATHER SERVICE for ${city_name}\n${msg}`;
}

function format_weather_date_separation(dt, city_timezone) {
    let day = "Today";
    if (dt) {
        let date = new Date((dt + city_timezone) * 1000);
        day = weekday[date.getUTCDay()];
    }
    return `\n⌲⌲⌲${day}`;
}

function format_weather_hour_info(data, city_timezone) {
    let date = new Date((data.dt + city_timezone) * 1000);
    let hour = date.getUTCHours();
    let degrees = data.main.temp;
    let weather = `${data.weather[0].main}: ${data.weather[0].description}`;
    return `\n${hour} · ${degrees}°C · ${weather}`;
}

function test_weather_service() {
    var options = {
        method: "GET",
        url: "https://community-open-weather-map.p.rapidapi.com/forecast",
        qs: { q: "hamburg", units: "metric", lang: "en" },
        headers: {
            "x-rapidapi-host": "community-open-weather-map.p.rapidapi.com",
            "x-rapidapi-key":
                "991117eb8bmsh35cc04757284cd4p1154a7jsn8b05153dde84",
            useQueryString: true,
        },
    };
    request(options, function (err, res, body) {
        if (!err) {
            try {
                data = JSON.parse(body);
                msg = format_weather_service_message(data);
            } catch (err) {
                console.log(err);
            }
        } else {
            console.log(err);
        }
    });
}

module.exports = {
    clima: clima,
    ask_location: ask_location,
    subscribe_weather_service,
    send_weather_service_messages,
    test_weather_service,
    send_weather_service_info,
};
