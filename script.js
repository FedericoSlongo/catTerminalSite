const crt = document.getElementById("crt");

setInterval(() => {
  const brightness = (0.96 + Math.random() * 0.08).toFixed(3);
  const flicker = (0.85 + Math.random() * 0.15).toFixed(3);
  const curve = (5.2 + Math.random() * 1.6).toFixed(2) + "deg";
  const separation = (1.1 + Math.random() * 1.2).toFixed(2) + "px";

  crt.style.setProperty("--brightness", brightness);
  crt.style.setProperty("--flicker", flicker);
  crt.style.setProperty("--curve", curve);
  crt.style.setProperty("--separation", separation);
}, 90);