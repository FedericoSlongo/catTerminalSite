function printBash(){
  var dir = "~/";
  const output = document.getElementById("term");
  const currentTime = new Date();
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;output.innerHTML += formattedTime + 
  ' <span style="color: lightgreen;">cat</span>' + 
  '@' + 
  '<span style="color: cyan;">zero</span>:'+
  `<span style="color: yellow;">${dir}</span><br>`;
}