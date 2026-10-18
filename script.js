// ===== यहाँ अपना content बदलें =====
const events = [
  {type:"Meteor Shower",date:"Oct 21–22, 2026",title:"Orionids",text:"Fast meteors from Halley's Comet debris, around 15–20 per hour. Best pre-dawn."},
  {type:"Meteor Shower",date:"Nov 17–18, 2026",title:"Leonids",text:"Modest shower, ~15 per hour, but source of historic meteor storms."},
  {type:"Lunar",date:"Nov 24, 2026",title:"Supermoon — Full Beaver Moon",text:"Closest full Moon of the year. Great for lunar photography."},
  {type:"Meteor Shower",date:"Dec 13–14, 2026",title:"Geminids Meteor Shower",text:"Strongest shower of the year — up to 120 per hour.",best:true},
  {type:"Solstice & Shower",date:"Dec 21, 2026",title:"December Solstice + Ursids",text:"Longest night in the north, with the quiet Ursid shower."},
  {type:"Meteor Shower",date:"Jan 3–4, 2027",title:"Quadrantids",text:"Sharp, short peak with bright blue meteors. Timing matters."}
];

// अभी वीडियो खाली है। बाद में ऐसे जोड़ें:
// {id:"आपकी_वीडियो_ID",title:"वीडियो का नाम"},
const videos = [
  {
    id: "YLpWKE84JK4",
    title: "Explain the universe episode 01"
  },{
    id: "D3vTUfhOH5Y",
    title: "I captured penumbra lunar eclipse in first time"
  },{
    id: "80ZlCtIe7aE",
    title: "Lemmon C/2025A6 comet I captured first time"
  },{
    id: "MsPL5r02EeU",
    title: "Capturing Blue lava lake on the Moon"
  }
];

// images/ फोल्डर में फोटो डालें और नाम यहाँ लिखें
// नई फोटो जोड़ने के लिए बस एक नई लाइन जोड़ें: {file:"नाम.jpg", alt:"फोटो का नाम"},
const gallery = [
  {file:"supermoon.jpg",     alt:"Super Moon"},
  {file:"jupiter.jpg",       alt:"Jupiter"},
  {file:"lemmon-comet.jpg",  alt:"Comet Lemmon C/2025 A6"},
  {file:"messier7.jpg",      alt:"Messier 7 (Ptolemy Cluster)"},
  {file:"andromeda.jpg",     alt:"Andromeda Galaxy"}
];
// ====================================

document.getElementById("events").innerHTML = events.map(e =>
  `<div class="ev ${e.best?'best':''}"><small>${e.type} · ${e.date}</small><h3>${e.title}</h3><p>${e.text}</p></div>`).join("");

const vl = document.getElementById("videoList");
vl.innerHTML = videos.map(v =>
  `<a class="card vid" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">
    <img loading="lazy" src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg" alt="">
    <h3>${v.title}</h3><p>Watch on YouTube</p></a>`).join("");
if (!videos.length) vl.style.display = "none";

document.getElementById("galleryGrid").innerHTML = gallery.map(g =>
  `<img loading="lazy" src="images/${g.file}" alt="${g.alt}" onerror="this.style.display='none'">`).join("");

const lb = document.getElementById("lightbox");
document.getElementById("galleryGrid").addEventListener("click", e => {
  if (e.target.tagName === "IMG") { lb.querySelector("img").src = e.target.src; lb.classList.add("open"); }
});
lb.onclick = () => lb.classList.remove("open");

const menu = document.getElementById("menu");
document.getElementById("menuBtn").onclick = () => menu.classList.toggle("open");
menu.onclick = () => menu.classList.remove("open");
document.getElementById("yr").textContent = new Date().getFullYear();
