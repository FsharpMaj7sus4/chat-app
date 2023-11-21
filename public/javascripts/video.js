const recordBtn = document.querySelector('#recordBtn')
const videoBtn = document.querySelector('#videoBtn')

recordBtn.addEventListener('click', function(){
  if(recordBtn.classList.contains('notclicked')) {
    recordBtn.classList.replace('notclicked', 'clicked')
  }
  else if(recordBtn.classList.contains('clicked')){
    recordBtn.classList.replace('clicked', 'notclicked')
  }
})
videoBtn.addEventListener('click', function(){
  if(videoBtn.classList.contains('notclicked')) {
    videoBtn.classList.replace('notclicked', 'clicked')
  }
  else if(videoBtn.classList.contains('clicked')){
    videoBtn.classList.replace('clicked', 'notclicked')
  }
})
