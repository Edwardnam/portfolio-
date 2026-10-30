import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  projectsTitle.textContent = `${projects.length} Projects`;
}
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let query = '';
let selectedYear = null; // store the YEAR, not the slice index

// One place that applies BOTH filters
function update() {
  let searchFiltered = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // if the search removed the selected year, clear the selection
  if (selectedYear !== null && !searchFiltered.some((p) => p.year === selectedYear)) {
    selectedYear = null;
  }

  let visible = searchFiltered.filter(
    (p) => selectedYear === null || p.year === selectedYear,
  );

  renderProjects(visible, projectsContainer, 'h2');
  renderPieChart(searchFiltered); // pie shows search results so you can still pick any year
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcs.forEach((arc, i) => {
    let year = data[i].label;
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', year === selectedYear ? 'selected' : '')
      .on('click', () => {
        selectedYear = selectedYear === year ? null : year;
        update();
      });
  });

  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  update();
});

// draw on page load
update();