const nodes = []; // Массив для хранения узлов графа
const roads = []; // Массив для хранения дорог (ребер) графа

var container = document.getElementById("roads"); // Получаем контейнер для  графа

 // Функция для генерации случайного числа
function getRandomInt(min, max) {
    return Math.random() * (max - min) + min;
}

// Функция для создания узлов и дорог графа
// Граф представляет собой сетку, т.к. такая форма показалась самой интересной для поиска пути
function createNodesWithRoads(nodeCount) { 
    const connectionCount = []; // Массив для подсчета количества связей у каждого узла
    const gridSize = Math.ceil(Math.sqrt(nodeCount)); // Вычисляем размер сетки для размещения узлов

    // заполняем массив узлов
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            id: i,
            label: String(i),
        });
    }

    for (let i = 0; i < nodeCount; i++) {
        const x = i % gridSize; // Вычисляем координату x текущего узла в сетке
        const y = Math.floor(i / gridSize); // Вычисляем координату y текущего узла в сетке
        let roadLength = Math.ceil(getRandomInt(0, 3)); // Генерируем случайную длину дороги

        // Добавляем дорогу вправо (если возможно)
        if (x < gridSize - 1 && i + 1 < nodeCount) {
            roads.push({
                from: i,
                to: i + 1,
                length: roadLength * 100,
                label: String(roadLength),
            });
        }

        roadLength = Math.ceil(getRandomInt(0, 3)); // Снова генерируем случайную длину дороги

        // Добавляем дорогу вниз (если возможно)
        if (y < gridSize - 1 && i + gridSize < nodeCount) {
            roads.push({
                from: i,
                to: i + gridSize,
                length: roadLength * 100,
                label: String(roadLength),
            });
        }
    }

    return { nodes: nodes, edges: roads }; // Возвращаем объект с узлами и дорогами
}

// Опции для настройки визуализации с использованием библиотеки vis.js
var options = { 
    interaction: {
        dragNodes: false,
        dragView: false,
        zoomView: false
    },
    physics: {
        barnesHut: {
            "gravitationalConstant": -3900,
            "centralGravity": 0
        },
        hierarchicalRepulsion: {
            nodeDistance: 100,
            avoidOverlap: 1,
        },
        stabilization: {
            enabled: true,
            iterations: 5000,
            updateInterval: 100,
            onlyDynamicEdges: false,
            fit: true
        },
    },
    edges: {
        smooth: {
            enabled: false,
        },
    }
};

// Создаем объект для визуального представления графа
// Используется библиотека vis.js
var network = new vis.Network(container, createNodesWithRoads(20), options); // Создаем объект сети для визуализации графа

///////////////////////////////////////////////////////////////
// Drones part

class Drone { // Определяем класс Drone для представления дронов
    constructor() {
        this.id; // id дрона
        this.startNodeId; // Узел, с которого начинается движение
        this.currentNodeId; // Узел, на котором находится дрон
        this.speed; // Cкорость дрона
        this.domElement; // Ссылка на представление дрона в Hmtl
    }

    moveToNode(path) { // Метод для перемещения дрона по пути
        if (this.currentNodeId == undefined) {
            this.currentNodeId = this.startNodeId;
        }

        var pathNode = path[0][0]; // Получаем следующий узел из пути
        var length = path[0][1] / 100; // Получаем длину пути

        var newPosInDom = network.canvasToDOM(network.getPosition(pathNode)); // Вычисляем новую позицию в DOM

        this.domElement.animate({ "left": newPosInDom.x, "top": newPosInDom.y }, (1000 * length) / this.speed, 'linear').promise().done(() => {
            this.currentNodeId = pathNode; // Обновляем текущий узел дрона
            path.shift(); // Удаляем первый элемент из пути

            if (path.length != 0) {
                this.moveToNode(path); // Рекурсивно вызываем moveToNode для следующего узла пути
                // Рекурсия нужна, т.к. анимации асинхронны, а сделать ассинхронным код сложнее, чем такая реализация
                // Можно было бы создать объект, который манипулировал бы всеми дронами, но это тоже затратнее
            } else {
                // console.log("ENDED");
            }
        });
    }
}

const drones = {}; // Объект для хранения экземпляров дронов

// Функция для инициализации дронов
function initDrones() {
    // Очищаем обхект, хранящий дроны
    for (var key of Object.keys(drones)) {
        drones[key].domElement.remove(); // Удаляем DOM-элемент дрона
        delete drones[key]; // Удаляем дрона из объекта
    }

    K = $("#dronesCount").val(); // Получаем количество дронов из поля ввода

    for (let i = 0; i < K; i++) {
        var drone = new Drone(); // Создаем новый экземпляр дрона
        drone.id = i; // Присваиваем ID
        drone.startNodeId = $("#dNode" + i).val(); // Получаем начальный узел дрона
        drone.speed = $("#dSpeed" + i).val(); // Получаем скорость дрона

        var newDroneDOM = $('<img>', { // Создаем новый DOM-элемент для дрона
            'id': 'drone',
            'src': 'img/drone-big.gif',
        });

        $('#roads').children(0).prepend(newDroneDOM); // Добавляем DOM-элемент в контейнер с дорогами

        var positionInDom = network.canvasToDOM(network.getPosition(i)); // Вычисляем начальную позицию в DOM
        // Задаем позицию
        newDroneDOM.css('left', positionInDom.x);
        newDroneDOM.css('top', positionInDom.y);
        newDroneDOM.css('transform-origin', 'center center');
        newDroneDOM.css("transform", `translate(-50%, -50%)`);

        drone.domElement = newDroneDOM; // Присваиваем DOM-элемент к экземпляру дрона
        drones[i] = drone; // Добавляем дрона в объект drones
    }

    updateDronesPosition(); // Обновляем позиции дронов
}

initDrones(); // Инициализируем дронов при загрузке страницы

function updateDronesPosition() { // Функция для обновления позиций дронов
    for (let i = 0; i < K; i++) {
        var positionInDom = network.canvasToDOM(network.getPosition(drones[i].startNodeId)); // Получаем позицию узла в DOM

        // Задаем позицию
        drones[i].domElement.css('left', positionInDom.x);
        drones[i].domElement.css('top', positionInDom.y);
    }
}

 // Функция для визуализации движения дронов
function visualize() {
    initDrones(); // Вызываем функцию инициализации дронов
    for (var key of Object.keys(drones)) { // Цикл по ключам объекта drones
        var drone = drones[key]; // Получаем текущий дрон по ключу

        var path = dijkstra(Number(drone.startNodeId), Number($("#targetNode").val())).path; // Вычисляем путь от начального узла дрона до целевого узла

        path.shift(); // Удаляем первый элемент из пути (начальный узел)
        drone.moveToNode(path); // Дрон перемещается по указанному пути
    }
}

// Т.к. дроны технически просто накладываются на граф, нам нужно обновлять их позиции
network.on("stabilized", function () {
    updateDronesPosition();
});
network.on("dragging", function () {
    updateDronesPosition();
});
network.on("zoom", function () {
    updateDronesPosition();
});

// Алгоритм Дейкстры был выбран по той причине, что он довольно прост в реализации, а также он достаточно эффективен для небольших графов, такой как наш
function dijkstra(startNode, endNode) {
    let distances = {}; // Объект для хранения расстояний
    let previousNodes = {}; // Объект для хранения предыдущих узлов
    let priorityQueue = []; // Очередь с приоритетами
    let path = []; // Массив для хранения пути

    nodes.forEach(node => { // Инициализируем начальные расстояния и предыдущие узлы
        distances[node.id] = Infinity;
        previousNodes[node.id] = null;
    });

    distances[startNode] = 0; // Устанавливаем начальное расстояние до стартового узла
    priorityQueue.push({ node: startNode, distance: 0 }); // Добавляем стартовый узел в очередь

    while (priorityQueue.length > 0) { // Пока очередь не пуста
        priorityQueue.sort((a, b) => a.distance - b.distance); // Сортируем очередь по расстоянию
        let currentNode = priorityQueue.shift().node; // Извлекаем узел с минимальным расстоянием

        if (currentNode === endNode) break; // Если достигли конечного узла, прерываем цикл

        let neighbors = roads.filter(road => road.from === currentNode || road.to === currentNode); // Получаем соседей текущего узла

        neighbors.forEach(neighbor => { // Перебираем соседей
            let neighborNode = neighbor.from === currentNode ? neighbor.to : neighbor.from; // Определяем соседний узел
            let length = neighbor.length; // Длина дороги до соседнего узла

            let newDistance = distances[currentNode] + length; // Вычисляем новое расстояние

            if (newDistance < distances[neighborNode]) { // Если новое расстояние меньше текущего
                distances[neighborNode] = newDistance; // Обновляем расстояние
                previousNodes[neighborNode] = currentNode; // Обновляем предыдущий узел
                priorityQueue.push({ node: neighborNode, distance: newDistance }); // Добавляем соседа в очередь
            }
        });
    }

    let currentNode = endNode;
    while (currentNode !== null) { // Восстанавливаем путь, начиная с конечного узла
        if (previousNodes[currentNode] !== null) {
             // Находим длину дороги
            let roadLength = roads.find(road => 
                (road.from === currentNode && road.to === previousNodes[currentNode]) || (road.to === currentNode && road.from === previousNodes[currentNode])).length;
            path.unshift([currentNode, roadLength]); // Добавляем узел и длину ребра в путь
        } else {
            path.unshift([currentNode, 0]); // Начальная нода
        }
        currentNode = previousNodes[currentNode]; // Переходим к предыдущему узлу
    }

    return { path: path, distance: distances[endNode] }; // Возвращаем найденный путь и расстояние
}
