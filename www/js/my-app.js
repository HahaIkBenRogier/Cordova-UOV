/* --------------------------------------------------
|                                                   |
|   OPDRACHT REALISEREN                             |
|   - Framework7                                    |
|   - Eigen opmerkingen zijn te vinden met ///      |
|       opmerkingen vanuit Framework7 zijn //       |
|                                                   |
---------------------------------------------------*/

// Export selectors engine
var $$ = Dom7;

// Initialize your app
var myApp = new Framework7({
    template7Pages: true // enable Template7 rendering for Ajax and Dynamic pages
});

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

// Callbacks to run specific code for specific pages, for example for About page:

myApp.onPageInit('index', function (page) {
    /// Preloader aanzetten, zodat de gebruiker ziet dat er haltes worden opgehaald
    myApp.showPreloader('Haltes zoeken');
    /// Haltes uphalen
    locationGet();
    
    /// Adh van tekstinvoer direct haltes zoeken
    $$("#haltezoeken-text").keyup(function () {
        var input = $$(this).val();
        halteManual(input);
    });
    
    /// Opgeslagen haltes weergeven
    halteFavorites();
    
}).trigger();

myApp.onPageBeforeInit('halte', function (page) {
    /// ID van de halte uit de URL halen om de vertrektijden op te zoeken
    var id = page.query.id;
    vertrektijdenGet(id);
});

myApp.onPageInit('halte', function (page) {
    // fetch the favorites
    var favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    var favoriteIds = JSON.parse(localStorage.getItem('favoriteIds')) || [];
    var isFavorite = false;
    if (favoriteIds.indexOf(page.query.id) !== -1) {
        $$('.link.star').html('<i class="fa fa-star"></i>');
        isFavorite = true;
    };
    
    // set up a context object to pass to the handler
    var pageContext = {
        halte: page.query.halte,
        id: page.query.id,
        isFavorite: isFavorite,
        favorites: favorites,
        favoriteIds: favoriteIds,
        fromPage: page.fromPage.name,
    };
    
      // bind the playback and favorite controls
      $$('.link.star').on('click', halteFavoritesAddRemove.bind(pageContext));
});

myApp.onPageBeforeRemove('halte', function(page) {
  // keep from leaking memory by removing the listeners we don't need
  $$('.link.star').off('click', halteFavoritesAddRemove);
});
