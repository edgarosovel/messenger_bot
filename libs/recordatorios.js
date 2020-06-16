const db = require(`./db`);
const fb = require(`./facebook_api`);
var mongo = require("mongodb");

//setInterval(send_recordatorios,1*60*1000);

function handler(foo) {
    if (foo.option == "recintent") {
        save_recordatorio(foo.user._id, foo.message, foo.dateToSend);
    } else if (foo.option == "recshowintent") {
        show_recordatorios(foo.user._id);
    } else if (foo.option == "recnewdate") {
        update_date_recordatorio(
            foo.user._id,
            foo.recordatorio_id,
            foo.dateToSend
        );
    } else if (/^recopc/i.test(foo.option)) {
        options_recordatorio(foo.user._id, foo.option.substr(6));
    } else if (/^recfec/i.test(foo.option)) {
        ask_new_date_recordatorio(foo.user._id, foo.option.substr(6));
    } else if (/^recdel/i.test(foo.option)) {
        delete_recordatorio(foo.user._id, foo.option.substr(6));
    } else if ("reccancelar") {
        fb.sendTextMessage(foo.user._id, `Operación cancelada.`);
    }
}

function send_recordatorios() {
    busqueda = {
        dateToSend: {
            $lte: new Date(Date.now()),
        },
    };

    db.select_many(busqueda, `recordatorios`, (err, res) => {
        if (!err) {
            for (r of res) {
                db.delete({ _id: r._id }, `recordatorios`, (err, res) => {});
                fb.sendTextMessage(
                    r.user_id,
                    `⚠️RECORDATORIO⚠️\n"${r.message}"`
                );
            }
        }
    });
}

function format_date(date) {
    date = new Date(date);
    meses = {
        1: "Enero",
        2: "Febrero",
        3: "Marzo",
        4: "Abril",
        5: "Mayo",
        6: "Junio",
        7: "Julio",
        8: "Agosto",
        9: "Septiembre",
        10: "Octubre",
        11: "Noviembre",
        12: "Diciembre",
    };
    dias = {
        1: "Lunes",
        2: "Martes",
        3: "Miércoles",
        4: "Jueves",
        5: "Viernes",
        6: "Sábado",
        0: "Domingo",
    };
    min =
        date.getMinutes().toString().length == 2
            ? date.getMinutes().toString()
            : `0${date.getMinutes().toString()}`;
    return `${dias[date.getDay()]} ${date.getDate()} de ${
        meses[Number(date.getMonth()) + 1]
    } de ${date.getFullYear()} a las ${date.getHours()}:${min}`;
}

function save_recordatorio(user_id, message, dateToSend) {
    if (!dateToSend)
        return fb.sendTextMessage(user_id, `No escribiste una hora válida`);
    if (!message)
        return fb.sendTextMessage(user_id, `No escribiste un mensaje válido`);
    dateToSend = new Date(dateToSend);
    if (dateToSend > Date.now()) {
        db.insert(
            { user_id: user_id, message: message, dateToSend: dateToSend },
            `recordatorios`,
            (err, res) => {
                if (!err)
                    fb.sendTextMessage(
                        user_id,
                        `Muy bien, te mandaré el mensaje: "${message}" en la siguiente fecha: "${format_date(
                            dateToSend
                        )}"`
                    );
            }
        );
    } else {
        fb.sendTextMessage(
            user_id,
            `Aún no me han implementado una función para viajar al pasado. 😒`
        );
    }
}

function show_recordatorios(user_id, opt) {
    message =
        opt == "recopc"
            ? "Estos son tus recordatorios. Para modificar o eliminar alguno, oprime el botón que tenga su ID."
            : opt == "recdel"
            ? "Estos son tus recordatorios. Para eliminar alguno, oprime el botón que tenga su ID."
            : "Estos son tus recordatorios. Para modificar la fecha de alguno, oprime el botón que tenga su ID.";
    db.select_many({ user_id: user_id }, `recordatorios`, (err, res) => {
        if (!err) {
            if (res[0]) {
                i = 1;
                botones = [
                    {
                        content_type: `text`,
                        title: `Cancelar`,
                        payload: `reccancelar`,
                    },
                ];
                for (r of res) {
                    if (i <= 10) {
                        botones.push({
                            content_type: `text`,
                            title: `${i}`,
                            payload: `${opt}${r._id}`,
                        });
                        message += `\n\n🆔: ${i}\nMensaje: "${
                            r.message
                        }".\nFecha: ${format_date(r.dateToSend)}`;
                    }
                    i++;
                }
                if (i - 10 > 0)
                    message += `\n\nMostrando 10 de los ${i} mensajes.`;
                fb.sendButtonsMessage(user_id, message, botones);
            } else {
                fb.sendTextMessage(user_id, `No tienes ningún recordatorio.`);
            }
        }
    });
}

function options_recordatorio(user_id, recordatorio_id) {
    recordatorio_id = new mongo.ObjectID(recordatorio_id);
    db.select({ _id: recordatorio_id }, `recordatorios`, (err, res) => {
        if (err) return;
        if (!res) return;
        message = `Recordatorio:\nMensaje: "${
            res.message
        }".\nFecha: ${format_date(res.dateToSend)}`;
        botones = [
            {
                content_type: `text`,
                title: `Cancelar`,
                payload: `reccancelar`,
            },
            {
                content_type: `text`,
                title: `Modificar fecha`,
                payload: `recfec${recordatorio_id}`,
            },
            {
                content_type: `text`,
                title: `Eliminar`,
                payload: `recdel${recordatorio_id}`,
            },
        ];
        //       {
        // content_type: `text`,
        //       title: `Modificar mensaje`,
        //       payload: `recmen${recordatorio_id}`},
        fb.sendButtonsMessage(user_id, message, botones);
    });
}

function delete_recordatorio(user_id, recordatorio_id) {
    recordatorio_id = new mongo.ObjectID(recordatorio_id);
    db.delete({ _id: recordatorio_id }, `recordatorios`, (err) => {
        if (err)
            return fb.sendTextMessage(
                user_id,
                `Tuve un problema al eliminar el recordatorio. Prueba más tarde.`
            );
        fb.sendTextMessage(user_id, `Recordatorio eliminado.`);
    });
}

function ask_new_date_recordatorio(user_id, recordatorio_id) {
    recordatorio_id = new mongo.ObjectID(recordatorio_id);
    db.update(
        { _id: user_id },
        { changeDate: recordatorio_id },
        `users`,
        (err, res) => {
            if (err) return;
            fb.sendTextMessage(
                user_id,
                `¿Cuándo quieres que te mande el mensaje?`
            );
        }
    );
}

function update_date_recordatorio(user_id, recordatorio_id, new_date) {
    recordatorio_id = new mongo.ObjectID(recordatorio_id);
    db.update({ _id: user_id }, { changeDate: "" }, `users`, (err, res) => {}); // remove change date
    if (!new_date)
        return fb.sendTextMessage(
            user_id,
            `No escribiste una fecha válida. Modificación cancelada.`
        );
    new_date = new Date(new_date);
    if (new_date < Date.now())
        return fb.sendTextMessage(
            user_id,
            `Aún no me han implementado una función para viajar al pasado. 😒`
        );
    db.update(
        { _id: recordatorio_id },
        { dateToSend: new_date },
        `recordatorios`,
        (err, res) => {
            if (err)
                return fb.sendTextMessage(
                    user_id,
                    `Tuve un problema al actualizar la fecha del recordatorio. Prueba más tarde.`
                );
            fb.sendTextMessage(
                user_id,
                `Fecha modificada al ${format_date(new_date)}`
            );
        }
    );
}

module.exports = {
    handler: handler,
    show_recordatorios: show_recordatorios,
};
