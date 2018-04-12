/***************************************************************************************************
 
 Mini Web application with New york subway stations and routes
 ArcGIS Server Services used here: 
 1. https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/NYCSubwayRoutes/FeatureServer  (New york subway routes)
 2. https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/NYCSubwayStops/FeatureServer   (New york subway stations)

 ***************************************************************************************************/

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/BasemapToggle",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/widgets/Legend",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "dojo/_base/array",
    "esri/core/watchUtils",
    "esri/views/2d/draw/Draw",
    "esri/Graphic",
    "dojo/dom",
    "dojo/on",
    "dojo/domReady!"
  ], function(
    Map, MapView, BasemapToggle, GraphicsLayer, FeatureLayer, Legend,
    QueryTask, Query, arrayUtils, watchUtils, Draw, Graphic, dom, on
  ) {

    var stopsUrl = "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/NYCSubwayStops/FeatureServer/0";

    // Create graphics layer and symbol to use for displaying the results of query
    var queryResultsLyr = new GraphicsLayer();

    var qTask = new QueryTask({
      url: stopsUrl
    });

    var params = new Query({
      returnGeometry: true,
      outFields: ["*"]
    });

    var StopSymbol = {
        type: "picture-marker",
        url: "./img/Subway.png",
        width: 8,
        height: 9
      };

    var PointASymbol = {
        type: "picture-marker",
        url: "./img/StartPointA.png",
        width: 82.76,
        height: 15,
    };

    var PointBSymbol = {
        type: "picture-marker", 
        url: "./img/EndPointB.png",
        width: 82.76,
        height: 15
    };

    var StopRenderer = {
        type: "simple",
        symbol: StopSymbol,
    };

    var NYSubWayRoutes = new FeatureLayer({
        url : "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/NYCSubwayRoutes/FeatureServer/0",
        title: "NY SubWay Routes",
        renderer: RouteRenderer
    })

    var NYSubWayStops = new FeatureLayer({
        url : "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/NYCSubwayStops/FeatureServer/0",
        title: "NY SubWay Stops",
        renderer: StopRenderer,
        visible: false
    })

    var map = new Map({
      basemap: "dark-gray",
      layers: [queryResultsLyr, NYSubWayRoutes, NYSubWayStops]
    });

    var view = new MapView({
      map: map,
      container: "viewDiv",
      center: [-73.942818, 40.764612],
      zoom: 11,
      
    });

    // Initialize Main Functions (Create Start and End points) and other Divs.
    view.when(function() {
        view.ui.add("optionsDiv", "bottom-right");
        initStartPoint();
        on(dom.byId("Reselect"), "click", Reselect);
    });

    // Add basemap Toggle tool to top right of the map.
    var basemapToggle = new BasemapToggle({
        view: view,
        nextBasemap: "streets"
    });

    view.ui.add(basemapToggle, "top-right");

    // Add legend to bottom left of the map.
    var legend = new Legend({
        view: view,
        layerInfos: [
        {
          layer: NYSubWayStops,
          title: "NY SubWay Stops"
        }, {
          layer: NYSubWayRoutes,
          title: "NY SubWay Routes"
        }]
      });

    view.ui.add(legend, "bottom-left");
    
    watchUtils.whenTrue(view, "stationary", function() {

        // Change the visibility of NYSubWayStops layer based on zoom level.
        if (view.zoom) {
            if(view.zoom < 12){
                if (NYSubWayStops.visible){
                    NYSubWayStops.visible = false;
                }
            }
            else {
                if (!queryResultsLyr.graphics.items[0]){
                    if (!NYSubWayStops.visible){
                        NYSubWayStops.visible = true;
                    }
                }
            }

        }
    });

    // Create function for PopupTemplate for further Popup window modification in the future
    function CreatePopupTemplate(){

    // Define the popup content for each result
    var popupTemplate = {
        title: "Route Searching System",
        content: "STOP NAME: {STOP_NAME}, " + "<br>" + "Route: {Route_Lbl}, " + "<br>" + "STOP LAT: {STOP_LAT}, " 
        + "<br>" + "STOP LON: {STOP_LON}"
    };

    return popupTemplate
    }

    // Draw Start Point

    function initStartPoint() {
        var draw = new Draw({
            view: view
          });
        var action = draw.create("point");
        action.on("cursor-update", function (evt) {
                DrawPoint(evt.coordinates, 'A');
                });
        action.on("draw-complete", function (evt) {
                DrawPoint(evt.coordinates, 'A');
                initEndPoint()
                });
        
      }
    
    var GraphicsBs;
    var Coordinates = [];

    // Draw End Point
    function initEndPoint(){
        var draw = new Draw({
            view: view
          });
        var action = draw.create("point");
        action.on("cursor-update", function (evt) {
                DrawPoint(evt.coordinates, 'B');
                });
        action.on("draw-complete", function (evt) {
                DrawPoint(evt.coordinates, 'B');
                queryForNearestStops(Coordinates[0], Coordinates[1])
                });
    }

    function DrawPoint(coordinates, whichpoint){
        
        if(whichpoint == 'A'){
            view.graphics.removeAll();
            updateCursorCoordinates(coordinates, 'A');
        }else{
            view.graphics.remove(GraphicsBs)
            updateCursorCoordinates(coordinates, 'B');
        }

        var point = {
          type: "point",
          x: coordinates[0],
          y: coordinates[1],
          spatialReference: view.spatialReference
        };
        
        if (whichpoint == 'A'){
            var graphicA = new Graphic({
                    geometry: point,
                    symbol: PointASymbol
                });
            view.graphics.add(graphicA);
        }else{
            var graphicB = new Graphic({
                geometry: point,
                symbol: PointBSymbol
            });
            view.graphics.add(graphicB);
            GraphicsBs = graphicB
        }
        
    }

    // Update start or end point coordinates in the bottom right div
    function updateCursorCoordinates(coordinates, whichpoint){
        if (whichpoint == 'A'){
            dom.byId("StartXY").innerHTML = "<font color='#ff6b63'> Start Point </font>:  X: " + coordinates[0].toFixed(2) + ",  Y: " + coordinates[1].toFixed(2);
            Coordinates[0] = coordinates
        }else{
            dom.byId("EndXY").innerHTML = "<font color='#0dbeff'> End Point </font>:  X: " + coordinates[0].toFixed(2) + ",  Y: " + coordinates[1].toFixed(2);
            Coordinates[1] = coordinates
        }

    }

    // Set up query prams and query for nearest subway stations
    function queryForNearestStops(StartPoint, EndPoint) {

        var StopsQuery = NYSubWayStops.createQuery();
        StopsQuery.outFields = ["STOP_ID", "STOP_NAME", "Route_Lbl", "STOP_LAT", "STOP_LON"];
        NYSubWayStops.queryFeatures(StopsQuery)
          .then(function(response) {
            Stopsinfos = response.features.map(function(feature) {
              return [feature.attributes.STOP_ID, feature.attributes.STOP_NAME, feature.geometry];
            });
            SearchforBestRoutes(StartPoint, EndPoint, Stopsinfos);
          });

    }

    // Query for the nearest subway stations to start and end point we created before (Record the distance)
    function SearchforBestRoutes(StartPoint, EndPoint, Stopsinfos) {
        DistToStarts = [];
        DistToEnds = [];
        for (i = 0; i < Stopsinfos.length; i++) {
            DistToStart = ((StartPoint[0] - Stopsinfos[i][2].x) ** 2 + (StartPoint[1] - Stopsinfos[i][2].y) ** 2) ** 0.5;
            DistToEnd = ((EndPoint[0] - Stopsinfos[i][2].x) ** 2 + (EndPoint[1] - Stopsinfos[i][2].y) ** 2) ** 0.5;
            DistToStarts.push([Stopsinfos[i][0], Stopsinfos[i][1], Stopsinfos[i][2], DistToStart]);
            DistToEnds.push([Stopsinfos[i][0], Stopsinfos[i][1], Stopsinfos[i][2], DistToEnd])
        }
        DistToStarts.sort(function(a, b){return a[3] - b[3]});
        DistToEnds.sort(function(a, b){return a[3] - b[3]});
        QueryStops(DistToStarts[0], DistToEnds[0]);
    }
    
    // Executes each time the end point is created
    // Show nearest stations on the map
    function QueryStops(StartStation, EndStation) {
        
      queryResultsLyr.removeAll();

      params.where = "STOP_ID =" + "'" + StartStation[0] + "'" + " or " + "STOP_ID =" + "'" + EndStation[0] + "'";

      qTask.execute(params)
        .then(getResults)
        .otherwise(promiseRejected);
      dom.byId("DistToStart").innerHTML = "(Distance) Nearest station to your start point: " + StartStation[3].toFixed(2) + " Foot";
      dom.byId("DistToEnd").innerHTML = "(Distance) Nearest station to your destination: " + EndStation[3].toFixed(2) + " Foot";
    }

    function getResults(response) {

      // Loop through each of the results and assign a symbol and PopupTemplate
      // to each so they may be visualized on the map
      var StopResults = arrayUtils.map(response.features, function(
        feature) {

        feature.symbol = {
            type: "picture-marker",
            url: "./img/Subway.png",
            width: 18,
            height: 20
        };
        feature.popupTemplate = CreatePopupTemplate();
        return feature;
    });

      queryResultsLyr.addMany(StopResults);      
      NYSubWayStops.visible = false;
      
    }

    // Refresh for reselect
    function Reselect(){
        view.graphics.removeAll();
        dom.byId("DistToStart").innerHTML = "";
        dom.byId("DistToEnd").innerHTML = "";
        dom.byId("EndXY").innerHTML = "";
        if(queryResultsLyr.graphics.items[0]){
            if(view.zoom > 12){
            NYSubWayStops.visible = true;
        }
        }
        queryResultsLyr.removeAll();
        initStartPoint();
    };

    function promiseRejected(err) {
      console.error("Promise rejected: ", err.message);
    }

  });
