var http = require('http');
var Static = require('node-static');
var WebSocketServer = new require('ws');

// подключенные клиенты
var clients = new Object();
var newClients = [];
var apples = [];
var needApples = 5;

var htmlPort = 25565
var socketPort = 3000

// WebSocket-сервер на порту 3000
var webSocketServer = new WebSocketServer.Server({port: socketPort});

class Client {

    constructor(socket, pressedKeys, id, snake) {
        this.socket = socket;
        //this.x = x;
        //this.y = y;
        //this.lenSnake = lenSnake;
        this.pressedKeys = pressedKeys;
        this.id = id;
        this.snake = snake;
    }

    getData1() { // id|x|y
        var head = this.snake.points[this.snake.points.length - 1];
        var data = "";
        data += this.id + "|";
        data += head.x + "|";
        data += head.y + "|";
        data += this.snake.lenSnake + "|";
        data += this.snake.headStepVec.x + "|";
        data += this.snake.headStepVec.y;
        return data;
    }

    getData3() { // id|r или id|l  или id или id|lr
        var data = "";
        data += this.id + "|"
        for (var key in this.pressedKeys) {
            if (this.pressedKeys[key] == 1)
                data += key + "|";
        }

        data = data.slice(0, -1);
        return data;

    }

    addKey(key) {
        if (this.pressedKeys[key] != 1) {
            this.pressedKeys[key] = 1;
        }
    }

    deleteKey(key) {
        if (this.pressedKeys[key] == 1) {
            this.pressedKeys[key] = -1;
        }
    }

    /*move() {
        for (var key in this.pressedKeys) {
            if (this.pressedKeys[key] == 1)
                switch (key) {
                    case 'l':
                        this.x -= 5;
                        break;
                    case'r':
                        this.x += 5;
                        break;
                    case'u':
                        this.y -= 5;
                        break;
                    case'd':
                        this.y += 5;
                        break;

                }
        }
    }*/
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Apple {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    isDotInside(x, y) {
        if (x >= this.x && y >= this.y && x <= this.x + this.width && y <= this.y + this.height)
            return true;
        return false;
    }

    draw(gr) {
        gr.strokeStyle = "#c4c4c4";
        gr.fillStyle = "#ff4a4a";
        gr.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Snake {
    constructor(points, lenSnake, width, lenSegment, headStepVec, lenHeadStep, speedRotate) {
        this.points = points;
        this.width = width;
        this.lenSnake = lenSnake;
        this.lenSegment = lenSegment;
        this.headStepVec = this.getNormVec(headStepVec);
        this.lenHeadStep = lenHeadStep;
        this.speedRotate = speedRotate;
    }

    rotateHeadStepVec(direction) {

        var alf = Math.atan2(this.headStepVec.y, this.headStepVec.x);
        if (direction == 'l') {
            alf -= this.speedRotate;
        } else if (direction == 'r') {
            alf += this.speedRotate;
        } else return -1;

        //var x = Math.cos(alf);
        // var y = Math.sin(alf);
        this.headStepVec.x = Math.cos(alf);
        this.headStepVec.y = Math.sin(alf);
    }

    isTouchApple(apple) {
        var head = this.points[this.points.length - 1];
        var headX = head.x + this.headStepVec.x * this.lenHeadStep;
        var headY = head.y + this.headStepVec.y * this.lenHeadStep;
        return apple.isDotInside(headX, headY);
    }

    step() {
        var points = this.points;
        var head = this.points[this.points.length - 1];

        //var lastVecToNextPoint = this.getVec(points[points.length - 2], head);
        //lastVecToNextPoint = this.getNormVec(lastVecToNextPoint);

        while (points.length < this.lenSnake)
            points.unshift(new Point(points[0].x, points[0].y));

        head.x += this.headStepVec.x * this.lenHeadStep;
        head.y += this.headStepVec.y * this.lenHeadStep;

        for (var i = points.length - 2; i >= 0; i--) {
            var vecToNextPoint = this.getVec(points[i], points[i + 1]);
            var nowLen = this.getLenVec(vecToNextPoint);

            if (this.lenSegment < nowLen) { // Если необходимо передвинуть текущий сегмент
                vecToNextPoint = this.getNormVec(vecToNextPoint);
                //var b = new Point(lastVecToNextPoint.x, lastVecToNextPoint.y);// = this.getNormVec(vecToNextPoint);
                //if (i != 0)
                //    lastVecToNextPoint = this.getVec(points[i - 1], points[i]);
                //lastVecToNextPoint = this.getNormVec(lastVecToNextPoint);
                points[i].x += vecToNextPoint.x * (nowLen - this.lenSegment);
                points[i].y += vecToNextPoint.y * (nowLen - this.lenSegment);
            }

        }

        /*var points = this.points;
        var head = this.points[this.points.length - 1];



        for (var i = 0; i < points.length - 1; i++) {
            var vecToNextPoint = this.getVec(points[i], points[i + 1]);
            var nowLen = this.getLenVec(vecToNextPoint);

            if (this.lenSegment < nowLen) { // Если необходимо передвинуть текущий сегмент
                vecToNextPoint = this.getNormVec(vecToNextPoint);
                points[i].x += vecToNextPoint.x * this.lenHeadStep ;
                points[i].y += vecToNextPoint.y * this.lenHeadStep ;
            } else if (this.lenSegment < nowLen * 2){
                vecToNextPoint = this.getNormVec(vecToNextPoint);
                points[i].x += vecToNextPoint.x * this.lenHeadStep / 2;
                points[i].y += vecToNextPoint.y * this.lenHeadStep / 2;
            }
        }

        head.x += this.headStepVec.x * this.lenHeadStep;
        head.y += this.headStepVec.y * this.lenHeadStep;*/
    }

    draw(gr) {

        var points = this.points;
        var p3Last;
        var p4Last;

        for (var i = 0; i < points.length - 1; i++) {

            if (points[i].x == points[i + 1].x && points[i].y == points[i + 1].y)
                continue;

            var nowPoint = points[i];
            var nextPoint = points[i + 1];

            var vecToNexPoint = new Point(nextPoint.x - nowPoint.x, nextPoint.y - nowPoint.y);
            var perpendicular = this.getPerpendicular(vecToNexPoint);

            var p1 = new Point(points[i].x + perpendicular.x * this.width, points[i].y + perpendicular.y * this.width);
            var p2 = new Point(points[i].x - perpendicular.x * this.width, points[i].y - perpendicular.y * this.width);
            var p3 = new Point(p1.x + vecToNexPoint.x, p1.y + vecToNexPoint.y);
            var p4 = new Point(p2.x + vecToNexPoint.x, p2.y + vecToNexPoint.y);
            vecToNexPoint = null;


            if (p3Last != undefined) {
                //if (p3Last.x < p1.x)
                this.drawTriangle(nowPoint, p1, p3Last, gr);
                //else
                this.drawTriangle(nowPoint, p2, p4Last, gr);
            }
            this.drawQuad(p1, p2, p3, p4, gr);

            p3Last = p3;
            p4Last = p4;

        }

        /*for (var i = 0; i < points.length - 1; i++) {

            //gr.fillRect(points[i].x, points[i].y, 30,30);
            //drawQuad(points[i],);
            /*gr.beginPath();
            gr.moveTo(points[i].x, points[i].y);
            gr.lineTo(points[i].x + 30, points[i].y);
            gr.lineTo(points[i].x + 30, points[i].y + 30);
            gr.lineTo(points[i].x, points[i].y + 30);
            gr.lineTo(points[i].x, points[i].y);

            gr.closePath();
            gr.stroke();
            gr.fill();
            gr.
            gr.beginPath();
            gr.arc(points[i].x, points[i].y, 30, 0, 2*Math.PI, false);
            gr.fillStyle = 'red';
            gr.fill();
            gr.lineWidth = 1;
            gr.strokeStyle = 'red';
            gr.stroke();

        }*/
        var pointHead = new Point(points[points.length - 1].x, points[points.length - 1].y);
        pointHead.x += this.headStepVec.x * this.lenSegment;
        pointHead.y += this.headStepVec.y * this.lenSegment;
        this.drawTriangle(pointHead, p3Last, p4Last, gr);
    }

    getVec(pFrom, pTo) {
        var x = pTo.x - pFrom.x;
        var y = pTo.y - pFrom.y;
        return new Point(x, y);
    }

    getLenVec(vec) {
        var len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        return len;
    }

    getNormVec(vec) {
        var len = this.getLenVec(vec);
        var resVec = new Point(vec.x / len, vec.y / len);
        return resVec;
    }

    getPerpendicular(vec) {
        var alf = Math.atan2(vec.y, vec.x);
        alf += 3.14 / 2;
        var x = Math.cos(alf);
        var y = Math.sin(alf);
        var perpendicular = new Point(x, y);
        return perpendicular;
    }

    drawTriangle(p1, p2, p3, gr) {
        gr.strokeStyle = "#000";
        gr.fillStyle = "#fc0";

        gr.beginPath();
        gr.moveTo(p1.x, p1.y);
        gr.lineTo(p2.x, p2.y);
        gr.lineTo(p3.x, p3.y);
        gr.lineTo(p1.x, p1.y);
        gr.closePath();
        gr.stroke();
        gr.fill();

    }

    drawQuad(p1, p2, p3, p4, gr) {
        var points = [p1, p2, p3, p4];

        // points[0]         points[1]
        //
        // points[2]         points[3]

        points.sort(function (a, b) {
            return a.y - b.y;
        })

        if (points[0].x > points[1].x) {
            var b = points[1];
            points[1] = points[0];
            points[0] = b;
        }

        if (points[2].x > points[3].x) {
            var b = points[3];
            points[3] = points[2];
            points[2] = b;
        }

        gr.strokeStyle = "#000";
        gr.fillStyle = "#fc0";

        gr.beginPath();
        gr.moveTo(points[0].x, points[0].y);
        gr.lineTo(points[1].x, points[1].y);
        gr.lineTo(points[3].x, points[3].y);
        gr.lineTo(points[2].x, points[2].y);
        gr.lineTo(points[0].x, points[0].y);

        gr.closePath();
        gr.stroke();
        gr.fill();
    }

    setHeadStepVec(headStepVec) {
        this.headStepVec = this.getNormVec(headStepVec);
    }
}


var globalId = -1;

webSocketServer.on('connection', function (ws) {


    var id = ++globalId;

    var snake = new Snake([new Point(100, 100)], 5, 15, 30, new Point(1, 0), 4, 0.05);

    newClients.push(new Client(ws, new Object(), id, snake));
    console.log("новое соединение " + id);

    ws.on('message', function (message) {

        var isNew = false;
        for (var i = 0; i < newClients.length; i++)
            if (newClients[i].id == id)
                isNew = true;

        if (isNew == false) { // true - если клиента только что добавили и обрабытывать его пока рано
            if (message[0] == 'd') // Нажали клавишу
                clients[id].addKey(message[1]);
            if (message[0] == 'u') // Отпустили клавишу
                clients[id].deleteKey(message[1]);
        }
    });

    ws.on('close', function () {
        console.log('соединение закрыто ' + id);
        delete clients[id];
    });

});

var timerId = setInterval(function () {

    var len = newClients.length
    for (var i = 0; i < len; i++) { // Если появились новые клиенты, даем им информацию о мире и оповещаем о них всех старых

        var data0This = "0|";
        data0This += newClients[i].getData1();

        var data1This = "1|";
        for (cl in clients)
            data1This += clients[cl].getData1() + "|";
        data1This = data1This.slice(0, -1); // Удаляем последнюю черту

        var data4This = "4|";
        for (var ap in apples) {
            data4This += apples[ap].x + "|";
            data4This += apples[ap].y + "|";
        }
        data4This = data4This.slice(0, -1);

        try {
            console.log("to" + newClients[i].id + ":" + data0This);

            newClients[i].socket.send(data0This);
            if (data1This.length > 1) {
                console.log("to" + newClients[i].id + ":" + data1This);
                newClients[i].socket.send(data1This);
            }
            if (data4This.length > 1) {
                newClients[i].socket.send(data4This);
            }
        } catch (ex) {
        }

        var data1All = "1|";
        data1All += newClients[i].getData1();

        for (var cl in clients) {
            try {
                console.log("to" + cl + ":" + data1All);
                clients[cl].socket.send(data1All);
            } catch (ex) {
            }
        }

        clients[newClients[i].id] = newClients[i];
    }

    for (var i = 0; i < len; i++) // Новые клиенты уще стали старыми. Удаляем их отсюда
        newClients.shift();


    var data3 = "3|";

    for (var cl in clients) { // Данные о нажатых кнопочках
        data3 += clients[cl].getData3() + "|";
    }
    data3 = data3.slice(0, -1); // Удаляем последнюю запятую

    for (var cl in clients) {   // Отправляем данные о нажатых кнопках всех клиентов
        try {
            console.log("to" + cl + ":" + data3);
            clients[cl].socket.send(data3);
        } catch (ex) {
        }
    }


    for (var cl in clients) { // Поворачиваем змейки если надо
        for (var key in clients[cl].pressedKeys) {
            if (clients[cl].pressedKeys[key] == 1)
                clients[cl].snake.rotateHeadStepVec(key);
        }
    }

    for (var cl in clients) { // Ходим каждой змейкой
        clients[cl].snake.step();
    }


    for (var cl in clients) { // Едим яблочки
        for (var ap in apples) {
            if (clients[cl].snake.isTouchApple(apples[ap])) {
                clients[cl].snake.lenSnake += 1; // Змейка съевшая яблочко выросла
                apples.splice(ap, 1); // Удаляем яблочко
                //apples.push(new Apple(Math.random() * (500), Math.random() * (500), 30, 30));
                break;
                //ap--;
            }
        }
    }
    var data4 = "4|"
    while (apples.length < needApples) { // Генерим новые яблочки
        var apple = new Apple(parseInt(Math.random() * 700), parseInt(Math.random() * 700), 30, 30);
        data4 += apple.x + "|" + apple.y + "|";
        apples.push(apple);
    }
    data4 = data4.slice(0, -1);
    for (var cl in clients) { // Отправляем данные о новых яблочках всем клиентам
        try {
            console.log("to" + cl + ":" + data4);
            clients[cl].socket.send(data4);
        } catch (ex) {
        }
    }


}, 1000 / 60);


var fileServer = new Static.Server('.');

http.createServer(function (req, res) {

    fileServer.serve(req, res);

}).listen(htmlPort);

console.log("Порт сервера - "+htmlPort+", порт сокетов - "+ socketPort);

