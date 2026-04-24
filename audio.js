//audio

//sound effects
const soundClick = new Audio('media/sounds/click.mp3');
const soundStartup = new Audio('media/sounds/microsoftsound.mp3');
const soundNotif = new Audio('media/sounds/notif.mp3');
const soundTrash = new Audio('media/sounds/trash.mp3');
const soundEvil = new Audio('media/sounds/mad.mp3');
const soundTask = new Audio('media/sounds/notif2.mp3');

//função que dá play ao sound efect
function playSound(audio) {
    audio.currentTime = 0;
    
    //pequena variação no click para que não seja demasiado repetitivo
    if (audio === soundClick) {
        audio.playbackRate = 0.85 + Math.random() * 0.5; 
    } else {
        audio.playbackRate = 1.0; 
    }

    audio.play();
}

document.addEventListener('mousedown', () => {
    playSound(soundClick);
}, true); //true impede que o som não dê play (em caso de stopPropagation por exemplo)

