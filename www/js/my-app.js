// Determine theme depending on device
var isAndroid = Framework7.prototype.device.android === true;
var isIos = Framework7.prototype.device.ios === true;
 
// Set Template7 global devices flags
Template7.global = {
    android: isAndroid,
    ios: isIos
};
 
// Export selectors engine
var $$ = Dom7;

// Change Through navbar layout to Fixed
if (isAndroid) {
    // Change class
    $$('.view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
    // And move Navbar into Page
    $$('.view .navbar').prependTo('.view .page');
}

// Initialize your app
var myApp = new Framework7({
    material: isAndroid ? true : false,
    template7Pages: true // enable Template7 rendering for Ajax and Dynamic pages
});

// Pull to refresh content
var ptrContent = $('.pull-to-refresh-content');

// Add 'refresh' listener on it
ptrContent.on('refresh', function (e) {
    alert("Doe de refresh");
    // Emulate 2s loading
    setTimeout(function () {
        alert("Ik ga info laden");
        getInfo();
        alert("Ik heb de info geladen");
        // When loading done, we need to reset it
        myApp.pullToRefreshDone();
    }, 2000);
});

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

// Callbacks to run specific code for specific pages, for example for About page:
myApp.onPageInit('*', function (page) {
  console.log(page.name + ' initialized'); 
});

myApp.onPageInit('index', function (page) {
    myApp.showPreloader('Searching');
    function getLocation() {
        navigator.geolocation.getCurrentPosition
        (onSuccess, onError, { enableHighAccuracy: true });
    };
    getLocation();


    function onSuccess (position) {
        Latitude = position.coords.latitude;
        Longitude = position.coords.longitude;
        getHalte(Latitude, Longitude);
    };

    function getHalte(Latitude, Longitude) {
        var url = "https://u-ov.info/index.php/tools/apiDirect.php";
        var Lati = parseInt(1e6 * Latitude, 10);
        var Long = parseInt(1e6 * Longitude, 10);
        var Lati = Lati;
        var Long = Long;
        $$.getJSON ( url, {
            concessie: "47",
            apiType: "dienstregeling/location",
            apiDataType: "json",
            isMobile: "false",
            lat: Lati,
            lon: Long
        }, function (data) {
            var output = '<li class="item-divider">Gevonden haltes</li>';
            if (data.length == 0) {
                output += '<li><div class="item-content"><div class="item-inner"><div class="item-title">Geen haltes gevonden</div></div></div></li>';
            }
            $$.each(data, function(key, val){
                var afstand = parseInt(val.afstand, 10) + " meter";
                var halte_old = val.beschrijving;
                var halte_array = halte_old.split(", ");
                var halte_new = halte_array[1] + ", " + halte_array[0];
                output += '<li><a href="halte.html" class="item-link"><div class="item-content"><div class="item-inner"><div class="item-title">'+halte_new+'</div><div class="item-after">'+afstand+'</div></div></div></a></li>';
            });
            output += '<li class="item-divider">Opgeslagen haltes</li>';
            $$("#halteslijst").html(output);
            myApp.hidePreloader();
        } )
    }

    function onError(error) {
        alert('code: ' + error.code + '\n' +
            'message: ' + error.message + '\n');
    };
    
    $$("#haltezoeken-text").keyup(function () {
        var input = $$(this).val();
        var url = "https://u-ov.info/index.php/tools/apiDirect.php";
        $$.getJSON ( url, {
            concessie: "47",
            apiType: "dienstregeling/zoek",
            apiDataType: "json",
            isMobile: "false",
            z: input
        }, function (data) {
            var output = '<li class="item-divider">Gevonden haltes</li>';
            if (data.length == 0) {
                output += '<li><div class="item-content"><div class="item-inner"><div class="item-title">Geen haltes gevonden</div></div></div></li>';
            }
            $$.each(data, function(key, val){
                if (val.type === "halte") {
                    var halte_old = val.beschrijving;
                    var halte_array = halte_old.split(", ");
                    var halte_new = halte_array[1] + ", " + halte_array[0];
                    output += '<li><a href="halte.html" class="item-link"><div class="item-content"><div class="item-inner"><div class="item-title">'+halte_new+'</div></div></div></a></li>';
                }
            });
            output += '<li class="item-divider">Opgeslagen haltes</li>';
            $$("#halteslijst").html(output);
        } )
    });
    
}).trigger();

myApp.onPageInit('halte', function (page) { 
    function getInfo() {
        var url = "https://u-ov.info/index.php/tools/apiDirect.php";
        $$.get(url, {
            apiType: "dienstregeling/dris-json",
            apiDataType: "html",
            halte: "utrecht/cs-jaarbeursplein",
            is_mobile: "false"
        }, function (data) {
            $$("#dris-hidden").html(data);
            insertDOM();
        })
    }
    getInfo();
    
    function insertDOM() {
        var main_array = Array();
        
        var divs = $("#dris-hidden > div");
        for(var i = 0; i < divs.length; i+=3) {
          divs.slice(i, i+3).wrapAll("<div class='dris-row'></div>");
        }
        
        $(".dris-row").each(function() {
            row_array = Array();
            row_array['Lijn'] = $(this).children('div').eq(0).find("p._lijn").text()
            row_array['Bestemming'] = $(this).children('div').eq(1).find("p._vervallen-strike-through").text();
            row_array['Drukte'] = $(this).children('div').eq(1).find("abbr").attr('title');
            row_array['Tijd'] = $(this).children('div').eq(2).find("p span._vervallen-strike-through").text()
            row_array['oudeTijd'] = $(this).children('div').eq(2).find("p span.depr.dris-depr").text()
            row_array['Onbevestigd'] = $(this).children('div').eq(2).find("p span.dris-status-onbevestigd abbr").attr('title');
            main_array.push(row_array);
        });
        $("#dris-hidden").empty();
        console.log(main_array);
        for(var i = 0; i < main_array.length; i+=1) {
            var current = main_array[i];
            var output = '<li><a href="#" class="item-content"><div class="item-inner"><div class="item-title-row"><div class="item-title">'+current["Bestemming"]+'</div><div class="item-after">'+current['Tijd']+'</div></div><div class="item-subtitle">Lijn '+current["Lijn"]+'. '+current['Drukte']+'</div><div class="item-text">'+current['Onbevestigd']+'</div></div></a></li>'
            $(output).appendTo(".list-block.media-list ul");
        }
    }
})

myApp.onPageInit('about', function (page) {
    console.log("Haha");
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
});

// Generate dynamic page
var dynamicPageIndex = 0;
function createContentPage() {
	mainView.router.loadContent(
        '<!-- Top Navbar-->' +
        '<div class="navbar">' +
        '  <div class="navbar-inner">' +
        '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
        '    <div class="center sliding">Dynamic Page ' + (++dynamicPageIndex) + '</div>' +
        '  </div>' +
        '</div>' +
        '<div class="pages">' +
        '  <!-- Page, data-page contains page name-->' +
        '  <div data-page="dynamic-pages" class="page">' +
        '    <!-- Scrollable page content-->' +
        '    <div class="page-content">' +
        '      <div class="content-block">' +
        '        <div class="content-block-inner">' +
        '          <p>Here is a dynamic page created on ' + new Date() + ' !</p>' +
        '          <p>Go <a href="#" class="back">back</a> or go to <a href="services.html">Services</a>.</p>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>'
    );
	return;
}

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    console.log(device.model);
}