process.title = 'rendezvous';

var WebSocket = require('ws'),
    WebsocketServer = WebSocket.Server,
    Promise = require('bluebird'),
    roomRepository = new (require('./repositories/room').RoomRepository)(),
    codeRepository = new (require('./repositories/code').CodeRepository)(),
    roomService = new (require('./services/room').RoomService)(roomRepository, codeRepository),
    webrtcService = new (require('./services/webrtc').WebrtcService)(roomService);

var PORT = 9090;

var wss = new WebsocketServer({ port: PORT }, function() {
    var address = wss._server.address();
    console.log('Websocket server listening on', [address.address, address.port].join(':'));
});

var clients = {};

wss.on('connection', function(socket) {
    socket.id = Date.now() + '-' + Math.round(Math.random() * 1000000);
    clients[socket.id] = socket;
    var pingInterval = setInterval(function() {
        socket.ping();
    }, 5000);
    socket.on('close', function() {
        delete clients[socket.id];
        clearInterval(pingInterval);
    });
    socket.on('message', function(payload) {
        try {
            if (process.env.DEBUG) {
                console.log(payload);
            }
            var message = JSON.parse(payload);
            if (message.type) {
                switch (message.type) {
                    case 'presence':
                        handlePresenceMessage(message, socket)
                            .then(function(data) {
                                if (data) {
                                    socket.send(makeDataResponse(message.source, message.id, message.type, data));
                                } else {
                                    socket.send(makeEmptyResponse(message.source, message.id, message.type));
                                }
                            }, function(err) {
                                socket.send(makeErrorResponse(message.source, message.id, message.type, err, message));
                            });
                        break;
                    case 'webrtc':
                        handleWebrtcMessage(message, socket)
                            .then(function(data) {
                                if (data) {
                                    socket.send(makeDataResponse(message.source, message.id, message.type, data));
                                } else {
                                    socket.send(makeEmptyResponse(message.source, message.id, message.type));
                                }
                            }, function(err) {
                                console.log(err);
                                socket.send(makeErrorResponse(message.source, message.id, message.type, err, message));
                            });
                        break;
                    default:
                        console.log('Unknown message type:', message.type, message);
                        break;
                }
            }
        } catch (err) {
          console.log(err.stack);
        }
    });
});

function signalRoomChange(socket) {
    for (var socketId in clients) {
        if (clients.hasOwnProperty(socketId) && socketId != socket.id) {
            clients[socketId].send(makeDataResponse('', '', 'roomChange', ''));
        }
    }
}
function handlePresenceMessage(message, socket) {
    switch(message.cmd) {
        case 'createRoom':
            return roomService.create(message.data, socket)
                .then(function(data) {
                    signalRoomChange(socket);
                    return data;
                });
            break;
        case 'lock':
            return roomService.lock(message.data.id);
            break;
        case 'unlock':
            return roomService.unlock(message.data.id);
            break;
        case 'listRooms':
            return roomService.listRooms();
            break;
        case 'findRoomByCode':
            return roomService.findRoomByCode(message.data.code);
            break;
        case 'getRoom':
            return roomService.get(message.data.id);
            break;
        case 'closeRoom':
            return roomService.close(message.data.id)
                .then(function(data) {
                    signalRoomChange(socket);
                    return data;
                });
            break;
        default:
            var errorMessage = 'Unknown cmd: ' + message.cmd;
            console.log(errorMessage);
            return Promise.reject(new Error(errorMessage));
            break;
    }
}

function handleWebrtcMessage(message, socket) {
    switch (message.cmd) {
        case 'offer':
            return webrtcService.sendOfferToRoomOwner(message, socket);
            break;
        case 'answer':
            return webrtcService.sendAnswerToClient(message, socket);
            break;
        case 'candidates':
            return webrtcService.sendCandidates(message);
            break;
        default:
            var errorMessage = 'Unknown cmd: ' + message.cmd;
            console.log(errorMessage);
            return Promise.reject(new Error(errorMessage));
            break;
    }
}

function makeDataResponse(source, id, type, data) {
    return JSON.stringify({id: id, source: source, type: type, success: true, data: data});
}

function makeEmptyResponse(source, id, type) {
    return JSON.stringify({id: id, source: source, type: type, success: true});
}

function makeErrorResponse(source, id, type, err, message) {
    return JSON.stringify({id: id, source: source, type: type, success: false, error: err.message, cause: err.cause, request: message});
}

var Hapi = require('hapi'),
    server = new Hapi.Server({
        debug: {
            log: ['error'],
            request: ['error']
        }
    });
var serverConfig = {
    port: 10000 + PORT
};
server.connection(serverConfig);

server.register([
        require('blipp'),
        {
            register: require('good'),
            options: {
                opsInterval: 5000,
                reporters: [
                    {
                        reporter: require('good-console'),
                        args: [{ log: 'error', response: 'error', request: 'error' }]
                    }
                ]
            }
        }
    ],
    function() {
        server.route({
            method: 'GET',
            path: '/classroom',
            config: {
                handler: function(request, reply) {
                    reply(roomService.listRooms()
                        .then(function(rooms) {
                            var roomsPromises = [];
                            var roomIds = rooms.roomIds;
                            for (var i = 0, length = roomIds.length; i < length; i++) {
                                roomsPromises.push(roomService.get(roomIds[i]));
                            }
                            return Promise.all(roomsPromises);
                        }));
                },
                state: {
                    failAction: 'ignore'
                }
            }
        });
    });

server.start(function() {
    console.log('Server listening on 0.0.0.0:' + serverConfig.port);
});
