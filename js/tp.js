
// ----------------------------------------------------------------------------------- //

var tpGlobalChartData = {
  'date': [],
  'hrv': [],
  'lower': [],
  'upper': [],
  'tss': [],
}

// ----------------------------------------------------------------------------------- //

function tpLogin() {

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = async function() {

    if(this.readyState == 4) {
      if(this.status == 200) {
        if(this.responseText) {

          response = JSON.parse(this.responseText);

          if(response && 'user' in response) {

            var tpUserId = response['user']['userId'];

            if(tpUserId) {

              clearInterval(interval);

              $("#alert").removeClass("alert-warning");
              $("#alert").addClass("alert-success");
              $("#alert").text('Connected! Parsing data...');

              await tpGetData(tpUserId, 'metrics');
              await tpGetData(tpUserId, 'workouts');

              $('.spinner').remove();
              drawHRVChart();
              $('#alert').alert('close');
            }
          }
        }
      }
      else {
        $("#alert").removeClass("alert-warning");
        $("#alert").addClass("alert-danger");
        $("#alert").text('Could not connect to TrainingPeaks. Are you logged in?');
        throw new Error('Could not connect to TrainingPeaks. Are you logged in?');
      }
    }
  };

  xmlhttp.open("GET", "https://tpapi.trainingpeaks.com/users/v3/user", true);
  xmlhttp.withCredentials = true;
  xmlhttp.send(); 
}

// ----------------------------------------------------------------------------------- //

async function tpGetData(tpUserId, endpoint) {

  return new Promise((resolve, reject) => {

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = async function() {
      if(this.readyState == 4) {
        if(this.status == 200) {
          var responseData = JSON.parse(this.responseText).reverse();
          if(endpoint == 'metrics') { tpParseHRVData(responseData); }
          if(endpoint == 'workouts') { calculateTSS(responseData); }
          resolve();
        }
        else {
          throw new Error('Failed to download data from TrainingPeaks.');
        }
      }
    };

    var lastDate = new Date();
    lastDate.setDate(lastDate.getDate() - 90);
    var tpWorkoutStartDate = ( lastDate.getFullYear() + '-' + ('0' + (lastDate.getMonth()+1)).slice(-2) + '-' + ('0' + lastDate.getDate()).slice(-2));
    var nowDate = new Date();
    var tpWorkoutEndDate = ( nowDate.getFullYear() + '-' + ('0' + (nowDate.getMonth()+1)).slice(-2) + '-' + ('0' + nowDate.getDate()).slice(-2));

    switch(endpoint) {
      case('metrics'):
        xhr.open("GET", "https://tpapi.trainingpeaks.com/metrics/v2/athletes/" + tpUserId + "/timedmetrics/" + tpWorkoutStartDate + "/" + tpWorkoutEndDate, true);
        break;
      case('workouts'):
        xhr.open("GET", "https://tpapi.trainingpeaks.com/fitness/v1/athletes/" + tpUserId + "/workouts/" + tpWorkoutStartDate + "/" + tpWorkoutEndDate, true);
        break;
    }

    xhr.withCredentials = true;
    xhr.send(); 

  });
}

// ----------------------------------------------------------------------------------- //

function tpParseHRVData(metricData) {

  var hrvData = {};

  if(metricData && metricData.length > 0) {
    for(i = 0; i < metricData.length; i++) {
      timeStamp = metricData[i]['timeStamp'];
      for(x = 0; x < metricData[i]['details'].length; x++) {
        if(metricData[i]['details'][x].type == 60) {
          hrvData[timeStamp] = metricData[i]['details'][x].value;
        }
      }
    }
    calculateHRV(hrvData);
  }
  else {
    throw new Error('No HRV data to parse.');
  }
}

// ----------------------------------------------------------------------------------- //

function calculateHRV(data) {

  for(offset = 0; offset < 90; offset++) {

    var endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);
    endDate.setHours(0, 0, 0);
    endDate.setMilliseconds(0);

    var weekBack = new Date();
    weekBack.setDate(weekBack.getDate() - 7 - offset);
    weekBack.setHours(0, 0, 0);
    weekBack.setMilliseconds(0);

    var monthBack = new Date();
    monthBack.setMonth(monthBack.getMonth() - 1);
    monthBack.setDate(monthBack.getDate() - offset);
    monthBack.setHours(0, 0, 0);
    monthBack.setMilliseconds(0);

    maskedData = getDataFromSet(data, monthBack, weekBack, endDate);
    weekData = Object.values(maskedData[0]);
    monthData = Object.values(maskedData[1]);

    if(monthData.length < 10 | weekData.length < 3) { continue; }
    
    weekMean = math.mean(weekData);
    monthMean = math.mean(monthData);
    monthStd = math.std(monthData);
    lower = monthMean - (monthStd / 2);
    upper = monthMean + (monthStd / 2);

    tpGlobalChartData['date'].push(endDate.getMonth() + '/' + endDate.getDate());
    tpGlobalChartData['hrv'].push(weekMean);
    tpGlobalChartData['lower'].push(lower);
    tpGlobalChartData['upper'].push(upper);
  }
}


// ----------------------------------------------------------------------------------- //

function calculateTSS(data) {

  for(offset = 0; offset < 90; offset++) {

    var endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);
    endDate.setHours(0, 0, 0);
    endDate.setMilliseconds(0);

    var weekBack = new Date();
    weekBack.setDate(weekBack.getDate() - 7 - offset);
    weekBack.setHours(0, 0, 0);
    weekBack.setMilliseconds(0);

    tss = getTSSFromSet(data, weekBack, endDate);
    tpGlobalChartData['tss'].push(tss);

  }
}

// ----------------------------------------------------------------------------------- //

function getDataFromSet(data, monthBack, weekBack, endDate) {

  var weekData = {};
  var monthData = {};

  for(const [key, value] of Object.entries(data)) {
    date = new Date(key);
    if(date >= weekBack & date < endDate) {
      weekData[date] = value;
    }
    if(date >= monthBack & date < endDate) {
      monthData[date] = value;
    }
  }

  return [weekData, monthData];
}

// ----------------------------------------------------------------------------------- //

function getTSSFromSet(data, weekBack, endDate) {

  var tss = 0;

  for(i = 0; i < data.length; i++) {
    date = new Date(data[i].workoutDay);
    if(date >= weekBack & date < endDate) {
      tss += data[i].tssActual;
    }
  }

  return tss;
}