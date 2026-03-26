const text = `  ▄▄▄█████▓ ██░ ██ ▓█████     ▄████▄   ▄▄▄      ▄▄▄█████▓ 
  ▓  ██▒ ▓▒▓██░ ██▒▓█   ▀    ▒██▀ ▀█  ▒████▄    ▓  ██▒ ▓▒ 
  ▒ ▓██░ ▒░▒██▀▀██░▒███      ▒▓█    ▄ ▒██  ▀█▄  ▒ ▓██░ ▒░ 
  ░ ▓██▓ ░ ░▓█ ░██ ▒▓█  ▄    ▒▓▓▄ ▄██▒░██▄▄▄▄██ ░ ▓██▓ ░  
    ▒██▒ ░ ░▓█▒░██▓░▒████▒   ▒ ▓███▀ ░ ▓█   ▓██▒  ▒██▒ ░  
    ▒ ░░    ▒ ░░▒░▒░░ ▒░ ░   ░ ░▒ ▒  ░ ▒▒   ▓▒█░  ▒ ░░    
      ░     ▒ ░▒░ ░ ░ ░  ░     ░  ▒     ▒   ▒▒ ░    ░     
    ░       ░  ░░ ░   ░      ░          ░   ▒     ░       
            ░  ░  ░   ░  ░   ░ ░            ░  ░          
                           ░                              
Welcome to arch  (GNU/Linux 6.19.6-arch1-1)

 System information

  System load:              0.0${Math.floor(Math.random() * 9)+1}
  Usage of /:               87.8% of 479.87GB
  Memory usage:             ${Math.floor(Math.random() * 70)+31}%
  Swap usage:               14%
  Temperature:              ${Math.floor(Math.random() * 50)+51}.0 C
  Processes:                ${Math.floor(Math.random() * 150)+50}
  Users logged in:          ${Math.floor(Math.random() * 2)+1}
  IPv4 address for enp0s25: ${Math.floor(Math.random() * 255)+1}.${Math.floor(Math.random() * 255)+1}.${Math.floor(Math.random() * 255)+1}.${Math.floor(Math.random() * 255)+1}

  => / is using 87.8% of 479.87GB

*** System restart required ***

Last login: Now from 192.168.${Math.floor(Math.random() * 255)+1}.${Math.floor(Math.random() * 255)+1}`;

const lines = text.split("\n");
var called = 0;
const output = document.getElementById("term");

let i = 0;

function printNextLine() {
  if (i < lines.length) {
    output.innerHTML += lines[i] + "<br>";
    i++;
    setTimeout(printNextLine, 200); // 0.2 seconds
  }
  if(i == lines.length && called == 0){
    called = 1;
    printBash();
  }
}
printNextLine();