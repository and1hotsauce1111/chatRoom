// === 建立server及宣告變數 ===
let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let port = process.env.PORT || 3000; // 開啟的port(預設3000)
let allUsers = {}; // 儲存所有用戶
let users_num = 0; // 紀錄線上人數

// nodeJS載入靜態檔
app.use(express.static('public'));
// 預設開啟位置
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// === 偵測連線發生 ===
io.on('connection', socket => {
  // socekt指向單一個連線者，io指向所有連線者
  // 連線發生時人數加1
  users_num += 1;
  // 打事件通知前端
  io.emit('usr_num', users_num);

  // 監聽新曾使用者事件
  socket.on('add_usr', data => {
    if (allUsers.hasOwnProperty(data.user)) {
      //console.log('repeat!');
      socket.emit('repeat_name', '您輸入的暱稱已存在！');
      return;
    }
    socket.emit('confirm_name', '暱稱建立成功！');
    allUsers[data.user] = socket; // 存自己id的socket
    io.emit('users_name', Object.keys(allUsers)); // 前端顯示所有在線者
    //console.log(Object.keys(allUsers));
  });

  socket.on('chat_data', data => {
    // 驗證資料是否完整
    if (Object.keys(data).length < 2) return; // data鍵值小於2代表有資料不完整
    if (data.msg[0] === '@') {
      // 私聊
      // 須先打事件給前端接收，否則私聊時無法顯示自己的留言
      socket.emit('chat_data', data);
      let i = data.msg.indexOf(' ');
      let u = data.msg.substring(1, i);
      let m = data.msg.substring(i, data.msg.length);
      if (typeof allUsers[u] != 'undefined') {
        allUsers[u].emit('chat_data', {
          usrName: data.usrName,
          msg: `[private] ${m}`,
          time: data.time,
          showTime: data.showTime
        });
      }
    } else {
      // 全聊天室廣播
      io.sockets.emit('chat_data', data);
    }
  });

  // === 偵測離線發生 ===
  socket.on('disconnect', () => {
    //console.log(socket.id);
    // 移除離線者
    for (let i in allUsers) {
      //console.log(allUsers[i].id);
      if (allUsers[i].id === socket.id) {
        delete allUsers[i];
      }
    }
    users_num = users_num < 0 ? 0 : (users_num -= 1);
    io.emit('usr_num', users_num);
    io.emit('users_name', Object.keys(allUsers));
  });
});

// === 預設開啟port ===
server.listen(port, () => {
  console.log('Server run at http://localhost:3000');
});
