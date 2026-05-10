const { io } = require('socket.io-client');
const token = process.argv[2];
if (!token) { console.log('NO_TOKEN'); process.exit(1); }
const socket = io('http://127.0.0.1:4000', { transports: ['polling','websocket'] });
socket.on('connect', () => {
  socket.emit('authenticate', { sessionToken: token }, (auth) => {
    console.log(JSON.stringify({auth}));
    socket.emit('type:send', { text: 'hello from test', speed: 60 }, (resp) => {
      console.log(JSON.stringify({resp}));
      socket.close();
      process.exit(0);
    });
  });
});
socket.on('connect_error', (e) => { console.log(JSON.stringify({connect_error:e.message})); process.exit(2); });
