const sendButton = document.getElementById('sendButton')
const input = document.getElementById('input')
const messageList = document.getElementById("messageList");
const chatList = document.getElementById("chat-list")
const editingMsg = document.querySelector("#editingMsg")
const editingMsgStyle = window.getComputedStyle(editingMsg)
const commentMsg = document.querySelector("#commentMsg")
const commentMsgStyle = window.getComputedStyle(commentMsg)
const editText = document.querySelector("#editText")
const cmntText = document.querySelector("#cmntText")
const editingMsgClose = document.querySelector("#editingMsgClose")
const commentMsgClose = document.querySelector("#commentMsgClose")
const commentedName = document.getElementById("commentedName")
const inputSection = document.getElementById('inputSection')
const msgListSection = document.getElementById('msgListSection')
const chatListSection = document.getElementById('chatListSection')
const fileUploadButton = document.getElementById("fileUploadButton")
const fileUploadBox = document.getElementById("fileUploadBox")
const fileUploadBoxStyle = window.getComputedStyle(fileUploadBox)
const fileUploadBoxClose = document.getElementById("fileUploadBoxClose")
const progressBarElement = document.getElementById("progressBarElement")
const fileName = document.getElementById("fileName")
const percentageElement = document.getElementById("percentage")

const uploadController = new AbortController();
const instance = axios.create({
  baseURL: "http://localhost:3000"
});

let state = {
  userRooms: [],
  currentRoom: 0,
  allUsers: [],
  roomUsers: [],
  currentAction: 'none', // 'none', 'reply', 'edit', 'uploading', 'upload-finished'
  repliedTo: '0',
  editing: '0',
  uploadingText: '',
  uploadingFile: {}
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
  state.userRooms = rooms
  for (let room of rooms) {
    let msgPreviewSender
    let msgPreview
    let createdAt
    if (!room.hasOwnProperty('lastMessage')) {
      msgPreviewSender = ''
      msgPreview = "هنوز پیامی نیست"
      createdAt = ''
    } else {
      msgPreviewSender = room.lastMessage['sender.name'] + ' :'
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
  const { text, repliedTo, isSeen, FileId, File } = message
  const messageId = message.id
  let commentedDisplay = ''
  let commentedText = ''
  let commentedSender = ''
  let fileLink = ''
  if (repliedTo && (repliedTo.text !== null || repliedTo.File.originalName !== null)) {
    commentedDisplay = "d-flex"
    commentedText = repliedTo.text ? repliedTo.text : repliedTo.File.originalName
    commentedSender = repliedTo.sender.name
  }
  if (FileId) {
    fileLink = `(<a href="/uploads/${File.fileName}">${File.originalName}</a>) - `
  }
  const item = `<div class="chat-transmiter-container" id="message-${messageId}">
    <div
      class="commented-text p-1 ${commentedDisplay}"
      id="commented-${messageId}"
    >
    ${commentedSender}: ${commentedText}
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
          <a
            class="mx-1 text-decoration-none px-2 mx-2 rounded-pill"
            id="msgDelete-${messageId}"
            href="#"
            >حذف</a
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
          ${fileLink}<span id="msgText-${messageId}">${text}</span>
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
  const msgDelete = document.querySelector(`#msgDelete-${messageId}`)
  const msgEdit = document.querySelector(`#msgEdit-${messageId}`)
  const editDiv = document.querySelector(`#editDiv-${messageId}`)
  const editDivStyle = window.getComputedStyle(editDiv)
  const editBtn = document.querySelector(`#editBtn-${messageId}`)
  const editClose = document.querySelector(`#editClose-${messageId}`)
  const chatTransmiter = document.querySelector(`#chatTransmiter-${messageId}`)
  const yourMsg = document.querySelector(`#yourMsg-${messageId}`)
  const senderName = document.getElementById(`sender-${messageId}`)
  const msgText = document.getElementById(`msgText-${messageId}`)

  msgDelete.onclick = () => {
    socket.emit('deleteMessage', { messageId, roomId: state.currentRoom })
  }

  msgComment.onclick = () => {
    if ((commentMsgStyle.getPropertyValue('display') === "none")) {
      commentMsg.style.display = "flex"
    }
    if ((editingMsgStyle.getPropertyValue('display') === "flex")) {
      editingMsg.style.display = "none"
      state.editing = '0'
      input.value = ''
    }
    cmntText.value = yourMsg.innerText.trim()
    commentedName.innerHTML = `${senderName.innerHTML}:`
    state.currentAction = 'reply'
    state.repliedTo = messageId.toString()
  }

  msgEdit.onclick = () => {
    if ((editingMsgStyle.getPropertyValue('display') === "none")) {
      editingMsg.style.display = "flex"
    }
    if ((commentMsgStyle.getPropertyValue('display') === "flex")) {
      commentMsg.style.display = "none"
      state.repliedTo = '0'
    }
    editText.value = yourMsg.innerText.trim()
    input.value = msgText.innerText.trim()
    state.currentAction = 'edit'
    state.editing = messageId.toString()
  }

  editBtn.onclick = () => {
    if (editDivStyle.getPropertyValue('display') === "none") {
      editDiv.style.display = "flex"
    }
    chatTransmiter.style.maxWidth = "100%"
  }

  editClose.onclick = () => {
    if (editDivStyle.getPropertyValue('display') === "flex") editDiv.style.display = "none"
    chatTransmiter.style.maxWidth = "90%"
  }
}

const generateOthersTextMsg = message => {
  const { text, RoomId, senderId, repliedTo, createdAt, sender, File, FileId } = message
  const messageId = message.id
  let commentedDisplay = ''
  let commentedText = ''
  let commentedSender = ''
  let fileLink = ''
  if (repliedTo && (repliedTo.text !== null || (repliedTo.File && repliedTo.File.originalName !== null))) {
    commentedDisplay = "d-flex"
    commentedText = repliedTo.text ? repliedTo.text : repliedTo.File.originalName
    commentedSender = repliedTo.sender.name
  }
  if (FileId) fileLink = `(<a href="/uploads/${File.fileName}">${File.originalName}</a>) - `
  const item = `<div class="chat-reciever-container" id="message-${messageId}">
    <div
      class="commented-text p-1 ${commentedDisplay}"
      id="commented-${messageId}"
    >
    ${commentedSender}: ${commentedText}
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
          >${sender.name}</a
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
        <p
          class="message-text ms-2 mb-0"
          id="yourMsg-${messageId}"      
        >
          ${fileLink}<span id="msgText-${messageId}">${text}</span>
        </p>
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
  const msgCommentStyle = window.getComputedStyle(msgComment)
  const editDiv = document.querySelector(`#editDiv-${messageId}`)
  const editClose = document.querySelector(`#editClose-${messageId}`)
  const chatReciever = document.querySelector(`#chatReciever-${messageId}`)
  const editBtn = document.querySelector(`#editBtn-${messageId}`)
  const yourMsg = document.querySelector(`#yourMsg-${messageId}`)
  const msgText = document.getElementById(`msgText-${messageId}`)

  // const senderName = document.getElementById(`sender-${messageId}`)

  msgComment.onclick = () => {
    if ((commentMsgStyle.getPropertyValue('display') === "none")) {
      commentMsg.style.display = "flex"
    }
    if ((editingMsgStyle.getPropertyValue('display') === "flex")) {
      editingMsg.style.display = "none"
      input.value = ''

      state.editing = '0'
    }
    commentedName.innerHTML = sender.name
    cmntText.value = yourMsg.innerHTML.trim()

    state.currentAction = 'reply'
    state.repliedTo = messageId.toString()
  }

  editBtn.onclick = () => {
    editDiv.style.display = "flex"
    chatReciever.style.maxWidth = "100%"
  }

  editClose.onclick = () => {
    editDiv.style.display = "none"
    chatReciever.style.maxWidth = "90%"
  }
}

socket.on('newTextMessage', message => {
  const { text, RoomId, senderId, repliedTo, createdAt } = message
  if (state.currentRoom === RoomId) {
    if (senderId.toString() === userId) generateOwnTextMsg(message)
    else {
      generateOthersTextMsg(message)
      socket.emit('seen', state.currentRoom)
    }
  }
  document.getElementById(`lastText-${RoomId}`).innerHTML = text
  document.getElementById(`lastDate-${RoomId}`).innerHTML = createdAt
})

socket.on('newFileMessage', message => {
  const { text, RoomId, senderId, repliedTo, createdAt, File } = message
  if (state.currentRoom === RoomId) {
    if (senderId.toString() === userId) generateOwnTextMsg(message)
    else {
      generateOthersTextMsg(message)
      socket.emit('seen', state.currentRoom)
    }
  }
  document.getElementById(`lastText-${RoomId}`).innerHTML = text ? text : `(${File.originalName})`
  document.getElementById(`lastDate-${RoomId}`).innerHTML = createdAt
})

sendButton.onclick = e => {
  if (input.value) {
    let newMessage = {}
    switch (state.currentAction) {
      case 'reply':
        commentMsg.style.display = "none"

        newMessage.repliedToId = state.repliedTo

        state.repliedTo = '0'
        state.currentAction = 'none'

      case 'none':
        newMessage.text = input.value
        newMessage.roomId = state.currentRoom
        socket.emit('newTextMessage', newMessage)

        input.value = ''
        break

      case 'edit':
        socket.emit('editMessage', {
          id: Number(state.editing),
          text: input.value
        })

        editingMsg.style.display = "none"
        input.value = ''

        state.editing = '0'
        state.currentAction = 'none'
        break

      case 'uploading':
        state.uploadingText = input.value
        lockControls()
        break

      case 'upload-finished':
        socket.emit('newFileMessage', {
          text: input.value,
          roomId: state.currentRoom,
          fileInfo: state.uploadingFile
        })

        fileUploadBox.style.display = "none"
        input.value = ''

        state.currentAction = 'none'
        state.uploadingFile = {}
        break
      default: //wtf?
        console.log(state.currentAction)
        break
    }
  } else {
    switch (state.currentAction) {
      case 'uploading':
        state.uploadingText = 'MESSAGE_SENT_WITHOUT_TEXT_BUT_WITH_FILE'
        lockControls()
        break

      case 'upload-finished':
        socket.emit('newFileMessage', {
          roomId: state.currentRoom,
          file: state.uploadingFile
        })

        fileUploadBox.style.display = "none"

        state.currentAction = 'none'
        state.uploadingFile = {}
        break
    }
  }
}

const lockControls = () => {
  sendButton.style.disabled = true
  input.style.disabled = true
  chatList.disabled = true
}

const unlockControls = () => {
  sendButton.style.disabled = false
  input.style.disabled = false
  chatList.disabled = false
}

editingMsgClose.onclick = () => {
  editingMsg.style.display = "none"
  input.value = ''

  state.currentAction = 'none'
  state.editing = '0'
}

commentMsgClose.onclick = () => {
  commentMsg.style.display = "none"

  state.currentAction = 'none'
  state.repliedTo = '0'
}

const selectChat = async roomId => {
  if (state.currentRoom === 0) inputSection.classList.remove('d-none')
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
  if (editedMsg.RoomId === state.currentRoom) {
    document.querySelector(`#yourMsg-${editedMsg.id}`).innerHTML = editedMsg.text
  }
})

socket.on('deleteMessage', data => {
  const { messageId, roomId } = data
  if (state.currentRoom === roomId) {
    const deletedMessage = document.getElementById(`message-${messageId}`)
    if (document.contains(deletedMessage))
      deletedMessage.remove()
  }
})

socket.on('seen', () => {
  const unseens = document.querySelectorAll('.bi-check')
  for (unseenMsg of unseens) {
    unseenMsg.classList.replace("bi-check", "bi-check-all")
  }
})

fileUploadButton.onclick = () => {
  var inputElement = document.createElement("input")
  inputElement.type = "file"
  // Set accept to the file types you want the user to select. 
  // Include both the file extension and the mime type
  // inputElement.accept = accept;
  inputElement.addEventListener("change", async () => {
    state.currentAction = 'uploading'

    const file = inputElement.files[0]
    fileName.innerHTML = file.name
    fileUploadBox.style.display = "flex"

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await axios({
        method: 'post',
        url: '/upload',
        data: formData,
        signal: uploadController.signal,
        onUploadProgress,
      })

      const { originalname, filename, size } = res.data
      state.uploadingFile = { originalName: originalname, fileName: filename, size }

      // currentAction === uploading
      if (state.uploadingText) {
        socket.emit('newFileMessage', {
          text: state.uploadingText !== 'MESSAGE_SENT_WITHOUT_TEXT_BUT_WITH_FILE'
            ? state.uploadingText
            : '',
          roomId: state.currentRoom,
          file: state.uploadingFile
        })

        fileUploadBox.style.display = "none"
        progressBarElement.classList.remove('bg-success')
        progressBarElement.classList.add('bg-info')
        progressBarElement.classList.add('progress-bar-striped')
        unlockControls()

        state.uploadingFile = {}
        state.uploadingText = ''
        state.currentAction = 'none'
      } else {
        progressBarElement.classList.add('bg-success')
        progressBarElement.classList.remove('bg-info')
        progressBarElement.classList.remove('progress-bar-striped')

        state.currentAction = 'upload-finished'
      }
    } catch (err) {
      console.log('axios error: ', err)
    }
  })

  inputElement.dispatchEvent(new MouseEvent("click"))
}

fileUploadBoxClose.onclick = () => {
  if (fileUploadBox.style.display === "flex")
    fileUploadBox.style.display = "none"

  if (state.currentAction === 'uploading') {
    uploadController.abort()
  } else {
    // socket.emit('deleteFile')
  }
  state.currentAction = 'none'
  state.uploadingText = ''
}


const onUploadProgress = (event) => {
  const percentage = Math.round((100 * event.loaded) / event.total);
  percentageElement.innerHTML = percentage + "%";
  progressBarElement.setAttribute("aria-valuenow", percentage);
  progressBarElement.style.width = percentage + "%";
};

// fileUploadButton.addEventListener("click", function () {
//   if (microphoneBtn.classList.contains("notclicked")) {
//     microphoneBtn.classList.replace("notclicked", "clicked")
//   } else if (microphoneBtn.classList.contains("clicked")) {
//     microphoneBtn.classList.replace("clicked", "notclicked")
//   }
// })

