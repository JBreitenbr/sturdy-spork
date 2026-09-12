function showMonth(period) {
// URL zu deinen Realdaten
const csvUrl = `https://raw.githubusercontent.com/JBreitenbr/Julias-Charts-Data/refs/heads/main/${period.split(" ")[1]}/${period.split(" ")[0]}/stacked.csv`;

// Konfigurationen für die beiden Modi im Dropdown
const modes = {
  stacked: {
    keys: ["vormittags", "nachmittags", "abends", "nachts"],
    colors: /*["#4e79a7", "#f28e2c", "#e15759", "#76b7b2"]*/['#ffd92f','#a6d854','#e78ac3',"#8da0cb"]
  },
  score: {
    keys: ["artist_score"],
    colors: ["#59a14f"]
  }
};

// Globale Variablen für Daten und Zustand
let rawData = [];
let currentMode = "stacked";
d3.select("#chart-container").html("");
// Selektoren
const container = d3.select("#chart-container");
const tooltip = d3.select("#tooltip");
const dropdown = d3.select("#view-select");

// Layout-Konstanten
const margin = { top: 20, right: 30, bottom: 40, left: 160 }; // Mehr Platz links für längere Bandnamen (z.B. Van Der Graaf Generator)
let height = 450; 

// SVG einmalig initialisieren
const svg = container.append("svg").style("width", "100%");
const chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
const xAxisG = chartGroup.append("g").attr("class", "axis x-axis");
const yAxisG = chartGroup.append("g").attr("class", "axis y-axis");

// 1. Daten laden
d3.csv(csvUrl).then(data => {
  // Numerische Werte konvertieren
  rawData = data.map(d => ({
    group: d.group,
    artist_score: +d.artist_score,
    gesamt: +d.gesamt,
    vormittags: +d.vormittags,
    nachmittags: +d.nachmittags,
    abends: +d.abends,
    nachts: +d.nachts
  }));

  // Dynamische Höhe basierend auf der Zeilenanzahl der CSV berechnen
  height = rawData.length * 45 + margin.top + margin.bottom;
  svg.attr("height", height);

  // Event Listener für das Dropdown-Menü
  dropdown.on("change", function() {
    currentMode = this.value;
    render(); // Chart mit neuem Modus neu zeichnen
  });

  // Responsive Überwachung aktivieren
  const resizeObserver = new ResizeObserver(() => render());
  resizeObserver.observe(document.getElementById("chart-container"));

}).catch(error => {
  console.error("Fehler beim Laden der CSV-Daten:", error);
  container.html("<p style='color:red;'>Daten konnten nicht geladen werden.</p>");
});

// 2. Zentrale Render-Funktion
function render() {
  if (rawData.length === 0) return;

  // Aktuelle Containerbreite auslesen
  const width = parseInt(container.style("width"), 10) - margin.left - margin.right;
  svg.attr("width", width + margin.left + margin.right);

  // Modus-spezifische Keys und Farbpalette holen
  const activeKeys = modes[currentMode].keys;
  const colorScale = d3.scaleOrdinal()
    .domain(activeKeys)
    .range(modes[currentMode].colors);

  // Stack-Daten berechnen
  const stackedData = d3.stack().keys(activeKeys)(rawData);

  // Maximalen Wert für die X-Skala ermitteln
  const maxX = /*currentMode === "stacked" 
    ? d3.max(rawData, d => d.vormittags + d.nachmittags + d.abends + d.nachts)
    : d3.max(rawData, d => d.artist_score);*/1200;

  // Skalen aktualisieren
  const x = d3.scaleLinear()
    .domain([0, maxX * 1.05]) // 5% Puffer rechts für bessere Optik
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(rawData.map(d => d.group))
    .range([0, height - margin.top - margin.bottom])
    .padding(0.3);

  // Achsen zeichnen
  xAxisG.attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
    .transition().duration(400)
    .call(d3.axisBottom(x).ticks(Math.max(4, width / 120)));

  yAxisG.transition().duration(400)
    .call(d3.axisLeft(y));

  // --- Datenbindung ---
  
  // 1. Layer-Ebene (Gruppen der Stapel)
  const layers = chartGroup.selectAll(".layer")
    .data(stackedData, d => d.key);

  // Entferne alte Layer, falls sich die Anzahl ändert (z.B. von 4 auf 1)
  layers.exit().remove();

  const layersEnter = layers.enter()
    .append("g")
    .attr("class", "layer");

  const allLayers = layersEnter.merge(layers)
    .attr("fill", d => colorScale(d.key));

  // 2. Balken-Ebene (Die Rechtecke innerhalb der Layer)
  const bars = allLayers.selectAll("rect")
    .data(d => d, d => d.data.group);

  bars.exit().remove();

  const barsEnter = bars.enter().append("rect")
    .attr("y", d => y(d.data.group))
    .attr("x", d => x(d[0]))
    .attr("height", y.bandwidth())
    .attr("width", 0); // Startanimation bei Breite 0

  // Animation und Positions-Update für alle Balken
  barsEnter.merge(bars)
    .transition().duration(400)
    .attr("y", d => y(d.data.group))
    .attr("x", d => x(d[0]))
    .attr("width", d => x(d[1]) - x(d[0]))
    .attr("height", y.bandwidth());

  // Interaktives Tooltip Setup
  barsEnter.merge(bars)
    .on("mouseover", function(event, d) {
      const key = d3.select(this.parentNode).datum().key;
      const val = (d[1] - d[0]).toFixed(2);
      
      tooltip.style("opacity", 1)
        .html(`
          <strong style="color:white;">${d.data.group}</strong><br/>
          <span style="color:${colorScale(key)}">■</span> ${key}: <b>${val}</b> (min)<br/>
            <small>Gesamt-Dauer (min): ${d.data.gesamt}</small><br/>
          <small>Artist-Score: ${d.data.artist_score}</small>
        `);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseleave", function() {
      tooltip.style("opacity", 0);
    });
}
  }
showMonth("August 2026");
d3.select("#selectButton")
      .selectAll('myOptions')
     	.data(['May 2026','June 2026',"July 2026","August 2026"].reverse())
      .enter()
    	.append('option')
      .text(function (d) { return d; }) 
      .attr("value", function (d) { return d; })
function update(selectedGroup) {   
   showMonth(selectedGroup);
}   
d3.select("#selectButton").on("change", function(d) {
        let selectedOption = d3.select(this).property("value")
        update(selectedOption)});
