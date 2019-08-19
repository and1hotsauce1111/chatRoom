// === 等待DOM載入完成
document.addEventListener('DOMContentLoaded', evt => {
  // === 取得使用者名稱 ===
  let modal_name = document.querySelector('.modal_name'); // modal
  let save_name_btn = document.querySelector('#save_name');
  let reset_name_btn = document.querySelector('#reset_name');
  let reset_name_cancel_btn = document.querySelector('#cancel_name');
  let userName = document.querySelector('#usr_name');
  let show_usrName = document.querySelector('#selected_name'); // 顯示自己的名稱

  // 點擊按鈕送出
  save_name_btn.addEventListener('click', evt => {
    evt.stopPropagation();
    evt.preventDefault();
    console.log('click');
    if (userName.value.trim() === '') {
      userName.classList.add('alert');
      return;
    } else {
      if (userName.className == 'alert') {
        userName.classList.remove('alert');
      }
      socket.emit('add_usr', { user: userName.value });
    }
  });
  // 按下enter送出
  window.addEventListener('keydown', evt => {
    if (evt.keyCode === 13) {
      if (userName.value.trim() === '') {
        userName.classList.add('alert');
        return;
      } else {
        if (userName.className == 'alert') {
          userName.classList.remove('alert');
        }
        socket.emit('add_usr', { user: userName.value });
      }
    }
  });
  // 重新設定名稱
  reset_name_btn.addEventListener('click', evt => {
    modal_name.style.display = 'block';
    reset_name_cancel_btn.style.display = 'block';
  });
  // 取消重新設定名稱
  reset_name_cancel_btn.addEventListener('click', evt => {
    userName.value = ''; // 清空輸入框
    modal_name.style.display = 'none';
  });

  // === 建立連線 ===
  let socket = io();

  // === 監聽連線狀態 ===
  let is_connect = document.querySelector('#server_status'); // 顯示連線狀態
  let online_usrs = document.querySelector('#cur_count'); // 顯示線上人數
  let name_repeat_alert = document.querySelector('.alert_name'); // 重複暱稱的提示

  // 連線
  socket.on('connect', () => {
    is_connect.innerHTML = '已連線';
  });
  // 離線
  socket.on('disconnect', () => {
    is_connect.innerHTML = '未連線';
  });
  // 統計線上人數
  socket.on('usr_num', num => {
    // console.log(num);
    online_usrs.innerHTML = num;
  });
  // 顯示線上使用者名稱
  socket.on('users_name', names => {
    console.log(names);
  });
  // 檢查暱稱是否重複
  socket.on('repeat_name', data => {
    // console.log(data);
    name_repeat_alert.style.display = 'block';
    // 3.5秒後移除DOM才能重複觸發css animation
    window.setTimeout(() => {
      name_repeat_alert.style.display = 'none';
    }, 3500);
  });
  // 暱稱建立成功
  socket.on('confirm_name', data => {
    // console.log(data);
    // 隱藏輸入modal
    show_usrName.innerHTML = userName.value;
    userName.value = ''; // 清空輸入框
    modal_name.style.display = 'none';
  });

  // === 主要邏輯區塊 ===
  // === 使用到的function ===
  // 紀錄當前時間
  function now() {
    let hours = new Date().getHours();
    let minutes = new Date().getMinutes();

    // 12小時制
    if (hours < 10) {
      hours = `上午0${hours}`;
    } else if (hours == 10 || hours == 11) {
      hours = `上午${hours}`;
    } else if (hours == 12) {
      hours = `下午${hours}`;
    } else if (hours > 12 && hours < 24) {
      hours -= 12;
      if (hours < 10) {
        hours = `下午0${hours}`;
      } else {
        hours = `下午${hours}`;
      }
    } else if (hours == 24) {
      hours = '上午00';
    }

    if (minutes < 10) {
      minutes = `0${minutes}`;
    }

    return `${hours}:${minutes}`;
  }
  // 接收訊息
  function addMsg(data) {
    let time = data.showTime;
    if (data.usrName !== show_usrName.innerHTML) {
      // 別人發的訊息
      msgContainer.innerHTML += `<div class="chat_content_area_bobble"> 
      <img src="/images/嚇到吃手手.jpg" alt /> 
      <div class="chat_content_area_bobble_content"> 
        <div class="chat_content_area_bobble_user_name">${data.usrName}</div> 
        <div class="chat_content_area_bobble_msg_area"> 
          <div class="chat_content_area_bobble_msg_area_msg">${data.msg}</div> 
          <div class="chat_content_area_bobble_msg_area_time">${time}</div> 
        </div>
        </div>
      </div>`;
    } else {
      msgContainer.innerHTML += `<div class="chat_content_area_bobble_self">
        <div class="chat_content_area_bobble_self_msg">
          ${data.msg}
        </div>
        <div class="chat_content_area_bobble_self_time">${time}</div>
      </div>`;
    }

    // 訊息量超過上限就移除多餘訊息
    // console.log(msgContainer.children.length);
    // if (msgContainer.children.length > max_record) {
    //   removeMsg();
    // }
  }
  // 移除訊息
  function removeMsg() {
    let children = msgContainer.children;
    children[0].remove();
  }

  // === 發送訊息 ===
  let inputMsg = document.querySelector('#input_msg'); // 文字輸入區塊
  let msgWrapper = document.querySelector('.chat_content_area'); // 訊息框最外層div
  let msgContainer = document.querySelector(
    '.chat_content_area_bobble_container'
  ); // 訊息顯示區塊
  if (inputMsg) {
    inputMsg.addEventListener('keydown', evt => {
      if (evt.shiftKey) {
        // 按住shitf鍵不送出
        return false;
      }
      if (evt.keyCode === 13) {
        let ok = true; // 是否trigger emit msg
        // 為輸入訊息或訊息為空白時不發送
        if (inputMsg.value.length <= 1 && inputMsg.value.trim() === '') {
          evt.preventDefault();
          ok = false;
          return false;
        }

        // 傳輸訊息資料整理
        let msgVal = inputMsg.value;
        let userNameVal = show_usrName.innerHTML;
        let sendMsgData = {
          usrName: userNameVal,
          msg: msgVal,
          time: new Date().toUTCString(), // 用在排序訊息
          showTime: now() // 顯示時間用
        };

        if (ok) {
          socket.emit('chat_data', sendMsgData);
        }

        // 清空輸入框
        inputMsg.value = '';
        // 避免按enter送出後產生的空白行
        evt.preventDefault();
        // 滾動條保持最下方
        window.setTimeout(() => {
          msgWrapper.scrollTop = msgWrapper.scrollHeight;
        }, 0);
      }
    });
  }

  // === 接受訊息 ===
  socket.on('chat_data', data => {
    console.log(123);
    addMsg(data);
  });
});
