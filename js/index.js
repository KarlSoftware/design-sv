var map = L.map('mapid', {
    center: [63, 15],
    zoom: 4.5,
});


L.tileLayer('https://api.mapbox.com/styles/v1/sbtn/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'citjymx5f00622imscnenfr6c',
    accessToken: 'pk.eyJ1Ijoic2J0biIsImEiOiJjaXRtdmhwYWMwMDE3Mm5vN2lubXV2c25vIn0.IPGzS7IusNBRX5SHRlterQ'
}).addTo(map);



var geoJson;

// Panel - custom control
var info = L.control();

info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function(props) {
    var now = new Date();
    this._div.innerHTML = (props ? '<h4>' + props.knnamn + '</h4><br /><p>' + now.getFullYear() + '-' + now.getMonth() + '-' + now.getDay() + '</p><p><strong><em>Platsannonser: ' + props.platser + '</em></strong></p>' : '');
};

info.addTo(map);




// Listeners & events
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 1,
        color: '#7eeaee'
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geoJson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}



function style(feature) {
    return {
        fillOpacity: 0,
        color: "#7eeaee",
        weight: feature.properties.platser > 0 ? 0.1 : 0,
    };
}

var heat = L.heatLayer([], {
    radius: 30,
    maxZoom: 5,
    gradient: { .4: "#0085da", .6: "#0088a5", .7: "#45b6ba", .8: "#7eeaee", 1: "white" }
}).addTo(map);




var highest = 0;

function today() {
    var timestamp = new Date()
    year = '' + timestamp.getFullYear()
    month = timestamp.getMonth() < 10 ? '0' + timestamp.getMonth() : timestamp.getMonth();
    day = timestamp.getDate() < 10 ? '0' + timestamp.getDate() : timestamp.getDate();

    return year + month + day;
}

// Load todays data from AF
//
$.getJSON('./json_AF/' + today() + '_json_AF.json', function(jobs) {

        $.each(kn_points.features, function(i, point) {
            $.each(jobs.matchningslista.matchningdata, function(j, match) {
                if (match.kommunnamn == point.properties.knnamn) {
                    point.properties.platser == null ? point.properties.platser = 1 : point.properties.platser += 1;
                    kn_lan_poly.features[i].properties.platser == null ? kn_lan_poly.features[i].properties.platser = 1 : kn_lan_poly.features[i].properties.platser += 1;

                }
                kn_lan_poly.features[i].properties.platser == null ? kn_lan_poly.features[i].properties.platser = 0 : null;
            });
            point.properties.platser > highest ? highest = point.properties.platser : highest = highest;


        });

    })
    .done(function(jobs) {
        addPoints();
        console.log("Success!");
    })
    .fail(function(jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log("Request Failed: " + err);
    });


function addPoints() {
    $.each(kn_points.features, function(i, point) {
        if (point.properties.platser > 0) {
            point.properties.density = 0.0 + (1.0 - 0.0) * (point.properties.platser - 0) / (highest - 0);
            heat.addLatLng([point.geometry.coordinates[1], point.geometry.coordinates[0], point.properties.density]);
        }
    });

    geoJson = L.geoJson(kn_lan_poly, { style: style, onEachFeature: onEachFeature }).addTo(map);

    var ranking = [];

    $.each(kn_lan_poly.features, function(i, feature) {
        ranking.push(feature.properties);
    });

    ranking.sort(function(a, b) {
        return a.platser - b.platser;
    });

    var top5 = [];

    for (var i = ranking.length - 5; i < ranking.length; i++) {
        top5.push(ranking[i]);
    }



    // Chart - custom control
    var chart = L.control({
        position: 'bottomright'
    });

    chart.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'char'); // create a div with a class "chart"
        this._div.innerHTML = '<div id="gchart"></div>';
        return this._div;
    };

    chart.addTo(map);

    var data = [{
        x: [top5[0].knnamn, top5[1].knnamn, top5[2].knnamn, top5[3].knnamn, top5[4].knnamn],
        y: [top5[0].platser, top5[1].platser, top5[2].platser, top5[3].platser, top5[4].platser]
    }];

    // Load the Visualization API and the corechart package.
    google.charts.load('current', { 'packages': ['corechart'] });

    // Set a callback to run when the Google Visualization API is loaded.
    google.charts.setOnLoadCallback(drawChart);

    // Callback that creates and populates a data table,
    // instantiates the pie chart, passes in the data and
    // draws it.
    function drawChart() {

        // Create the data table.
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Kommun');
        data.addColumn('number', 'Platser');
        data.addRows( top5.map(function (obj) {
            return [obj.knnamn, obj.platser];
        }));

        // Set chart options
        var options = {
            'title': "",
            'titleTextStyle': {'color': 'white', 'fontSize': 40},
            'width': 400,
            'height': 300,
            'backgroundColor': 'transparent',
            'colors': ['white','white','white','white','white'],
            'legend': {'position': 'none'},
            'animation': { 'startup': true, 'duration': 1000},
            'axisTitlesPosition': 'none',
            'hAxis': {'textPosition': 'none', 'gridlines': {'color': 'transparent', 'count': -1}},
            'vAxis': {'textPosition': 'none', 'textStyle': {'color': "white"}}
        };

        // Instantiate and draw our chart, passing in some options.
        var gchart = new google.visualization.BarChart(document.getElementById('gchart'));
        gchart.draw(data, options);
    }


    console.log(top5);
}