// A stringify helper
// Need to replace any double quotes in the data with the HTML char
//  as it is being placed in the HTML attribute data-context
function stringifyHelper(context) {
  var str = JSON.stringify(context);
  return str.replace(/"/g, '&quot;');
}

// Finally, register the helpers with Template7
Template7.registerHelper('stringify', stringifyHelper);

/// Locatie via Cordova ophalen
function locationGet() {
    navigator.geolocation.getCurrentPosition
    (locationSuccess, locationError, { enableHighAccuracy: true });
};

/// Indien de locatie niet opgehaald kan worden, geef een alert met de foutmeding
function locationError(error) {
    myApp.hidePreloader();
    alert('code: ' + error.code + '\n' +
        'message: ' + error.message + '\n');
};

/// Als de locatie is opgehaald, haal dan ook de haltes op
function locationSuccess (position) {
    /// Coordinaten omzetten in de juiste notatie
    var Latitude = parseInt(1e6 * position.coords.latitude, 10);
    var Longitude = parseInt(1e6 * position.coords.longitude, 10);
    
    /// Via de API haltes ophalen mbv AJAX
    var url = "https://u-ov.info/index.php/tools/apiDirect.php";
    $$.getJSON ( url, {
        concessie: "47",
        apiType: "dienstregeling/location",
        apiDataType: "json",
        isMobile: "false",
        lat: Latitude,
        lon: Longitude
    }, function (data) {
        
        /// JSON-lijst met haltes omzetten in li
        halteList("location", data);
        myApp.hidePreloader();
        
        /// Opgehaalde haltes opslaan in een variabele, zodat wanneer op 'Annuleren' wordt geklikt deze gegevens weer tevoorschijn komen
        var savedhaltes =  $$("#halteslijst").html();
        $$("a.searchbar-cancel").click(function() {
            $$("#halteslijst").html(savedhaltes);
        })
    });
};

function halteManual(input) {
    var url = "https://u-ov.info/index.php/tools/apiDirect.php";
    $$.getJSON ( url, {
        concessie: "47",
        apiType: "dienstregeling/zoek",
        apiDataType: "json",
        isMobile: "false",
        z: input
    }, function (data) {
        
        /// JSON-lijst met haltes omzetten in li
        halteList("manual", data);
    });
}

function halteList(type, data) {
    var output = '<li class="item-divider">Gevonden haltes</li>';
    
    /// Wanneer er geen haltes gevonden zijn, dit doorgeven
    if (data.length == 0) {
        output += '<li><div class="item-content"><div class="item-inner"><div class="item-title">Geen haltes gevonden</div></div></div></li>';
    }
    
    /// Voor iedere halte....
    $$.each(data, function(key, val){
        
        /// Slug van de halte tijdelijk opslaan
        var id = val.id;
        
        /// Naam van de halte omdraaien "Utrecht, Heidelberglaan" <-> "Heidelberglaan, Utrecht"
        var halte_old = val.beschrijving;
        var halte_array = halte_old.split(", ");
        var halte_new = halte_array[1] + ", " + halte_array[0];
        
        /// Variabelen uitvoeren als list-item
        output += '<li><a href="halte.html?id='+id+'&halte='+halte_new+'" class="item-link">';
        output += '<div class="item-content"><div class="item-inner">';
        output += '<div class="item-title">'+halte_new+'</div>';
        
        /// Als de informatie werd opgevraagd via locatie, deze locatie doorgeven
        if (type == "location") {
            var afstand = parseInt(val.afstand, 10) + " meter";
            output += '<div class="item-after">'+afstand+'</div>';
        }
        
        output += '</div></div></a></li>';
    });
    $$("#halteslijst").html(output);
}

function halteFavorites() {
    /// Haltes uit localstorage ophalen en doorgeven als JSON
    var favorites = JSON.parse(localStorage.getItem('favorites'));
    var favoriteIds = JSON.parse(localStorage.getItem('favoriteIds'));
    
    var output = '<li class="item-divider">Opgeslagen haltes</li>';
    
    /// Elke halte doorgeven als listitem onder de gevonden haltes
    $$.each(favorites, function(key, value) {
        
        /// Key van de halte ook opzoeken in de array van de HalteIDs
        var idhalte = favoriteIds[key];
        
        output += '<li><a href="halte.html?id='+idhalte+'&halte='+value+'" class="item-link">';
        output += '<div class="item-content"><div class="item-inner">';
        output += '<div class="item-title">'+ value +'</div>';
        output += '</div></div></a></li>';
    });
    
    $$('#opgeslagenhaltes').html(output);
}

function halteFavoritesAddRemove(e) {
  if (this.isFavorite) {
    // remove the favorite from the arrays
    this.favoriteIds.splice(this.favoriteIds.indexOf(this.id), 1);
    var newkey = this.favorites.indexOf(this.halte);
    this.favorites.splice(newkey, 1);
    this.isFavorite = false;
    // update the UI
    $$('.link.star').html('<i class="fa fa-star-o"></i>');
  } else {
    // add the favorite to the arrays
    if (this.favorites === null) this.favorites = [];
    this.favorites.push(this.halte);
    this.favoriteIds.push(this.id);
    this.isFavorite = true;
    // update the UI
    $$('.link.star').html('<i class="fa fa-star"></i>');
  }
  if (this.favorites.length === 0) {
    // clear it out so the template knows it's empty when it returns
    //  as {{#if favorites}} sees an empty array as truthy
    this.favorites = null;
  }
  // save it back to localStorage
  localStorage.setItem('favorites', JSON.stringify(this.favorites));
  localStorage.setItem('favoriteIds', JSON.stringify(this.favoriteIds));
  // if we got here from the favorites page, we need to reload its context
  //  so it will update as soon as we go "back"
    halteFavorites();
}

function calcVertraging (oud, nieuw) {
    /// String als array doorvoeren zodat zij makkelijk te gebruiken te gebruiken zijn met de Date() functie
    var arrayOud = oud.split(":");
    var arrayNew = nieuw.split(":");
    
    /// De arrays omzetten in timstamps mbv Date()
    var date1 = new Date(2000, 0, 1, arrayOud[0], arrayOud[1]);
    var date2 = new Date(2000, 0, 1, arrayNew[0], arrayNew[1]);

    /// Als de oude tijd later is dan de nieuwe tijd....
    if (date1 > date2) {
        var diff = date1 - date2;
        var mm = Math.floor(diff / 1000 / 60);
        if (mm == 1) {
        	return "komt " + mm + " minuut eerder"
        } else {
        	return "komt " + mm + " minuten eerder"
        }
    }
    
    /// Als de oude tijd eerder is dan de nieuwe tijd....
    if (date2 > date1) {
        var diff = date2 - date1;
        var mm = Math.floor(diff / 1000 / 60);
        if (mm == 1) {
        	return "heeft " + mm + " minuut vertraging"
        } else {
        	return "heeft " + mm + " minuten vertraging"
        }
    } 
}

function vertrektijdenGet(id) {
    myApp.showPreloader('Vertrektijden laden');
    var url = "https://u-ov.info/index.php/tools/apiDirect.php";
    $$.get(url, {
        apiType: "dienstregeling/dris-json",
        apiDataType: "html",
        halte: id,
        is_mobile: "false"
    }, function (data) {
        
        /// Omdat de vertrektijden in HTML-opmaak worden opgehaald, wordt eerst deze data weergegeven in een verborgen DIV
        $$("#dris-hidden").html(data);
        
        vertrektijdenList();
    })
}

function vertrektijdenList() {
    /// Lege array aanmaken voor alle vetrektijden
    var main_array = Array();

    /// Vanwege de HTML opmaak worden eerst de bijbehorende DIVs gekoppeld door een andere div
    var divs = $("#dris-hidden > div");
    for(var i = 0; i < divs.length; i+=3) {
      divs.slice(i, i+3).wrapAll("<div class='dris-row'></div>");
    }

    $(".dris-row").each(function(key, value) {

        /// Een array maken met alle informatie over de vertrektijd
        row_array = Array();
        row_array['Lijn'] = $(this).children('div').eq(0).find("p._lijn").text();
        row_array['Bestemming'] = $(this).children('div').eq(1).find("p._vervallen-strike-through").text();
        row_array['Drukte'] = $(this).children('div').eq(1).find("abbr").attr('title');
        row_array['Tijd'] = $(this).children('div').eq(2).find("p span._vervallen-strike-through").text()
        row_array['oudeTijd'] = $(this).children('div').eq(2).find("p span.depr.dris-depr").text()
        row_array['Onbevestigd'] = $(this).children('div').eq(2).find("p span.dris-status-onbevestigd abbr").attr('title');
        row_array['Vervoerder'] = $(this).children('div').eq(0).find("abbr.__dris-vervoerder.__tooltip.custom_tooltip").attr('title');
        
        /* Aangezien ik deze app verder zelf uit wil werken, is hetgeen hieronder niet relevant voor deze opdracht
        
        row_array['Kleur'] = $(this).children('div').eq(0).find("div.__kleur").attr('class');
        row_array['Perron'] = 
        row_array['VervoerderLogo'] = $(this).children('div').eq(0).find("abbr.__dris-vervoerder.__tooltip.custom_tooltip").find("a").find("img.__dris-vervoerder__logo").attr('src');
        */
        
        /// Deze array weer in de hoofdarray zetten
        main_array.push(row_array);
    });
    
    /// Wanneer al deze gegevens zijn opgehaald, verstopte Div weer leeghalen
    $("#dris-hidden").empty();
    
    /// Als er geen vertrektijden zijn gevonden. Dit als alert weergeven en terug gaan naar de vorige pagina
    if (main_array.length == 0) {
        myApp.hidePreloader();
        alert("Er zijn geen vertrektijden gevonden");
        mainView.router.back();
    }
    
    
    for(var i = 0; i < main_array.length; i+=1) {
        var current = main_array[i];
        var output =   '<li class="swipeout"><div class="swipeout-content">';
        output +=      '<a href="#" class="item-content"><div class="item-inner"><div class="item-title-row">';
        
        /// OUTPUT BESTEMMING + AANKOMSTTIJD
        output +=       '<div class="item-title">'+current["Bestemming"]+'</div><div class="item-after">'+current['Tijd']+'</div></div>';
        
        /// OUTPUT LIJN
        output +=       '<div class="item-subtitle">Lijn '+current["Lijn"]+'. ';
        
        /// OUTPUT DRUKTE OF VERVOERDER
        if (current['Drukte']) {
            output +=   current['Drukte']+'</div>';
        } if (!current['Drukte']) {
            output +=   current['Vervoerder']+'</div>';
        }
        
        /// OUTPUT INFORMATIE
        output +=       '<div class="item-text">';
        if (current['Onbevestigd']) {
            output +=   current['Onbevestigd'] + '. ';
        } if (current['oudeTijd']) {
            output += 'De bus ' + calcVertraging(current['oudeTijd'], current['Tijd']) + '. ';
        }
        
        output +=       '</div>';
        output +=       '</div></a></div>';
        output +=       '<div class="swipeout-actions-right"><a href="#" class="bg-green">Action 1</a></div></li>'
        $(output).appendTo(".list-block.media-list ul");
    }
    myApp.hidePreloader();
}
