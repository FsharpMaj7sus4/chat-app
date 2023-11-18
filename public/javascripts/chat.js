const sendButton = document.getElementById('sendButton')
const input = document.getElementById('input')
const messageList = document.getElementById("messageList");
const chatList = document.getElementById("chat-list")
const editingMsg = document.querySelector("#editingMsg")
const commentMsg = document.querySelector("#commentMsg")
const editText = document.querySelector("#editText")
const cmntText = document.querySelector("#cmntText")
const editingMsgClose = document.querySelector("#editingMsgClose")
const commentMsgClose = document.querySelector("#commentMsgClose")
const commentedName = document.getElementById("commentedName")
const inputSection = document.getElementById('inputSection')
const msgListSection = document.getElementById('msgListSection')
const chatListSection = document.getElementById('chatListSection')

let state = {
  userRooms: [],
  currentRoom: '0',
  allUsers: [],
  roomUsers: [],
  currentAction: 'none', // 'none', 'reply', 'edit'
  repliedTo: '0',
  editing: '0',
}

socket.on('allUsers', users => {
  state.allUsers = users
})

socket.on('newUser', user => {
  state.allUsers.push(user)
})

socket.on('newUserInRoom', user => {
  state.roomUsers.push(user)
})

socket.on("allMyRooms", rooms => {
  for (let room of rooms) {
    state.userRooms = rooms
    let msgPreviewSender
    let msgPreview
    let createdAt
    if (!room.hasOwnProperty('lastMessage')) {
      msgPreviewSender = ''
      msgPreview = "هنوز پیامی نیست"
      createdAt = ''
    } else {
      msgPreviewSender = room.lastMessage['User.name'] + ' :'
      createdAt = room.lastMessage.createdAt
      if (room.lastMessage.text && !room.lastMessage.file) msgPreview = room.lastMessage.text
      else if (!room.lastMessage.text && room.lastMessage.file) msgPreview = room.lastMessage.file
      else msgPreview = `(File) ${room.lastMessage.text}`
    }
    let item = `
    <li  class="text-end p-2 w-100 border-bottom">   
      <a
        id="room-${room.id}"
        onclick="selectChat(${room.id})"
        class="chats-list-link w-100 d-flex flex-row-reverse justify-content-start align-items-center"
        href="#"
      >
        <div class="user-img mx-">
          <img src="/images/user-img.webp" alt="" style="
            width: 70px;
          ">
          <div class="user-status-div"></div>
        </div>
        <div class="user-msg mx-3" style='width: calc(100% - 100px);'>
          <div class="user-name">
            <span class="badge rounded-pill bg-primary">${room.messageCount ? room.messageCount : ''}</span>
            ${room.name}
          </div>
          <div 
            class="user-message text-secondary"
            id="lastText-${room.id}"
            style="
              display: flex;
              justify-content: center;
            "
          >
            <span>${msgPreviewSender}</span>
            <span style="
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            ">${msgPreview}</span>
            </div>
          <small 
            class="msg-time-passed text-secondary"
            id="lastDate-${room.id}"
          >
            ${createdAt}
          </small>
        </div>
      </a>
    </li>`
    chatList.insertAdjacentHTML("beforeend", item)
    chatList.scrollTop = 0
  }
})

const generateOwnTextMsg = message => {
  const { text, RoomId, repliedTo, createdAt, isSeen } = message
  let commentedDisplay = ''
  let commentedText = ''
  const messageId = message.id
  if (repliedTo) {
    commentedDisplay = "d-flex"
    commentedText = repliedTo.text
  }
  const item = `<div class="chat-transmiter-container">
    <div
      class="commented-text p-1 ${commentedDisplay}"
      id="commented-${messageId}"
    >
    ${commentedText}
    </div>
    <div class="chat-transmiter" id="chatTransmiter-${messageId}">
      <div
        class="d-flex justify-content-start align-items-center px-2 mb-1"
      >
        <img
          class="rounded-circle me-2"
          width="20px"
          height="20px"
          src="/images/user-img.webp"
          alt=""
        />
        <small id="sender-${messageId}" class="text-secondary mx-2">شما</small>
        <a
          class="rounded-circle bg-success me-2 edit-user"
          id="editBtn-${messageId}"
          ><i class="bi bi-pencil d-flex text-white"></i
        ></a>
        <div
          class="justify-content-start align-items-center editing-div animate__animated animate__bounceInRight"
          id="editDiv-${messageId}"
        >
          <a
            class="mx-1 text-decoration-none px-2 me-2 rounded-pill"
            id="msgEdit-${messageId}"
            href="#"
            >ویرایش</a
          >
          <a
            class="mx-1 text-decoration-none px-2 mx-2 rounded-pill"
            id="msgComment-${messageId}"
            href="#"
            >پاسخ</a
          >
          <button
            class="btn-close"
            id="editClose-${messageId}"
            style="font-size: 10px"
          ></button>
        </div>
      </div>
      <div
        class="d-flex justify-content-start align-items-start flex-nowrap px-2 my-1"
      >
        <span><i class="bi ${isSeen ? "bi-check-all" : "bi-check"} d-flex fs-5"></i></span>
        <p
          class="message-text ms-2 mb-0"
          id="yourMsg-${messageId}"
        >
          ${text}
        </p>
      </div>
      <div
        class="d-flex justify-content-start align-items-center px-2 mt-1"
      >
        <small class="dateTime-text text-secondary me-2">05/11</small>
        <small class="dateTime-text text-secondary">06:13</small>
      </div>
    </div>
  </div>`


  messageList.insertAdjacentHTML("beforeend", item)
  msgListSection.scrollTo(0, messageList.scrollHeight)

  const commented = document.querySelector(`#commented-${messageId}`)
  const msgComment = document.querySelector(`#msgComment-${messageId}`)
  const msgEdit = document.querySelector(`#msgEdit-${messageId}`)
  const editDiv = document.querySelector(`#editDiv-${messageId}`)
  const editBtn = document.querySelector(`#editBtn-${messageId}`)
  const editClose = document.querySelector(`#editClose-${messageId}`)
  const chatTransmiter = document.querySelector(`#chatTransmiter-${messageId}`)
  const yourMsg = document.querySelector(`#yourMsg-${messageId}`)
  const senderName = document.getElementById(`sender-${messageId}`)

  msgComment.onclick = () => {
    if ((commentMsg.style.display = "none")) {
      commentMsg.style.display = "flex"
    }
    if ((editingMsg.style.display = "flex")) {
      editingMsg.style.display = "none"
      state.editing = '0'
      input.value = ''
    }
    cmntText.value = yourMsg.innerHTML.trim()
    commentedName.innerHTML = `${senderName.innerHTML}:`
    state.currentAction = 'reply'
    state.repliedTo = messageId.toString()
  }

  msgEdit.onclick = () => {
    if ((editingMsg.style.display = "none")) {
      editingMsg.style.display = "flex"
    }
    if ((commentMsg.style.display = "flex")) {
      commentMsg.style.display = "none"
      state.repliedTo = '0'
    }
    editText.value = yourMsg.innerHTML.trim()
    input.value = yourMsg.innerHTML.trim()
    state.currentAction = 'edit'
    state.editing = messageId.toString()
  }

  editBtn.onclick = () => {
    if ((editDiv.style.display = "none")) {
      editDiv.style.display = "flex"
    }
    chatTransmiter.style.maxWidth = "100%"
  }

  editClose.onclick = () => {
    if ((editDiv.style.display = "flex")) editDiv.style.display = "none"
    chatTransmiter.style.maxWidth = "90%"
  }
}

const generateOthersTextMsg = message => {
  const { text, RoomId, senderId, repliedTo, createdAt, User } = message
  console.log(message)
  const messageId = message.id
  let commentedDisplay = ''
  let commentedText = ''
  if (repliedTo) {
    commentedDisplay = "d-flex"
    commentedText = repliedTo.text
  }
  const item = `<div class="chat-reciever-container">
    <div
      class="commented-text p-1 ${commentedDisplay}"
      id="commented-${messageId}"
    >
    ${commentedText}
    </div>
    <div class="chat-reciever" id="chatReciever-${messageId}">
      <div class="d-flex justify-content-end align-items-center mb-1">
        <a
          class="rounded-circle bg-success me-2 edit-user"
          id="editBtn-${messageId}"
          ><i class="bi bi-pencil d-flex text-white"></i
        ></a>
        <div
          class="justify-content-start align-items-center editing-div animate__animated animate__bounceInLeft"
          id="editDiv-${messageId}"
        >
        <a
          class="mx-1 text-decoration-none px-2 mx-2 rounded-pill"
          id="msgComment-${messageId}"
          href="#"
          >پاسخ</a
        >
          <button
            class="btn-close"
            id="editClose-${messageId}"
            style="font-size: 10px"
          ></button>
        </div>  
        <a
          id="sender-${messageId}"
          href="#"
          class="text-secondary reciever-name text-decoration-none mx-2"
          >${User.name}</a
        >
        <img
          class="rounded-circle"
          width="20px"
          height="20px"
          src="/images/user-img.webp"
          alt=""
        />
      </div>
      <div
        class="d-flex justify-content-start align-items-center px-2 my-1"
      >
        <p class="message-text ms-2 mb-0">${text}</p>
      </div>
      <div
        class="d-flex justify-content-end align-items-center px-2 mt-1"
      >
        <small class="dateTime-text text-secondary">05/11</small>
        <small class="dateTime-text text-secondary ms-2">06:13</small>
      </div>
    </div>
  </div>`

  messageList.insertAdjacentHTML("beforeend", item)
  msgListSection.scrollTo(0, messageList.scrollHeight)

  const commented = document.querySelector(`#commented-${messageId}`)
  const msgComment = document.querySelector(`#msgComment-${messageId}`)
  const editDiv = document.querySelector(`#editDiv-${messageId}`)
  const editClose = document.querySelector(`#editClose-${messageId}`)
  const chatReciever = document.querySelector(`#chatReciever-${messageId}`)
  const editBtn = document.querySelector(`#editBtn-${messageId}`)
  const senderName = document.getElementById(`sender-${messageId}`)

  msgComment.onclick = () => {
    if ((commentMsg.style.display = "none")) {
      commentMsg.style.display = "flex"
    }
    if ((editingMsg.style.display = "flex")) {
      editingMsg.style.display = "none"
      state.editing = '0'
      input.value = ''
    }
    state.currentAction = 'reply'
    state.repliedTo = messageId.toString()
    commentedName.innerHTML = senderName.innerHTML

  }

  editBtn.onclick = () => {
    if ((editDiv.style.display = "none")) {
      editDiv.style.display = "flex"
    }
    chatReciever.style.maxWidth = "100%"
  }

  editClose.onclick = () => {
    if ((editDiv.style.display = "flex")) editDiv.style.display = "none"
    chatReciever.style.maxWidth = "90%"
  }
}

socket.on('newTextMessage', message => {
  const { text, RoomId, senderId, repliedTo, createdAt } = message
  if (state.currentRoom === RoomId) {
    if (senderId.toString() === userId) generateOwnTextMsg(message)
    else {
      generateOthersTextMsg(message)
      socket.emit('seen', currentRoom)
    }
  }
  document.getElementById(`lastText-${RoomId}`).innerHTML = text
  document.getElementById(`lastDate-${RoomId}`).innerHTML = createdAt
})

sendButton.onclick = e => {
  if (input.value) {
    switch (state.currentAction) {
      case 'none':
      case 'reply':
        const newMessage = Object.assign(
          {},
          { text: input.value },
          { roomId: state.currentRoom },
          state.repliedTo !== '0' ? { repliedToId: state.repliedTo } : null
        )
        socket.emit('newTextMessage', newMessage)
        commentMsg.style.display = "none"
        state.repliedTo = '0'
        break

      case 'edit':
        socket.emit('editMessage', {
          id: Number(state.editing),
          text: input.value
        })
        editingMsg.style.display = "none"
        state.editing = '0'
        break

      default: //wtf?
        console.log(state.currentAction)
        break
    }
    input.value = ''
    state.currentAction = 'none'
  }
}

editingMsgClose.onclick = () => {
  if ((editingMsg.style.display = "flex"))
    editingMsg.style.display = "none"
  state.currentAction = 'none'
  state.editing = '0'
  input.value = ''
}

commentMsgClose.onclick = () => {
  if ((commentMsg.style.display = "flex"))
    commentMsg.style.display = "none"
  state.currentAction = 'none'
  state.repliedTo = '0'
}

const selectChat = async roomId => {
  if (state.currentRoom === '0') inputSection.classList.remove('d-none')
  state.currentRoom = roomId
  messageList.innerHTML = ''
  socket.emit('roomData', roomId)
}

socket.on('roomData', data => {
  const { Messages, Users } = data
  state.roomUsers = Users
  for (let message of Messages) {
    if (message.senderId.toString() === userId) generateOwnTextMsg(message)
    else generateOthersTextMsg(message)
  }
  msgListSection.scrollTo(0, messageList.scrollHeight)
  socket.emit('seen', state.currentRoom)
})

socket.on('editMessage', editedMsg => {
  document.querySelector(`#yourMsg-${editedMsg.id}`).innerHTML = editedMsg.text
})

socket.on('seen', () => {
  const unseens = document.querySelectorAll('.bi-check')
  for (unseenMsg of unseens) {
    unseenMsg.classList.replace("bi-check", "bi-check-all")
  }
})

// commentSubmit.onclick = () => {
//   const { repliedTo } = state
//   const commented = document.querySelector(`#commented-${repliedTo}`)
//   commented.style.display = "flex"
//   commented.innerHTML = cmntText.value
//   socket.emit('editMessage', {
//     id: 
//   })

//   state.repliedTo = '0'
// }


//=========================================================
const microphoneBtn = document.querySelector("#microphoneBtn")
// const userEditedMsg = document.querySelector('#userEditedMsg')




microphoneBtn.addEventListener("click", function () {
  if (microphoneBtn.classList.contains("notclicked")) {
    microphoneBtn.classList.replace("notclicked", "clicked")
  } else if (microphoneBtn.classList.contains("clicked")) {
    microphoneBtn.classList.replace("clicked", "notclicked")
  }
})

