
// ----------------------------------------------------------------------------------- //

window.chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

// ----------------------------------------------------------------------------------- //

$( document ).ready(function() {
	tpLogin();
});

// ----------------------------------------------------------------------------------- //

const interval = setInterval(function() {
   tpLogin();
 }, 30000);

// ----------------------------------------------------------------------------------- //

function drawHRVChart() {

  var ctx = document.getElementById('HRVChart').getContext('2d');
  var HRVChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tpGlobalChartData['date'].reverse(),
      datasets: [{
      	type: 'line',
      	yAxisID: 'A',
        label: 'Lower Threshold',
        fill: false, 
        data: tpGlobalChartData['lower'].reverse(),
        borderColor: window.chartColors.red,
        backgroundColor: window.chartColors.red,
        pointColor: window.chartColors.red,
      }, {
      	type: 'line',
      	yAxisID: 'A',
        label: 'Upper Threshold',
        fill: false,
        data: tpGlobalChartData['upper'].reverse(),
        borderColor: window.chartColors.yellow,
        backgroundColor: window.chartColors.yellow,
        pointColor: window.chartColors.yellow,
      }, {
      	type: 'line',
      	yAxisID: 'A',
        label: 'HRV',
        fill: false,
        data: tpGlobalChartData['hrv'].reverse(),
        borderColor: window.chartColors.green,
        backgroundColor: window.chartColors.green,
        pointColor: window.chartColors.green,
      }, {
      	yAxisID: 'B',
        label: 'TSS',
        fill: false,
        data: tpGlobalChartData['tss'].reverse(),
        borderColor: window.chartColors.grey,
        backgroundColor: window.chartColors.grey,
        pointColor: window.chartColors.grey,
      }]
    },
    options: {
      responsive: true,
      title: {
        display: true,
      },
      scales: {
        xAxes: [{
          display: true,
          label: 'Date',
          scaleLabel: {
            display: true,
            labelString: 'Date'
          },
          gridLines: {
            display: false
          }
        }],
        yAxes: [
        {
          id: 'A',
          display: true,
          label: 'Weekly (Rolling) HRV',
          scaleLabel: {
            display: true,
            labelString: 'Weekly (Rolling) HRV'
          },
          gridLines: {
            display: false
          }
        },
        {
          id: 'B',
          display: true,
          label: 'Weekly (Rolling) TSS',
          scaleLabel: {
            display: true,
            labelString: 'Weekly (Rolling) TSS'
          },
          gridLines: {
            display: false
          }
        }]
      }
    }
  });
}
