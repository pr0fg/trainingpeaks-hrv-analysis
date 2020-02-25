
// ----------------------------------------------------------------------------------- //

var tpGlobalChartData = {
  'date': [],
  'hrv': [],
  'rhrv': [],
  'lower': [],
  'upper': [],
  'min': 1000
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

              await tpGetData(tpUserId);

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

async function tpGetData(tpUserId) {

  return new Promise((resolve, reject) => {

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = async function() {
      if(this.readyState == 4) {
        if(this.status == 200) {
          var responseData = JSON.parse(this.responseText).reverse();
          tpParseHRVData(responseData);
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

    xhr.open("GET", "https://tpapi.trainingpeaks.com/metrics/v2/athletes/" + tpUserId + "/timedmetrics/" + tpWorkoutStartDate + "/" + tpWorkoutEndDate, true);
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

  var today = new Date();
  today.setDate(today.getDate() + 1);
  today.setHours(0, 0, 0);
  today.setMilliseconds(0);

  var tonight = new Date(today);
  tonight.setHours(23, 59, 59);

  var week = new Date(today);
  week.setDate(today.getDate() - 7);

  var month = new Date(today);
  month.setMonth(today.getMonth() - 1);

  for(offset = 0; offset < 90; offset++) {
    
    today.setDate(today.getDate() - 1);
    tonight.setDate(tonight.getDate() - 1);
    week.setDate(week.getDate() - 1);
    month.setDate(month.getDate() - 1);

    maskedData = getDataFromSet(data, today, tonight, week, month);
    todayData = maskedData[0];
    weekData = Object.values(maskedData[1]);
    monthData = Object.values(maskedData[2]);

    if(!todayData | monthData.length < 10 | weekData.length < 3) { continue; }
    
    hrv = todayData;
    weekMean = math.mean(weekData);
    monthMean = math.mean(monthData);
    monthStd = math.std(monthData);
    lower = monthMean - (monthStd / 2);
    upper = monthMean + (monthStd / 2);
    min = math.min(monthData);

    if(min < tpGlobalChartData['min']) { tpGlobalChartData['min'] = min; }

    tpGlobalChartData['date'].push((today.getMonth() + 1) + '/' + today.getDate());
    tpGlobalChartData['hrv'].push(hrv);
    tpGlobalChartData['rhrv'].push(weekMean);
    tpGlobalChartData['lower'].push(lower);
    tpGlobalChartData['upper'].push(upper);
  }
}

// ----------------------------------------------------------------------------------- //

function getDataFromSet(data, today, tonight, week, month) {

  var todayData = null;
  var weekData = {};
  var monthData = {};

  for(const [key, value] of Object.entries(data)) {
    
    date = new Date(key);

    if(date >= today & date <= tonight) {
      todayData = value;
    }
    if(date >= week & date < today) {
      weekData[date] = value;
    }
    if(date >= month & date < today) {
      monthData[date] = value;
    }
  }

  return [todayData, weekData, monthData];
}

// ----------------------------------------------------------------------------------- //
