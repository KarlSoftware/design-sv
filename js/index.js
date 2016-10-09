var map = L.map('mapid', {
    center: [62.9, 16],
    zoom: 5,
});

L.tileLayer('https://api.mapbox.com/styles/v1/sbtn/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>, Data: <a href="http://www.arbetsformedlingen.se/Globalmeny/Om-webbplatsen/Oppna-data.html">Arbetsförmedlingen</a>',
    maxZoom: 18,
    id: 'citjymx5f00622imscnenfr6c',
    accessToken: 'pk.eyJ1Ijoic2J0biIsImEiOiJjaXRtdmhwYWMwMDE3Mm5vN2lubXV2c25vIn0.IPGzS7IusNBRX5SHRlterQ'
}).addTo(map);

var highest = 0; // Kommun with highest number of jobs this day

// Date function for archiving AF data
function today() {
    var timestamp = new Date()
    year = '' + timestamp.getFullYear()
    month = timestamp.getMonth() + 1 < 10 ? '0' + timestamp.getMonth() + 1 : timestamp.getMonth() + 1;
    day = timestamp.getDate() < 10 ? '0' + timestamp.getDate() : timestamp.getDate();

    return year + month + day;
}

// AF JSON is read and kn_lan_poly object updated with platser
function ready() {



// Init heatmap
    var heat = L.heatLayer([], {
        radius: 30,
        maxZoom: 5,
        gradient: { .4: "#bbbbbb", .6: "#cccccc", .7: "#dddddd", .8: "#eeeeee", 1: "#ffffff" }
    }).addTo(map);




    // Add relevant points to basemap & update heatmap. density is used to calculate heatmap intensity.
    $.each(kn_points.features, function(i, point) {
        if (point.properties.platser > 0) {
            point.properties.density = 0.0 + (1.0 - 0.0) * (point.properties.platser - 0) / (highest - 0);
            heat.addLatLng([point.geometry.coordinates[1], point.geometry.coordinates[0], point.properties.density]);
        }
    });





    // Style and add polygon map kn_lan_poly
    function style(feature) {
        return {
            fillOpacity: feature.properties.platser > 0 ? 0 : 0.15,
            color: "#ffffff",
            fillColor: feature.properties.platser > 0 ? "" : "#000000",
            weight: feature.properties.platser > 0 ? 0.11 : 0,
        };
    }

    var geoJson = L.geoJson(kn_lan_poly, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);





    










    // Get top 5 ranked kommuner
    var ranking = [];
    var top5 = [];

    $.each(kn_lan_poly.features, function(i, feature) {
        ranking.push(feature.properties);
    });

    ranking.sort(function(a, b) {
        return a.platser - b.platser;
    });

    for (var i = 0; i < ranking.length; i++) {
        ranking[i].platser > 0 ? top5.unshift(ranking[i]) : null;
    }




    // Info panel panel
    var info = L.control({
        position: 'bottomright'
    });

    info.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        //this._div.innerHTML = "<p>Kartläggning av designrelaterade platsannonser från Arbetsförmedlingen. Annonserna uppdateras dagligen och filtreras på yrkesområde 'Kultur, media, design' samt nyckelord 'design'.</p>"
        this._div.innerHTML = "<p>Design: Sweden is a live visualization of design related job listings from Arbetsförmedlingen filtered by category 'Culture, media, design' and the keyword 'design'.</p>"
        return this._div;
    };

    info.addTo(map);



    // Display panel
    var display = L.control({
        position: 'topleft'
    });

    display.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'display'); // create a div with a class "display"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    display.update = function(props) {
        this._div.innerHTML = (props ?
            '<h4>Design: ' + props.knnamn + '</h4><br />' + today() + '<h2>Available positions: ' + props.platser + '</h2>' :
            '<h4>Design: Sweden</h4><br />' + today() + '<h2>Available positions: ' + totalAntalPlatsannonser + '</h2>');
    };
    display.addTo(map);





    // Chart - custom control
    var chart = L.control({
        position: 'topleft'
    });

    chart.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'gchart'); // create a div with a class "gchart"
        this._div.innerHTML = '<div id="gchart"></div>';
        return this._div;
    };
    chart.addTo(map);

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
        data.addColumn('number', 'Available positions');
        data.addColumn({type:'string', role:'annotation'});
        data.addRows(top5.map(function(obj) {
            return [obj.knnamn, obj.platser, obj.knnamn];
        }));

        // Set chart options
        var options = {
            'title': "",
            'titleTextStyle': { 'color': 'white', 'fontSize': 40 },
            'width': '100%',
            'height': 500,
            'backgroundColor': "none",
            'colors': ['white'],
            'legend': { 'position': 'none' },
            'annotations': {'stem': {'length': 5, 'color': 'transparent'}, 'textStyle': {'fontSize': 8}},
            'animation': { 'startup': true, 'duration': 1000 },
            'axisTitlesPosition': 'none',
            'hAxis': { 'textPosition': 'none', 'gridlines': { 'color': 'transparent', 'count': -1 } },
            'vAxis': { 'viewWindow': {'min': 'auto'}, 'textPosition': 'none', 'gridlines': { 'color': 'transparent', 'count': -1 }, 'textStyle': { 'color': "white", 'fontSize': 7 } },
            'bar': { 'groupWidth': '80%' },
            'chartArea': { 'left': 0, 'height': '100%' },
        };

        // Instantiate and draw our chart, passing in some options.
        var gchart = new google.visualization.BarChart(document.getElementById('gchart'));

        // The select handler. Call the chart's getSelection() method
        function selectHandler() {}

        // Listen for the 'select' event, and call my function selectHandler() when
        // the user selects something on the chart.
        google.visualization.events.addListener(gchart, 'select', selectHandler);


        gchart.draw(data, options);
    }










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

        display.update(layer.feature.properties);
    }

    function resetHighlight(e) {
        geoJson.resetStyle(e.target);
        display.update();
    }

    function zoomToFeature(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 1,
            color: '#7eeaee'
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

        display.update(layer.feature.properties);

        map.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            // click: zoomToFeature
        });
    }
}





var totalAntalPlatsannonser = 0;



// Load todays data from AF
//
// var options = {
//   hostname: 'api.arbetsformedlingen.se',
//   path: '/af/v0/platsannonser/matchning?yrkesomradeid=11&nyckelord=design&antalrader=1000',
//   headers: { 'Accept': 'application/json',
//              'Accept-Language': 'sv' 
//            }
// };

// $.getJSON('https://' + options.hostname + options.path, function(jobs) {

var req = new XMLHttpRequest();
req.open("GET", "http://api.arbetsformedlingen.se/af/v0/platsannonser/matchning?yrkesomradeid=11&nyckelord=design&antalrader=1000", true);
req.addEventListener("load", function() {
    console.log(req.status);
    // var jobs = JSON.parse(req.response);

    // totalAntalPlatsannonser = jobs.matchningslista.antal_platserTotal;

    //     $.each(kn_points.features, function(i, point) {
    //         $.each(jobs.matchningslista.matchningdata, function(j, match) {
    //             if (match.kommunnamn == point.properties.knnamn) {
    //                 point.properties.platser == null ? point.properties.platser = 1 : point.properties.platser += 1;
    //                 kn_lan_poly.features[i].properties.platser == null ? kn_lan_poly.features[i].properties.platser = 1 : kn_lan_poly.features[i].properties.platser += 1;

    //             }
    //             kn_lan_poly.features[i].properties.platser == null ? kn_lan_poly.features[i].properties.platser = 0 : null;
    //         });
    //         point.properties.platser > highest ? highest = point.properties.platser : highest = highest;


    //     });

    // ready();
});
req.send(null);

// $.getJSON('http://api.arbetsformedlingen.se/af/v0/platsannonser/matchning?yrkesomradeid=11&nyckelord=design&antalrader=1000', function(jobs) {
// console.log(JSON.parse(req.responseText))
//     })
//     .done(function(jobs) {
//         ready();
//         console.log("Success!");
//     })
//     .fail(function(jqxhr, textStatus, error) {
//         var err = textStatus + ", " + error;
//         console.log("Request Failed: " + err);
//     });

$.getJSON('./json_AF/' + today() + '_json_AF.json', function(jobs) {
        totalAntalPlatsannonser = jobs.matchningslista.antal_platserTotal;

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
        ready();
        console.log("Success!");
    })
    .fail(function(jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log("Request Failed: " + err);
    });