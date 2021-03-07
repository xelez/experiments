// most of it based/taken from https://frontender.info/build-a-javascript-particle-system/

var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

// Classes and stuff
function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

// Сложить два вектора
Vector.prototype.add = function(vector) {
  this.x += vector.x;
  this.y += vector.y;
}

// Получить длину вектора
Vector.prototype.getMagnitude = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

// Получить угол вектора, учитывая квадрант
Vector.prototype.getAngle = function () {
  return Math.atan2(this.y,this.x);
};

// Получить новый вектор, исходя из угла и размеров
Vector.fromAngle = function (angle, magnitude) {
  return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};



function Particle(point, velocity, acceleration, color) {
  this.position = point || new Vector(0, 0);
  this.velocity = velocity || new Vector(0, 0);
  this.acceleration = acceleration || new Vector(0, 0);
  this.color = color || 'vodka';
}


Particle.prototype.move = function () {
  // Добавить ускорение к скорости
  this.velocity.add(this.acceleration);

  // Добавить скорость к координатам
  this.position.add(this.velocity);
};


Particle.prototype.submitToFields = function (fields) {
  // стартовое ускорение в кадре
  var totalAccelerationX = 0;
  var totalAccelerationY = 0;

  // запускаем цикл по гравитационным полям
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];

    // вычисляем расстояние между частицей и полем
    var vectorX = field.position.x - this.position.x;
    var vectorY = field.position.y - this.position.y;

    // вычисляем силу с помощью МАГИИ и НАУКИ!
    var force = field.mass / Math.pow(vectorX*vectorX+vectorY*vectorY,1.5);

    // аккумулируем ускорение в кадре произведением силы на расстояние
    totalAccelerationX += vectorX * force;
    totalAccelerationY += vectorY * force;
  }

  // обновляем ускорение частицы
  this.acceleration = new Vector(totalAccelerationX, totalAccelerationY);
};


function Field(point, mass) {
  this.position = point;
  this.setMass(mass);
}

Field.prototype.setMass = function(mass) {
  this.mass = mass || 100;
  this.drawColor = mass < 0 ? "#f00" : "rgba(0, 196, 0, 255)";
}


function Emitter(point, velocity, spread) {
  this.position = point; // Вектор
  this.velocity = velocity; // Вектор
  this.spread = spread || Math.PI / 32; // Возможный угол = скорость +/- разброс.
  this.drawColor = "#999";
}


function makeRandomColor() {
    var h = 40 + (110 - 40) * Math.random();
    return 'hsl('+ h +',80%,50%)';
}

Emitter.prototype.emitParticle = function() {
    // Использование случайного угла для формирования потока частиц позволит нам получить своего рода «спрей»
    var angle = this.velocity.getAngle() + this.spread - (Math.random() * this.spread * 2);

    // Магнитуда скорости излучателя
    var magnitude = this.velocity.getMagnitude();

    // Координаты излучателя
    var position = new Vector(this.position.x, this.position.y);

    // Обновлённая скорость, полученная из вычисленного угла и магнитуды
    var velocity = Vector.fromAngle(angle, magnitude);

    //b = Math.floor(Math.random()* 256);
    //var color = 'rgba(0,0,' + b + ', 100)';
    var color = makeRandomColor();

    // Возвращает нашу Частицу!
    return new Particle(position, velocity, new Vector(0,0), color);
};



// Main loop and stuff
var centerX = canvas.width / 2 - 120;
var centerY = canvas.height / 2;
var particles = [];
var emitters = [
//    new Emitter(new Vector(centerX - 80, centerY - 100), Vector.fromAngle(-Math.PI / 2, 2.095), Math.PI / 42),
    new Emitter(new Vector(centerX - 80, centerY - 100), Vector.fromAngle(-Math.PI / 2, 2.3), Math.PI / 32),
];

var fields = [
//    new Field(new Vector(400, 230), -40),
    new Field(new Vector(centerX, centerY - 100), 400),
    new Field(new Vector(centerX, centerY + 100), 400),
//    new Field(new Vector(centerX, centerY - 100), 300),
//    new Field(new Vector(centerX, centerY + 120), 320),
];

var maxParticles = 2000;
var emissionRate = 3; // количество частиц, излучаемых за кадр

function addNewParticles() {
  // прекращаем, если достигнут предел
  if (particles.length > maxParticles) return;

  // запускаем цикл по каждому излучателю
  for (var i = 0; i < emitters.length; i++) {

    // согласно emissionRate, генерируем частицы
    for (var j = 0; j < emissionRate; j++) {
      particles.push(emitters[i].emitParticle());
    }

  }
}


function plotParticles(boundsX, boundsY) {
  // Новый массив для частиц внутри холста
  var currentParticles = [];

  for (var i = 0; i < particles.length; i++) {
    var particle = particles[i];
    var pos = particle.position;

    // Если частица за пределами, то пропускаем её и переходим к следующей
    if (pos.x < 0 || pos.x > boundsX || pos.y < 0 || pos.y > boundsY) continue;

    // Перемещение частицы
    particle.submitToFields(fields);
    particle.move();

    // Добавление частицы в массив частиц внутри холста
    currentParticles.push(particle);
  }

  // Замена глобального массива частиц на массив без вылетевших за пределы холста частиц
  particles = currentParticles;
}

var particleSize = 6;

function drawParticles() {

    // Запускаем цикл, который отображает частицы
    for (var i = 0; i < particles.length; i++) {
        var position = particles[i].position;
        ctx.fillStyle = particles[i].color;
        // Рисуем квадрат определенных размеров с заданными координатами
        ctx.fillRect(position.x, position.y, particleSize, particleSize);
    }
}

function drawCircle(object) {
  ctx.fillStyle = object.drawColor;
  ctx.beginPath();
  ctx.arc(object.position.x, object.position.y, 6, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawText() {
    ctx.fillStyle = 'orange';
    ctx.strokeStyle = 'rgb(32,32,32)';
    ctx.lineWidth = 2;

    //ctx.font = '120px Monospace';
    ctx.font = '120px Helvetica, Arial, sans-serif';
    //ctx.fillText('С', centerX, centerY);
    ctx.textAlign = 'right';
    ctx.strokeText('С', centerX - 160, centerY + 60);
    //ctx.fillText('марта!', centerX, centerY);
    ctx.textAlign = 'left';
    ctx.strokeText('марта!', centerX + 160, centerY + 60);
}

function drawEmitters() {
    for (var i=0; i < emitters.length; i++) {
        ctx.fillStyle = "black";
        var e = emitters[i];
        ctx.fillRect(e.position.x, e.position.y, 10, 10);
    }
}


function update() {
  addNewParticles();
  plotParticles(canvas.width, canvas.height);
}

function main_loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    //drawEmitters();
    drawParticles();
    drawText();
    //fields.forEach(drawCircle);

    window.requestAnimationFrame(main_loop);
}


main_loop()
