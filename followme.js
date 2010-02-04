var iters = 0;
var polling = 0;
var trigger = null;

var goog = 'YOUR_GOOGLEMAPS_APIKEY';

function followme(purge){

    if (polling){
	return;
    }

    if (purge){
	purge_history();
    }

    var doThisOnSuccess = function(lat, lon){
	polling = 0;

        var lat = Number(lat).toFixed(6);
        var lon = Number(lon).toFixed(6);

        var lat_short = Number(lat).toFixed(4);
        var lon_short = Number(lon).toFixed(4);

	var current_loc = lat_short + ',' + lon_short;
	var d = new Date();

	try {

	    var coords = expand_coords(localStorage.getItem('followme.coords'));
	    var cycles = localStorage.getItem('followme.cycles');
	    var last_loc = localStorage.getItem('followme.lastloc');

	    if ((last_loc != '') && (last_loc == current_loc)){

		localStorage.setItem("followme.cycles", parseInt(cycles) + 1);

		update_status('YOU WERE STILL HERE @ ' + d);

		if (iters == 1){
		    display_location(lat, lon);
		    display_map(lat, lon, coords);
		}

		return;
	    }

	    coords.push(new Array(lat, lon, d.getTime()));

	    localStorage.setItem('followme.coords', collapse_coords(coords));

	    localStorage.setItem('followme.lastloc', current_loc);
	    localStorage.setItem('followme.lastseen', d.getTime());
	    localStorage.setItem('followme.cycles', 1);

	    update_status('YOU WERE HERE @ ' + d);

	    display_map(lat, lon, coords);
	}

	catch(e){
	    update_status('YOU ARE HERE (but there was a problem: ' + e + ')');
	}

	display_location(lat, lon, d);
    };

    var doThisIfNot = function(error_msg){
	polling = 0;

	var html = 'ROBOT MONKEYS ARE LOST: ';
	html += error_msg;
	update_status(html);
    };

    var loc = new info.aaronland.geo.Location({});

    if (! loc.survey()){
	update_status('I CAN\'T FIND YOU');
	return;
    }

    loc.findMyLocation(doThisOnSuccess, doThisIfNot);

    var one_min = 60000;
    var delay = one_min * 2;

    trigger = setTimeout(function(){
	    followme();
    }, delay);

    polling = 1;
    iters += 1;

    update_status('I AM LOOKING FOR YOU');
    return;
}

function update_status(msg){
    var container = document.getElementById("status");
    container.innerHTML = msg;
}

function display_location(lat, lon, d){

    var pt = lat + ', ' + lon;

    var html = '<a href="geo:' + pt + '">' + pt + '</a>';

    var container = document.getElementById("location");
    container.innerHTML = html;
}

function display_map(lat, lon, coords){

    var path = make_map_path(coords);
    var dims = 250;

    var pt = lat + ',' + lon;

    var src = 'http://maps.google.com/maps/api/staticmap?center=' + lat + ',' + lon;
    src += '&path=color:0x0000ff|weight:5' + path;
    src += '&size=' + dims + 'x' + dims + '&sensor=false&key=' + goog;
    src += '&zoom=15&markers=size:mid|color:white|' + pt;
    //src += '&mobile=true';

    var img = '<a href="' + src + '">';
    img += '<img src="' + src + '" height="' + dims + '" width="' + dims + '" id="map_img" />';
    img += '</a>';

    var container = document.getElementById("map");
    container.innerHTML = img;

    var controls = document.getElementById('controls');

    // this probably shouldn't be here but whatever...

    if (! controls.style.display){
	controls.style.display = 'block';
    }

}

function make_map_path(coords){

    var points = new Array();

    var count = coords.length;
    var offset = 0;
    var max = 75;

    if (count > max){
	offset = count - max;
    }

    for (var i=offset; i < count; i++){
	points.push(coords[i][0] + ',' + coords[i][1]);
    }

    return points.join('|');
}
function expand_coords(coords){

    var expanded = new Array();

    if ((coords == null) || (coords == '')){
	return expanded;
    }

    var parts = coords.split('|');
    var count = parts.length;

    for (var i=0; i < count; i++){
	expanded.push(parts[i].split(','));
    }

    return expanded;
}

function collapse_coords(coords){

	var collapsed = new Array();

	var count = coords.length;

	for (var i=0; i < count; i++){
	    collapsed.push(coords[i].join(','))
	}

	return collapsed.join('|');
}

function export_history(){

    var result = '';

    try{
	var coords = localStorage.getItem('followme.coords');
	coords = expand_coords(coords);
	result = JSON.stringify(coords);
    }

    catch (e){
	result = 'EXPORT SAYS NO (ALSO: "' + e + '")';
    }

    var container = document.getElementById('main');
    container.innerHTML = result;
}

function purge_history(){

    var doit = confirm('ARE YOU SURE YOU WANT TO PURGE YOUR LOCATION HISTORY?');

    if (! doit){
	update_status('OKAY! YOUR LOCATION HISTORY IS STILL THERE.');
	return 1;
    }

    var ok = 0;

    try{
	localStorage.setItem('followme.coords', null);
	localStorage.setItem('followme.lastloc', null);
	localStorage.setItem('followme.cycles', null);
	localStorage.setItem('followme.lastseen', null);

	ok = 1;
    }

    catch (e){
	alert('FAILED TO PURGE HISTORY: ' + e);
	return 0;
    }

    if (ok){

	if (trigger){
	    clearTimeout(trigger);
	}

	location.href = '/followme';
    }
}
