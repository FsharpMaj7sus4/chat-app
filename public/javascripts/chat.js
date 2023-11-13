socket.emit("allMyRooms")

socket.on("allMyRooms", chatList => {
  for (let room of chatList) {
    let item = `
    <li class="text-end p-2 w-100 border-bottom">   
      <a
        class="chats-list-link w-100 d-flex flex-row-reverse justify-content-start align-items-center"
        href="#"
      >
        <div class="user-img mx-">
          <img
            src="/images/user-img.webp"
            alt=""
          />
          <div class="user-status-div"></div>
        </div>
        <div class="user-msg mx-3">
          <div class="user-name">${room.name}</div>
          <div class="user-message text-secondary">
            ${room.lastMessage.text ? room.lastMessage.text : "هنوز پیامی نیست"}
          </div>
          <small class="msg-time-passed text-secondary"
            >${room.lastMessage.createdAt ? room.lastMessage.createdAt : ''}</small
          >
        </div>
      </a>
    </li>`

    document
      .getElementById("chats-list")
      .insertAdjacentHTML("beforeend", item)
  }
})

//=========================================================
const editBtn = document.querySelector("#editBtn")
const editDiv = document.querySelector("#editDiv")
const msgEdit = document.querySelector("#msgEdit")
const msgComment = document.querySelector("#msgComment")
const editClose = document.querySelector("#editClose")
const editingMsg = document.querySelector("#editingMsg")
const editingMsgClose = document.querySelector("#editingMsgClose")
const chatTransmiter = document.querySelector(".chatTransmiter")
const chatReciever = document.querySelector(".chatReciever")
const userMsgDefault = document.querySelector("#userMsgDefault")
const userEditedMsg = document.querySelector("#userEditedMsg")
const editSubmit = document.querySelector("#editSubmit")
const yourMsg = document.querySelector("#yourMsg")
const commented = document.querySelector("#commented")
const commentSubmit = document.querySelector("#commentSubmit")
const cmntText = document.querySelector("#cmntText")
const microphoneBtn = document.querySelector("#microphoneBtn")
// const userEditedMsg = document.querySelector('#userEditedMsg')

editBtn.addEventListener("click", function () {
  if ((editDiv.style.display = "none")) {
    editDiv.style.display = "flex"
  }
  chatTransmiter.style.maxWidth = "100%"
})
editClose.addEventListener("click", function () {
  if ((editDiv.style.display = "flex")) editDiv.style.display = "none"
  chatTransmiter.style.maxWidth = "90%"
})

msgEdit.addEventListener("click", function () {
  if ((editingMsg.style.display = "none")) {
    editingMsg.style.display = "flex"
  }
  if ((commentMsg.style.display = "flex"))
    commentMsg.style.display = "none"
})
editingMsgClose.addEventListener("click", function () {
  if ((editingMsg.style.display = "flex"))
    editingMsg.style.display = "none"
  userMsgDefault.value = yourMsg.innerHTML
})
microphoneBtn.addEventListener("click", function () {
  if (microphoneBtn.classList.contains("notclicked")) {
    microphoneBtn.classList.replace("notclicked", "clicked")
  } else if (microphoneBtn.classList.contains("clicked")) {
    microphoneBtn.classList.replace("clicked", "notclicked")
  }
})
msgComment.addEventListener("click", function () {
  if ((commentMsg.style.display = "none")) {
    commentMsg.style.display = "flex"
  }
  if ((editingMsg.style.display = "flex"))
    editingMsg.style.display = "none"
})
commentMsgClose.addEventListener("click", function () {
  if ((commentMsg.style.display = "flex"))
    commentMsg.style.display = "none"
})
userMsgDefault.value = yourMsg.innerHTML
userEditedMsg.value = userMsgDefault.value
editSubmit.addEventListener("click", function () {
  yourMsg.innerHTML = userEditedMsg.value
})
commentSubmit.addEventListener("click", function () {
  commented.style.display = "flex"
  commented.innerHTML = cmntText.value
})
