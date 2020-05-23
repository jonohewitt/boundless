let monthIndex = 0;
let paused = false;
const slider = document.querySelector("input.speed");
const initialSpeed = 500;
let speed = initialSpeed;

const colors = [
  "var(--chrome)",
  "var(--ie)",
  "var(--firefox)",
  "var(--safari)",
  "var(--opera)",
  "var(--android)"
];

const svg = d3.select("svg");

svg.attr("width", 640).attr("height", 640);

const pieGroup = svg.append("g").attr("transform", "translate(320, 320)");

const monthLabel = d3.select("div.month");

const updateGraph = function() {
  const month = new Date(2009, monthIndex, 1);
  const monthFormat = d3.timeFormat("%b %Y");
  monthLabel.text(monthFormat(month));

  const labels = d3.selectAll("span.marketShare").data(data[monthIndex]);

  labels
    .transition()
    .duration(speed)
    .tween("text", function(d, i) {
      const startValue = this.innerText.replace(/\D/g, "");
      const endValue = d;
      const interpolator = d3.interpolate(startValue, endValue);

      return function(t) {
        const share = interpolator(t);

        this.innerText = share > 1 ? `(${Math.round(share)}%)` : "(<1%)";
      };
    });

  const pieGenerator = d3.pie().sort(null);
  const arcData = pieGenerator(data[monthIndex]);
  const arcGenerator = d3
    .arc()
    .innerRadius(200)
    .outerRadius(300);

  const paths = pieGroup.selectAll("path").data(arcData);

  paths
    .enter()
    .append("path")
    .attr("d", arcGenerator)
    .style("fill", (d, i) => colors[i])
    .each(function(d, i) {
      this.savedValue = d;
    });

  paths
    .transition()
    .duration(speed)
    .ease(d3.easeLinear)
    .attrTween("d", function(d, i) {
      const startValue = this.savedValue;
      const endValue = d;
      const curve = d3.interpolate(startValue, endValue);

      this.savedValue = d;
      return function(t) {
        return arcGenerator(curve(t));
      };
    });
};

let loop = null;

const startLoop = function(startIndex) {
  monthIndex = startIndex;
  d3.select("a.restart").classed("button-highlight", false);
  d3.select("a.pause").classed("button-disabled", false);
  updateGraph();

  clearInterval(loop);

  loop = setInterval(function() {
    monthIndex++;

    if (!paused) {
      if (monthIndex < data.length) {
        updateGraph();
      } else {
        d3.select("a.restart").classed("button-highlight", true);
        d3.select("a.pause").classed("button-disabled", true);

        clearInterval(loop);
      }
    } else {
      clearInterval(loop);
    }
  }, speed);
};

startLoop(0);

document.querySelector("a.restart").addEventListener("click", function() {
  startLoop(0);
});

document.querySelector("a.pause").addEventListener("click", function() {
  if (monthIndex < data.length) {
    paused = !paused;
    const pauseButton = d3.select("a.pause");

    if (paused) {
      pauseButton
        .html("Play <i class='fas fa-play'></i>")
        .classed("button-highlight", true);
    } else {
      pauseButton
        .html("Pause <i class='fas fa-pause'></i>")
        .classed("button-highlight", false);
      startLoop(monthIndex);
    }
  }
});

const speedLabel = d3.select("div.animation-speed span");

slider.addEventListener("input", function() {
  speed = slider.value;
  const label = `x${Math.round((initialSpeed / speed) * 10) / 10}`;
  speedLabel.text(label);
  if (monthIndex < data.length && !paused) {
    startLoop(monthIndex);
  }
});
