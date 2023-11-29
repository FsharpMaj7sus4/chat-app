const sendButton = document.getElementById("sendButton")
const input = document.getElementById("input")
const inputForm = document.getElementById("inputForm")
const currentRoomName = document.getElementById("currentRoomName")
const messageList = document.getElementById("messageList")
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
const inputSection = document.getElementById("inputSection")
const msgListSection = document.getElementById("msgListSection")
const chatListSection = document.getElementById("chatListSection")
const fileUploadButton = document.getElementById("fileUploadButton")
const fileUploadBox = document.getElementById("fileUploadBox")
const fileUploadBoxStyle = window.getComputedStyle(fileUploadBox)
const fileUploadBoxClose = document.getElementById("fileUploadBoxClose")
const progressBarElement = document.getElementById("progressBarElement")
const fileName = document.getElementById("fileName")
const percentageElement = document.getElementById("percentage")
const newRoomButton = document.getElementById("newRoom")
const allUsersList = document.getElementById("allUsersList")
const createThisNewRoom = document.getElementById("createThisNewRoom")
const newRoomUsersModal = new bootstrap.Modal(document.querySelector("#newRoomUserSelect"))
const newRoomNameModal = new bootstrap.Modal(document.querySelector("#newRoomNameSelect"))
const userSelectModalMsg = document.getElementById("userSelectModalMsg")
const roomNameModalMsg = document.getElementById("roomNameModalMsg")
const newRoomName = document.getElementById("newRoomName")
const confirmRoomName = document.getElementById("confirmRoomName")

const uploadController = new AbortController()
const instance = axios.create({
  baseURL: "http://localhost:3000",
})

let state = {
  userRooms: [],
  currentRoom: 0,
  allUsers: {},
  roomUsers: [],
  currentAction: "none", // 'none', 'reply', 'edit', 'uploading', 'upload-finished', 'new-group'
  repliedTo: 0,
  editing: 0,
  uploadingText: "",
  uploadingFile: {},
  newRoomUsers: [],
}

const generateOwnTextMsg = message => {
  const { text, repliedTo, isSeen } = message
  const messageId = message.id
  let commentedDisplay = ""
  let commentedText = ""
  let commentedSender = ""
  if (repliedTo && (repliedTo.text !== null || (repliedTo.File && repliedTo.File.originalName !== null))) {
    commentedDisplay = "d-flex"
    commentedText = repliedTo.text ? repliedTo.text : repliedTo.File.originalName
    commentedSender = repliedTo.sender.name
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
          <span id="msgText-${messageId}">${text}</span>
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
    socket.emit("deleteMessage", { messageId, roomId: state.currentRoom })
  }

  msgComment.onclick = () => {
    if (commentMsgStyle.getPropertyValue("display") === "none") {
      commentMsg.style.display = "flex"
    }
    if (editingMsgStyle.getPropertyValue("display") === "flex") {
      editingMsg.style.display = "none"
      input.value = ""
      state.editing = 0
    } else if (state.currentAction === "uploading" || state.currentAction === "upload-finished") cancelUploading()
    cmntText.value = yourMsg.innerText.trim()
    input.focus()
    commentedName.innerHTML = `${senderName.innerHTML}:`

    state.currentAction = "reply"
    state.repliedTo = messageId
  }

  msgEdit.onclick = () => {
    if (editingMsgStyle.getPropertyValue("display") === "none") {
      editingMsg.style.display = "flex"
    }
    if (commentMsgStyle.getPropertyValue("display") === "flex") {
      commentMsg.style.display = "none"
      state.repliedTo = 0
    } else if (state.currentAction === "uploading" || state.currentAction === "upload-finished") cancelUploading()
    editText.value = yourMsg.innerText.trim()
    input.value = msgText.innerText.trim()
    input.focus()

    state.currentAction = "edit"
    state.editing = messageId
  }

  editBtn.onclick = () => {
    if (editDivStyle.getPropertyValue("display") === "none") editDiv.style.display = "flex"
    chatTransmiter.style.maxWidth = "100%"
  }

  editClose.onclick = () => {
    if (editDivStyle.getPropertyValue("display") === "flex") editDiv.style.display = "none"
    chatTransmiter.style.maxWidth = "90%"
  }
}

const generateOthersTextMsg = message => {
  const { text, RoomId, senderId, repliedTo, createdAt, sender } = message
  const messageId = message.id
  let commentedDisplay = ""
  let commentedText = ""
  let commentedSender = ""
  if (repliedTo && (repliedTo.text !== null || (repliedTo.File && repliedTo.File.originalName !== null))) {
    commentedDisplay = "d-flex"
    commentedText = repliedTo.text ? repliedTo.text : repliedTo.File.originalName
    commentedSender = repliedTo.sender.name
  }
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
          <span id="msgText-${messageId}">${text}</span>
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
    if (commentMsgStyle.getPropertyValue("display") === "none") {
      commentMsg.style.display = "flex"
    }
    if (editingMsgStyle.getPropertyValue("display") === "flex") {
      editingMsg.style.display = "none"
      input.value = ""

      state.editing = 0
    } else if (state.currentAction === "uploading" || state.currentAction === "upload-finished") cancelUploading()
    commentedName.innerHTML = sender.name
    cmntText.value = yourMsg.innerHTML.trim()
    input.focus()

    state.currentAction = "reply"
    state.repliedTo = messageId
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

const generateOwnFileMsg = message => {
  const { text, repliedTo, isSeen, FileId, File } = message
  const messageId = message.id
  let commentedDisplay = ""
  let commentedText = ""
  let commentedSender = ""
  let filePart = ""
  let fileLink = ""
  switch (
    File.mimeType.split("/")[0] // file extention
  ) {
    case "image":
      filePart = `<img
        src="/uploads/${File.fileName}"
        style="
          max-height: 500px;
          max-width: 500px;
          height: auto;
          width: auto;
        "
      />`
      break

    case "audio":
      filePart = `<audio controls>
        <source src="/uploads/${File.fileName}" type="${File.mimeType}">
      </audio>`
      break

    default:
      fileLink = `(<a href="/uploads/${File.fileName}">${File.originalName}</a>)${text ? ` - ` : ""}`
      break
  }

  if (repliedTo && (repliedTo.text !== null || (repliedTo.File && repliedTo.File.originalName !== null))) {
    commentedDisplay = "d-flex"
    commentedText = repliedTo.text ? repliedTo.text : repliedTo.File.originalName
    commentedSender = repliedTo.sender.name
  }
  const item = `<div class="chat-transmiter-container" id="message-${messageId}">
    <div
      class="commented-text p-1 ${commentedDisplay}"
      id="commented-${messageId}"
    >
    ${commentedSender}: ${commentedText}
    </div>
    <div class="chat-transmiter" id="chatTransmiter-${messageId}">
      <div class="d-flex flex-column">
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
        ${filePart}
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
    socket.emit("deleteMessage", { messageId, roomId: state.currentRoom })
  }

  msgComment.onclick = () => {
    if (commentMsgStyle.getPropertyValue("display") === "none") {
      commentMsg.style.display = "flex"
    }
    if (editingMsgStyle.getPropertyValue("display") === "flex") {
      editingMsg.style.display = "none"
      state.editing = 0
      input.value = ""
    } else if (state.currentAction === "uploading" || state.currentAction === "upload-finished") cancelUploading()
    cmntText.value = yourMsg.innerText.trim()
    input.focus()
    commentedName.innerHTML = `${senderName.innerHTML}:`

    state.currentAction = "reply"
    state.repliedTo = messageId
  }

  msgEdit.onclick = () => {
    if (editingMsgStyle.getPropertyValue("display") === "none") {
      editingMsg.style.display = "flex"
    }
    if (commentMsgStyle.getPropertyValue("display") === "flex") {
      commentMsg.style.display = "none"
      state.repliedTo = 0
    } else if (state.currentAction === "uploading" || state.currentAction === "upload-finished") cancelUploading()
    editText.value = yourMsg.innerText.trim()
    input.value = msgText.innerText.trim()
    input.focus()

    state.currentAction = "edit"
    state.editing = messageId
  }

  editBtn.onclick = () => {
    if (editDivStyle.getPropertyValue("display") === "none") editDiv.style.display = "flex"
    chatTransmiter.style.maxWidth = "100%"
  }

  editClose.onclick = () => {
    if (editDivStyle.getPropertyValue("display") === "flex") editDiv.style.display = "none"
    chatTransmiter.style.maxWidth = "90%"
  }
}

const generateOthersFileMsg = message => {
  const { text, RoomId, senderId, repliedTo, createdAt, sender, FileId, File } = message
  const messageId = message.id
  let commentedDisplay = ""
  let commentedText = ""
  let commentedSender = ""
  let filePart = ""
  let fileLink = ""
  switch (
    File.mimeType.split("/")[0] // file extention
  ) {
    case "image":
      filePart = `<img
        src="/uploads/${File.fileName}"
        style="
          max-height: 500px;
          max-width: 500px;
          height: auto;
          width: auto;
        "
      />`
      break

    case "audio":
      filePart = `<audio controls>
        <source src="/uploads/${File.fileName}" type="${File.mimeType}">
      </audio>`
      break

    default:
      fileLink = `(<a href="/uploads/${File.fileName}">${File.originalName}</a>)` + text ? ` - ` : ""
      break
  }
  if (repliedTo && (repliedTo.text !== null || (repliedTo.File && repliedTo.File.originalName !== null))) {
    commentedDisplay = "d-flex"
    commentedText = repliedTo.text ? repliedTo.text : repliedTo.File.originalName
    commentedSender = repliedTo.sender.name
  }
  const item = `<div class="chat-reciever-container" id="message-${messageId}">
    <div
      class="commented-text p-1 ${commentedDisplay}"
      id="commented-${messageId}"
    >
    ${commentedSender}: ${commentedText}
    </div>
    <div class="chat-reciever" id="chatReciever-${messageId}">
      <div class="d-flex flex-column">
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
        ${filePart}
        <div
          class="d-flex justify-content-start align-items-center px-2 my-1"
        >
          <p
            class="message-text ms-2 mb-0"
            id="yourMsg-${messageId}"      
          >
            ${fileLink}span id="msgText-${messageId}">${text}</span>
          </p>
        </div>
        <div
          class="d-flex justify-content-end align-items-center px-2 mt-1"
        >
          <small class="dateTime-text text-secondary">05/11</small>
          <small class="dateTime-text text-secondary ms-2">06:13</small>
        </div>
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
    if (commentMsgStyle.getPropertyValue("display") === "none") {
      commentMsg.style.display = "flex"
    }
    if (editingMsgStyle.getPropertyValue("display") === "flex") {
      editingMsg.style.display = "none"
      input.value = ""

      state.editing = 0
    } else if (state.currentAction === "uploading" || state.currentAction === "upload-finished") cancelUploading()
    commentedName.innerHTML = sender.name
    cmntText.value = yourMsg.innerHTML.trim()
    input.focus()

    state.currentAction = "reply"
    state.repliedTo = messageId
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

const selectChat = roomId => {
  if (state.currentRoom === 0) inputSection.classList.remove("d-none")
  if (state.currentRoom !== 0) document.getElementById(`room-${state.currentRoom}`).classList.remove("active")
  document.getElementById(`room-${roomId}`).classList.add("active")
  messageList.innerHTML = ""
  document.getElementById(`msgCount-${roomId}`).innerText = ""
  input.focus()

  state.currentRoom = roomId

  socket.emit("roomData", roomId)
}

const cancelUploading = () => {
  if (fileUploadBox.style.display === "flex") fileUploadBox.style.display = "none"

  // currentAction is either 'uploading' or 'upload-finished'
  if (state.currentAction === "uploading") {
    uploadController.abort()
  } else {
    socket.emit("deleteFile", state.uploadingFile.fileName)
  }
  state.currentAction = "none"
  state.uploadingFile = {}
  state.uploadingText = ""
}

const onUploadProgress = () => {
  const percentage = Math.round((100 * event.loaded) / event.total)
  percentageElement.innerHTML = percentage + "%"
  progressBarElement.setAttribute("aria-valuenow", percentage)
  progressBarElement.style.width = percentage + "%"
}

const pvRoomDataHandler = roomName => {
  let ids = roomName.split("|#|")
  ids = ids.map(id => Number(id))
  if (ids[0] === userId) {
    return {
      pvUserName: state.allUsers[ids[1]].name,
      pvUserId: ids[1],
    }
  } else
    return {
      pvUserName: state.allUsers[ids[0]].name,
      pvUserId: ids[0],
    }
}

const handleNewRoom = newRoom => {
  let { id, name } = newRoom
  let onlineStatus = ""
  if (name.includes("|#|")) {
    const { pvUserName, pvUserId } = pvRoomDataHandler(name)
    name = pvUserName
    onlineStatus = `<div 
      class="user-status-div ${state.allUsers[pvUserId].isOnline ? "user-online" : ""}" 
      id="onlineStatus-${pvUserId}"
    ></div>`
  }
  state.userRooms.push({ id, name })

  const msgPreviewSender = ""
  const msgPreview = "هنوز پیامی نیست"
  const createdAt = ""
  let item = `
    <li id="room-${id}" class="text-end p-2 w-100 border-bottom">   
      <a
        onclick="selectChat(${id})"
        class="chats-list-link w-100 d-flex flex-row-reverse justify-content-start align-items-center"
        href="#"
      >
        <div class="user-img mx-">
          <img src="/images/user-img.webp" alt="" style="
            width: 70px;
          ">
          ${onlineStatus}
        </div>
        <div class="user-msg mx-3" style='width: calc(100% - 100px);'>
          <div class="user-name">
            <span id="msgCount-${id}" class="badge rounded-pill bg-primary"></span>
            ${name}
          </div>
          <div 
            class="user-message text-secondary"
            id="lastText-${id}"
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
            id="lastDate-${id}"
          >
            ${createdAt}
          </small>
        </div>
      </a>
    </li>`
  chatList.insertAdjacentHTML("afterbegin", item)
}

socket.on("newUser", user => {
  state.allUsers[user.id] = {
    ...user,
    isOnline: true,
  }
})

socket.on("userOnline", userId => {
  state.allUsers[userId] ? (state.allUsers[userId].isOnline = true) : 0
  const userOnlineStatus = document.getElementById(`onlineStatus-${userId}`)
  userOnlineStatus ? userOnlineStatus.classList.add("user-online") : 0
})

socket.on("userOffline", userId => {
  state.allUsers[userId] ? (state.allUsers[userId].isOnline = false) : 0
  const userOnlineStatus = document.getElementById(`onlineStatus-${userId}`)
  userOnlineStatus ? userOnlineStatus.classList.remove("user-online") : 0
})

socket.on("newUserInRoom", user => {
  state.roomUsers.push(user)
})

socket.on("addedToNewRoom", handleNewRoom)

socket.on("createdNewRoom", data => {
  const { room, isNew } = data
  if (isNew) {
    handleNewRoom(room)
    chatList.scrollTop = 0
  }
  selectChat(room.id)
})

socket.once("allUsers&MyRooms", data => {
  const { rooms, users, connectedUsers } = data
  for (let user of users) {
    state.allUsers[user.id] = {
      ...user,
      isOnline: connectedUsers.includes(user.id.toString()) ? true : false,
    }
  }
  state.userRooms = rooms
  for (let room of rooms) {
    let msgPreviewSender
    let msgPreview
    let createdAt
    if (!room.hasOwnProperty("lastMessage")) {
      msgPreviewSender = ""
      msgPreview = "هنوز پیامی نیست"
      createdAt = ""
    } else {
      msgPreviewSender = room.lastMessage["sender.name"] + " :"
      createdAt = room.lastMessage.createdAt
      if (room.lastMessage.text && !room.lastMessage.file) msgPreview = room.lastMessage.text
      else if (!room.lastMessage.text && room.lastMessage.file) msgPreview = room.lastMessage.file
      else msgPreview = `(File) ${room.lastMessage.text}`
    }
    let roomName = room.name
    let onlineStatus = ""
    if (roomName.includes("|#|")) {
      const { pvUserName, pvUserId } = pvRoomDataHandler(roomName)
      roomName = pvUserName
      onlineStatus = `<div 
        class="user-status-div ${state.allUsers[pvUserId].isOnline ? "user-online" : ""}" 
        id="onlineStatus-${pvUserId}"
      ></div>`
    }
    const item = `
    <li
      id="room-${room.id}" 
      class="list-group-item text-end p-2 w-100 border-bottom"
    >
      <a
        onclick="selectChat(${room.id})"
        class="chats-list-link w-100 d-flex flex-row-reverse justify-content-start align-items-center"
        href="#"
      >
        <div class="user-img mx-">
          <img src="/images/user-img.webp" alt="" style="
            width: 70px;
          ">
          ${onlineStatus}
        </div>
        <div class="user-msg mx-3" style='width: calc(100% - 100px);'>
          <div class="user-name">
            <span id="msgCount-${room.id}" class="badge rounded-pill bg-primary">${room.messageCount ? room.messageCount : ""}</span>
            ${roomName}
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

socket.on("newTextMessage", message => {
  const { text, RoomId, senderId, repliedTo, createdAt } = message
  if (state.currentRoom === RoomId) {
    if (senderId === userId) generateOwnTextMsg(message)
    else {
      generateOthersTextMsg(message)
      socket.emit("seen", state.currentRoom)
    }
  } else {
    const chatMsgCountElement = document.getElementById(`msgCount-${RoomId}`)
    const chatMsgCount = Number(chatMsgCountElement.innerText)
    chatMsgCountElement.innerText = chatMsgCount + 1
  }
  document.getElementById(`lastText-${RoomId}`).innerHTML = text
  document.getElementById(`lastDate-${RoomId}`).innerHTML = createdAt
  const chatItems = document.getElementsByTagName("li")
  chatItems[0].parentNode.insertBefore(chatItems[`room-${RoomId}`], chatItems[0])
})

socket.on("newFileMessage", message => {
  const { text, RoomId, senderId, repliedTo, createdAt, File } = message
  console.log(File)
  if (state.currentRoom === RoomId) {
    if (senderId === userId) generateOwnFileMsg(message)
    else {
      generateOthersFileMsg(message)
      socket.emit("seen", state.currentRoom)
    }
  } else {
    const chatMsgCountElement = document.getElementById(`msgCount-${RoomId}`)
    const chatMsgCount = Number(chatMsgCountElement.innerText)
    chatMsgCountElement.innerText = chatMsgCount + 1
  }
  document.getElementById(`lastText-${RoomId}`).innerHTML = text ? text : `(${File.originalName})`
  document.getElementById(`lastDate-${RoomId}`).innerHTML = createdAt
  const chatItems = document.getElementsByTagName("li")
  chatItems[0].parentNode.insertBefore(chatItems[`room-${RoomId}`], chatItems[0])
})

socket.on("roomData", data => {
  const { Messages, Users } = data
  let roomName = data.name
  if (roomName.includes("|#|")) {
    const { pvUserId, pvUserName } = pvRoomDataHandler(roomName)
    roomName = pvUserName
  }
  currentRoomName.innerText = roomName
  state.roomUsers = Users
  for (let message of Messages.reverse()) {
    if (message.senderId === userId) {
      if (message.FileId) generateOwnFileMsg(message)
      else generateOwnTextMsg(message)
    } else {
      if (message.FileId) generateOthersFileMsg(message)
      else generateOthersTextMsg(message)
    }
  }
  msgListSection.scrollTo(0, messageList.scrollHeight)
  socket.emit("seen", state.currentRoom)
})

socket.on("editMessage", editedMsg => {
  if (editedMsg.RoomId === state.currentRoom) {
    document.querySelector(`#msgText-${editedMsg.id}`).innerHTML = editedMsg.text
  }
})

socket.on("deleteMessage", data => {
  const { messageId, roomId } = data
  if (state.currentRoom === roomId) {
    const deletedMessage = document.getElementById(`message-${messageId}`)
    if (document.contains(deletedMessage)) deletedMessage.remove()
  }
})

socket.on("seen", roomId => {
  if (state.currentRoom === roomId) {
    const unseens = document.querySelectorAll(".bi-check")
    for (unseenMsg of unseens) {
      unseenMsg.classList.replace("bi-check", "bi-check-all")
    }
  }
})

editingMsgClose.onclick = () => {
  editingMsg.style.display = "none"
  input.value = ""

  state.currentAction = "none"
  state.editing = 0
}

commentMsgClose.onclick = () => {
  commentMsg.style.display = "none"

  state.currentAction = "none"
  state.repliedTo = 0
}

sendButton.onclick = e => {
  if (input.value) {
    let newMessage = {}
    switch (state.currentAction) {
      case "reply":
        commentMsg.style.display = "none"

        newMessage.repliedToId = state.repliedTo

        state.repliedTo = 0
        state.currentAction = "none"

      case "none":
        newMessage.text = input.value
        newMessage.roomId = state.currentRoom
        socket.emit("newTextMessage", newMessage)

        input.value = ""
        break

      case "edit":
        socket.emit("editMessage", {
          id: state.editing,
          text: input.value,
        })

        editingMsg.style.display = "none"
        input.value = ""

        state.editing = 0
        state.currentAction = "none"
        break

      case "uploading":
        state.uploadingText = input.value
        lockControls()
        break

      case "upload-finished":
        socket.emit("newFileMessage", {
          text: input.value,
          roomId: state.currentRoom,
          fileInfo: state.uploadingFile,
        })

        fileUploadBox.style.display = "none"
        input.value = ""

        state.currentAction = "none"
        state.uploadingFile = {}
        break
      default: //wtf?
        console.log(state.currentAction)
        break
    }
  } else {
    switch (state.currentAction) {
      case "uploading":
        state.uploadingText = "MESSAGE_SENT_WITHOUT_TEXT_BUT_WITH_FILE"
        lockControls()
        break

      case "upload-finished":
        socket.emit("newFileMessage", {
          roomId: state.currentRoom,
          fileInfo: state.uploadingFile,
        })

        fileUploadBox.style.display = "none"

        state.currentAction = "none"
        state.uploadingFile = {}
        break
    }
  }
}

fileUploadButton.onclick = () => {
  var inputElement = document.createElement("input")
  inputElement.type = "file"
  // Set accept to the file types you want the user to select.
  // Include both the file extension and the mime type
  // inputElement.accept = accept;
  inputElement.addEventListener("change", async () => {
    state.currentAction = "uploading"

    const file = inputElement.files[0]
    fileName.innerHTML = file.name
    fileUploadBox.style.display = "flex"

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await axios({
        method: "post",
        url: "/upload",
        data: formData,
        signal: uploadController.signal,
        onUploadProgress,
      })

      const { originalname, filename, size, mimetype } = res.data
      state.uploadingFile = {
        originalName: originalname,
        fileName: filename,
        size,
        mimeType: mimetype,
      }

      // currentAction === uploading
      if (state.uploadingText) {
        socket.emit("newFileMessage", {
          text: state.uploadingText !== "MESSAGE_SENT_WITHOUT_TEXT_BUT_WITH_FILE" ? state.uploadingText : "",
          roomId: state.currentRoom,
          file: state.uploadingFile,
        })

        fileUploadBox.style.display = "none"
        progressBarElement.classList.remove("bg-success")
        progressBarElement.classList.add("bg-info")
        progressBarElement.classList.add("progress-bar-striped")
        unlockControls()

        state.uploadingFile = {}
        state.uploadingText = ""
        state.currentAction = "none"
      } else {
        progressBarElement.classList.add("bg-success")
        progressBarElement.classList.remove("bg-info")
        progressBarElement.classList.remove("progress-bar-striped")

        state.currentAction = "upload-finished"
      }
    } catch (err) {
      console.log("axios error: ", err)
    }
  })

  inputElement.dispatchEvent(new MouseEvent("click"))
}

fileUploadBoxClose.onclick = cancelUploading

newRoomButton.onclick = () => {
  for (let user of Object.values(state.allUsers)) {
    if (user.id === userId) {
      continue
    }
    const { name, phoneNumber, id } = user
    const item = `<li
      class="list-group-item rounded-0 d-flex align-items-center justify-content-between"
    >
      <div class="custom-control custom-radio">
        <input
          class="custom-control-input"
          id="check-user-${id}"
          type="checkbox"
          name="selectedUsers"
        />
        <label
          class="custom-control-label"
          for="check-user-${id}"
        >
          <p class="mb-0" id="user-name${id}">${name}</p>
          <span class="small font-italic text-muted">${phoneNumber}</span>
        </label>
      </div>
      <label for="check-user-${id}"
        ><img
          src="/images/user-img.webp"
          alt=""
          width="60"
      /></label>
    </li>`
    allUsersList.insertAdjacentHTML("beforeend", item)
    allUsersList.scrollTop = 0
  }
}

createThisNewRoom.onclick = () => {
  const checkedBoxes = document.querySelectorAll('input[name="selectedUsers"]:checked')
  const newRoomUserIds = Array.from(checkedBoxes).map(box => box.id.substring(11)) // check-user-${id}
  if (newRoomUserIds.length > 1) {
    newRoomUsersModal.hide()
    newRoomNameModal.show()
    allUsersList.innerHTML = ""
    roomNameModalMsg.innerText = ""

    state.currentAction = "new-group"
    state.newRoomUsers = newRoomUserIds.map(userId => Number(userId))
  } else if (newRoomUserIds.length === 1) {
    newRoomUsersModal.hide()
    allUsersList.innerHTML = ""
    roomNameModalMsg.innerText = ""

    socket.emit("newPvRoom", newRoomUserIds[0])
  } else {
    userSelectModalMsg.innerText = "اعضای گروه نمی تواند خالی باشد"
  }
}

confirmRoomName.onclick = () => {
  const roomName = newRoomName.value
  if (!roomName) roomNameModalMsg.innerText = "نام گروه نمی تواند خالی باشد"
  else {
    roomNameModalMsg.innerText = ""
    newRoomNameModal.hide()

    socket.emit("newGpRoom", { name: roomName, userIds: state.newRoomUsers })

    state.currentAction = "none"
    state.newRoomUsers = []
  }
}

inputForm.onsubmit = e => {
  e.preventDefault()
  sendButton.click()
}

// msgListSection.addEventListener("scroll", e => {
//   if (e.target.scrollTop === 0)
//     console.log(111111111111)
// })

// fileUploadButton.addEventListener("click", function () {
//   if (microphoneBtn.classList.contains("notclicked")) {
//     microphoneBtn.classList.replace("notclicked", "clicked")
//   } else if (microphoneBtn.classList.contains("clicked")) {
//     microphoneBtn.classList.replace("clicked", "notclicked")
//   }
// })
