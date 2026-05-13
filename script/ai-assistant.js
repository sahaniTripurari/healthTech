
/* CHAT */

async function askAI(){
const input=document.getElementById("userInput");
const chat=document.getElementById("chatContainer");

let q=input.value.trim();
if(!q) return;

chat.innerHTML+=`<div class="message user">${q}</div>`;
input.value="";

let ai=document.createElement("div");
ai.className="message";
chat.appendChild(ai);

try{
const res=await fetch("/api/ai-assistant",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({question:q})
});

const data=await res.json();
let text=data.answer;
let i=0;

function type(){
if(i<text.length){
ai.innerHTML+=text.charAt(i);
i++;
setTimeout(type,12);
}
}
type();

}catch{
ai.innerHTML="AI connection error.";
}
}

/* VOICE */

let recognition;
let voiceBtn=document.getElementById("voiceBtn");

function startVoice(){
if(!("webkitSpeechRecognition" in window)){
alert("Voice not supported");
return;
}

voiceBtn.classList.add("active");

recognition=new webkitSpeechRecognition();
recognition.lang="en-US";

recognition.onresult=(e)=>{
document.getElementById("userInput").value=
e.results[0][0].transcript;
voiceBtn.classList.remove("active");
};

recognition.onend=()=>{
voiceBtn.classList.remove("active");
};

recognition.start();
}
