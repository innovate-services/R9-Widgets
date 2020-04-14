define(['dojo/_base/declare', 'jimu/BaseWidget', 'dojo/_base/lang', 'dojo/dom', 'dojo/dom-class', 'dojo/on', 'dojo/dom-construct', 'dijit/TitlePane', 'dijit/form/DropDownButton', 'dijit/DropDownMenu', 'dijit/Menu', 'dijit/MenuItem', 'dijit/MenuSeparator',
  'dijit/CheckedMenuItem','jimu/LayerInfos/LayerInfos', 'jimu/LayerStructure', 'esri/layers/LayerDrawingOptions', 'jimu/dijit/Popup', 'jimu/dijit/RendererChooser', 'jimu/portalUrlUtils', 'jimu/WidgetManager',
  'dijit/form/HorizontalSlider', 'dijit/form/HorizontalRuleLabels', 'dojo/dom-style'],
function(declare, BaseWidget, lang, dom, domClass, on, domConstruct, TitlePane, DropDownButton, DropDownMenu, Menu, MenuItem,
         MenuSeparator, CheckedMenuItem, LayerInfos, LayerStructure, LayerDrawingOptions, Popup, RendererChooser, portalUrlUtils,
         WidgetManager, HorizSlider, HorzRuleLabels, domStyle) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,


    baseClass: 'jimu-widget-grouped',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      this.mapIdNode.innerHTML = 'map id:' + this.map.id;

      //Add groups
      vs = this;
      //Get Groups from the Config
      var groups = vs.config.Groups;
      groups.forEach(function(g){
        vs._buildGroup(g);
      });

      //watch for structure change
      var layerStructure = LayerStructure.getInstance();
      layerStructure.on(LayerStructure.EVENT_STRUCTURE_CHANGE, function(eventObject) {
        // reprint the layer tree if the layer structure has been changed;
        if(eventObject.layerNodes.length >0){
          if(eventObject.type == "added"){
            var layOpt = {};
            eventObject.layerNodes[0].traversal(function(evt){
              if(evt.getSubNodes().length ==0){
                layOpt[evt.id] = {"display": true};
              }
            });

            vs._userAddedLayerFrameword(eventObject.layerNodes[0], layOpt)
          }
        }
      });

      console.log('startup');
    },

    _userAddedLayerFrameword: function(layerInfo, layOpt){
      console.log("User Added Group");

      var g = {
        "name": "User Added Layers",
        "index": 0,
        "layerOptions": layOpt
      };
      g.layerOptions[layerInfo.id] = {"display": true};

      vs._buildGroup(g);
    },

    _buildGroup: function(g){
      //make a title pane for each group
      // var tp = new TitlePane({title: '+ ' + g.name,
      var tp = new TitlePane({title: g.name,
        content: "",
        open: false});
      dom.byId("holder").appendChild(tp.domNode);
      tp.startup();
      on(tp,'show', vs._showTitlePane);
      on(tp,'hide', vs._hideTitlePane);

      //find alisa so layer
      var layerStructure = LayerStructure.getInstance();


      var object = g.layerOptions;
      groupNode = domConstruct.toDom("<div></div>");
      var row = "";
      for (var property in object) {
        if (object.hasOwnProperty(property)) {
          // Add toggle and layer name
          var aliasLayer = layerStructure.getNodeById(property);
          //get layer type
          isRoot = aliasLayer.isRoot();
          // aliasLayer.getLayerType().then(lang.hitch(aliasLayer, function(layerType){

            var sublayers = aliasLayer.getSubNodes().length;
            if (object[property].display && sublayers == 0) {
              var layerDivNode = domConstruct.toDom("<div class='layerDiv'></div>");
              var btnAndLabel = domConstruct.toDom("<div class='layerBTN'></div>");
              var popupMenuStuff = domConstruct.toDom("<div id='" + property + "_layer'></div>");

              var onoffSwitchNode = domConstruct.toDom("<div class='onoffswitch'></div>");

              var inputNode = domConstruct.toDom("<input type='checkbox' name='onoffswitch'  class='onoffswitch-checkbox' id='" + property + "switch'>");
              on(inputNode, 'click', vs._toggleLayerVis);
              var inputlabel = domConstruct.toDom("<label class='onoffswitch-label' for='" + property + "switch'><span " +
                "class='onoffswitch-inner'></span><span class='onoffswitch-switch' data-bind='stopBubble:parentAction'></span></label>");

              var layerTextNode = domConstruct.toDom("<div class='layerLabel'>" + aliasLayer.title + "</div>");
              var menuBtn = domConstruct.toDom("<div class='layers-list-popupMenu-div' style='display: block'></div>");

              var dropbtn = vs._setMenuOptions(aliasLayer, popupMenuStuff);

              domConstruct.place(inputNode, onoffSwitchNode);
              domConstruct.place(inputlabel, onoffSwitchNode);

              domConstruct.place(onoffSwitchNode, btnAndLabel);
              domConstruct.place(layerTextNode, btnAndLabel);
              // domConstruct.place(dropbtn.domNode, popupMenuStuff);

              domConstruct.place(btnAndLabel, layerDivNode);
              domConstruct.place(popupMenuStuff, layerDivNode);

              domConstruct.place(layerDivNode, groupNode);

              inputNode.checked = aliasLayer.isVisible();
              // row = row + "<div class='layerDiv' ><div class='onoffswitch'><input type='checkbox' name='onoffswitch' class='onoffswitch-checkbox' id='" + property + "switch'>" +
              // "<label class='onoffswitch-label' for='" + property + "switch'><span class='onoffswitch-inner'></span><span class='onoffswitch-switch'></span></label></div><div class='layerLabel'>" + aliasLayer.title + "</div></div>";

            }
        }
      }

      tp.set('Content', groupNode);
    },

    _setMenuOptions: function(layerInfoNode, menuContainerNode){

      layerInfoNode.getLayerType().then(lang.hitch(layerInfoNode, function(layerType){
        //Set up option for layer types
        var RootLayerOnly = ["zoomto", "transparency", "url"];
        var RootLayerAndFeatureLayer = [
          {
            "name": "zoomto",
            "label": "Zoom to"
          },{
            "name": "changeSymbology",
            "label": "Change layer symbol"
          },{
            "name": "controlPopup",
            "label": "Disable pop-up"
          },{
            "name": "controlLabels",
            "label": "Toggle labels"
          },{
            "name": "url",
            "label": "Show item details"
          }];
        var FeatureLayerOnly =[{
          "name": "controlPopup",
          "label": "Disable pop-up"
        },{
          "name": "controlLabels",
          "label": "Toggle labels"
        },{
          "name": "changeSymbology",
          "label": "Change layer symbol"
        },{
          "name": "table",
          "label": "View in attribute table"
        },{
          "name": "url",
          "label": "Show item details"
        }]; //["Disable pop-up", "Toggle labels", "Change layer symbol", "Show item details"];

        var isRootLayer = layerInfoNode.isRoot();
        var menu = new DropDownMenu({ style: "display: none;"});

        if (isRootLayer &&
          (layerType === "FeatureLayer" ||
          layerType === "CSVLayer" ||
          layerType === "ArcGISImageServiceLayer" ||
          layerType === "StreamLayer" ||
          layerType === "ArcGISImageServiceVectorLayer")){

          var i = 0;
          for(var type in RootLayerAndFeatureLayer) {

            if (layerInfoNode.isTiled() && FeatureLayerOnly[type].name == "changeSymbology") {
              //do not add menu item
            } else {
              var menuItem1 = new MenuItem({
                id: layerInfoNode.id + "_" + i,
                label: RootLayerAndFeatureLayer[type].label,
                onClick: lang.hitch(layerInfoNode, vs._layerSubMenuClicked)
              });
              menu.addChild(menuItem1);
            }
            i++;
          }
        }else if (isRootLayer){
          var r = 0
          for(var type in RootLayerOnly){
            var menuItem1 = new MenuItem({
              id: layerInfoNode.id + "_" + r,
              label: RootLayerOnly[type],
              onClick: function(){ console.log("Error: Rootlayer") }
            });
            menu.addChild(menuItem1);
            r++;
          }
        }else if(layerType === "FeatureLayer" || layerType === "CSVLayer"){
          var index = 0;
          for(var type in FeatureLayerOnly){
            if(layerInfoNode.isTiled() && FeatureLayerOnly[type].name == "changeSymbology"){
              //do not add menu item

            }else if(!layerInfoNode.canShowLabel() && FeatureLayerOnly[type].name == "controlLabels"){

            }else{
              var menuItem1 = new MenuItem({
                id: layerInfoNode.id + "_" + index,
                label: FeatureLayerOnly[type].label,
                onClick: lang.hitch(layerInfoNode, vs._layerSubMenuClicked)
              });
              menu.addChild(menuItem1);
            }

            index++;
          }
        }

        var dropbtn = new DropDownButton({
          label: "",
          iconClass: "dijitEditorIcon",
          showLabel: false,
          name: layerInfoNode.id,
          dropDown: menu,
          class: 'drop-Menu-Btn'
        });
        domConstruct.place(dropbtn.domNode, menuContainerNode);
        //console
      }));
    },

    _layerSubMenuClicked: function(evt){
      console.log(evt.target.id);
      var layerID = this.id;
      var layerAction = evt.target.innerText;

      if(layerAction=="Disable pop-up" || layerAction=="Enable pop-up"){
        vs._controlPopups(this, layerID);
        if(layerAction=="Disable pop-up"){
          evt.target.innerText = "Enable pop-up";
        }else{
          evt.target.innerText = "Disable pop-up";
        }
      }else if(layerAction=="Toggle labels"){
        vs._controlLabels(this, layerID);
      }else if(layerAction=="Change layer symbol") {
        vs._changeSymbology(this, layerID);
      }else if(layerAction=="View in attribute table") {
        vs._openTable(this, layerID);
      } else if(layerAction=="Show item details"){
        vs._urlDescription(this, layerID);
      } else if(layerAction=="Transparency"){
        vs._changeTransparency(this, layerID);
      }

    },
    //Layer popup menu functions
    _changeTransparency: function (layerInfoNode, layerID){
      console.log("Transparency");

      if (!vs.transHorizSlider) {
        vs._createTransparencyWidget(layerInfoNode);
        vs.transHorizSlider.set("value", layerInfoNode.getOpacity());
      }
      domStyle.set(vs.transparencyDiv, "top", vs._getTransNodePosition().top);
      if (isRTL) {
        domStyle.set(vs.transparencyDiv, "left", vs._getTransNodePosition().right);
      } else {
        domStyle.set(vs.transparencyDiv, "right", vs._getTransNodePosition().right);
      }
      domStyle.set(vs.transparencyDiv, "display", "block");
      //layerInfoNode.setOpacity(1 - evt.extraData.newTransValue);
    },

    _getTransNodePosition: function() {
      return {
        top: "28px",
        //left: "-107px"
        //left: -1 * html.getStyle(this.transparencyDiv, 'width') + 'px'
        right: "2px"
      };
    },

    _createTransparencyWidget: function(layerInfoNode) {
      vs.transHorizSlider = new HorizSlider({
        minimum: 0,
        maximum: 1,
        intermediateChanges: true
      }, vs.transparencyBody);

      vs.own(this.transHorizSlider.on("change", lang.hitch(layerInfoNode, function(newTransValue) {
        this.setOpacity(newTransValue);

      })));

      new HorzRuleLabels({
        container: "bottomDecoration"
      }, vs.transparencyRule);
    },

    _openTable: function (layerInfoNode, layerID) {
      layerInfoNode._layerInfo.getSupportTableInfo().then(lang.hitch(this, function (supportTableInfo) {
        var widgetManager;
        var attributeTableWidgetEle =
          this.appConfig.getConfigElementsByName("AttributeTable")[0];
        if (vs._isSupportedByAT(attributeTableWidgetEle, supportTableInfo)) {
          widgetManager = WidgetManager.getInstance();
          widgetManager.triggerWidgetOpen(attributeTableWidgetEle.id)
            .then(lang.hitch(this, function () {
              this.publishData({
                'target': 'AttributeTable',
                'layer': layerInfoNode
              });
            }));
        }
      }));
    },

    _isSupportedByAT: function () {
      return true;
    },

    _urlDescription: function(layerInfoNode, layerID){

      layerInfoNode.getLayerType().then(lang.hitch(layerInfoNode, function(layerType){
        var url;
        var layerUrl = layerInfoNode.getUrl();
        var basicItemInfo = layerInfoNode.isItemLayer();

        if (basicItemInfo) {
          url = vs._getItemDetailsPageUrl(basicItemInfo) || layerUrl;
        } else if (layerUrl &&
          (layerType === "CSVLayer" || layerType === "KMLLayer")) {
          url = layerUrl;
        } else if (layerUrl && layerType === "WMSLayer") {
          url = layerUrl + (layerUrl.indexOf("?") > -1 ? "&" : "?") + "SERVICE=WMS&REQUEST=GetCapabilities";
        } else if (layerUrl && layerType === "WFSLayer") {
          url = layerUrl + (layerUrl.indexOf("?") > -1 ? "&" : "?") + "SERVICE=WFS&REQUEST=GetCapabilities";
        } else if (layerUrl) {
          url = layerUrl;
        } else {
          url = '';
        }

        window.open(url, '_blank');
      }));
    },

    _getItemDetailsPageUrl: function(basicItemInfo){
      var itemUrl = "";
      itemUrl = portalUrlUtils.getItemDetailsPageUrl(basicItemInfo.portalUrl, basicItemInfo.itemId);
      return itemUrl;
    },

    _changeSymbology: function(layerInfoNode, layerID){

      layerInfoNode.getLayerObject().then(lang.hitch(layerInfoNode, function(layerObject){
        vs.curLayer = layerObject;

        var symPopup = new Popup({
          titleLabel: 'Change Symbology of '+ layerObject.name,
          autoHeight: true,
          maxWidth: '300px',
          content: '<div id="rendChanger"></div>',
          buttons:[{
            label: 'Update',
            onClick: lang.hitch(this,function(){

              if(vs.curLayer.type =='Feature Layer'){
                if(layerInfoNode._layerInfo.parentLayerInfo.layerObject.layerDrawingOptions){
                  var layerRenderer = vs.symbolChooser.getRenderer();

                  var layerDrawingOptions = [];
                  var layerDrawingOption = new LayerDrawingOptions();
                  layerDrawingOption.renderer = layerRenderer;
                  layerDrawingOptions[0] = layerDrawingOption;

                  layerInfoNode._layerInfo.parentLayerInfo.layerObject.setLayerDrawingOptions(layerDrawingOptions);
                }else{
                  var layerRenderer = vs.symbolChooser.getRenderer();
                  vs.curLayer.setRenderer(layerRenderer);
                  vs.curLayer.refresh();
                  console.log("symbology changed");
                }

              }else{
                var layerRenderer = this.symbolChooser.getRenderer();
                vs.curLayer.setRenderer(layerRenderer);
                vs.curLayer.refresh();
                console.log("symbology changed");
              }
            })
          }]
        });

        vs.symChooserNode = domConstruct.toDom("<div style='padding-left: 10px'></div>");
        domConstruct.place(vs.symChooserNode, symPopup.domNode);

        var rend;
        if(vs.curLayer.type =='Feature Layer'){
          if(layerInfoNode._layerInfo.parentLayerInfo.layerObject.layerDrawingOptions){
            var layerdrawingOps = layerInfoNode._layerInfo.parentLayerInfo.layerObject.layerDrawingOptions;
            rLen = layerdrawingOps.length;
            rend = layerdrawingOps[rLen - 1].renderer;
          }else{
            rend = layerObject.renderer;
          }

        }else{
          rend = layerObject.renderer;
        }

        vs.symbolChooser = new RendererChooser({
          renderer: rend, //this._layerInfo.layerObject.renderer,
          fields:["STATUS"]
        }, 'rendChanger');

        symPopup.resize();
      }));
    },

    _controlPopups: function(layerInfoNode, layerID){
      if (layerInfoNode._layerInfo.controlPopupInfo.enablePopup) {
        layerInfoNode._layerInfo.disablePopup();
      } else {
        layerInfoNode._layerInfo.enablePopup();
      }
      layerInfoNode._layerInfo.map.infoWindow.hide();
    },

    _controlLabels: function(layerInfoNode, layerID){
      var canShowLabels = layerInfoNode.canShowLabel();
      var drawingOptions = new LayerDrawingOptions();
      drawingOptions = layerInfoNode._layerInfo.parentLayerInfo.layerObject.layerDrawingOptions;
      if (drawingOptions.length > 0) {


        for (var i = 0; i < drawingOptions.length; i++) {
          if (drawingOptions[i].showLabels) {
            drawingOptions[i].showLabels = false;
          } else {
            drawingOptions[i].showLabels = true;
          }

          if (i == drawingOptions.length - 1) {
            layerInfoNode._layerInfo.parentLayerInfo.layerObject.setLayerDrawingOptions(drawingOptions);

            layerInfoNode.getLayerObject().then(lang.hitch(layerInfoNode, function(layerObject){
              console.log(layerObject);
              layerObject.refresh();
            }));
            //layerInfoNode._layerInfo.layerObject.refresh();
          }
        }
      }
    },

    _showPopupMenu: function(layerInfo, popupMenuNode, layerTrNode, evt){
      console.log("Display Popu Menu");
      //And requirments for popu menu
      //Requires layerInfo, popup menu compontent node, and the config

      var Rootlayer = layerInfo.getRootNode();

      if(vs.pMenu){
        vs.pMenu.destroy();
      }

      vs.pMenu = new Menu({
        title: "Actions",
        onBlur: function (){
          console.log("destrio");
          vs.pMenu.destroy();
        }
      }, evt.target);
      vs.pMenu.addChild(new MenuItem({
        label: "Simple menu item"
      }));
      vs.pMenu.addChild(new MenuItem({
        label: "Disabled menu item",
        disabled: true
      }));

      vs.pMenu.startup();

      // var popupMenu = popupMenuNode.popupMenu;
      // if (!popupMenu) {
      //   popupMenu = new PopupMenu({
      //     //items: layerInfo.popupMenuInfo.menuItems,
      //     _layerInfo: layerInfo._layerInfo,
      //     box: null,//this.domNode.parentNode,
      //     popupMenuNode: popupMenuNode,
      //     layerListWidget: this,
      //     _config: this.config
      //   }).placeAt(popupMenuNode);
      //   popupMenuNode.popupMenu = popupMenu;
        // this._storeLayerNodeDijit(rootLayerInfo, popupMenu);
        // var handle = this.own(on(popupMenu, 'onMenuClick', lang.hitch(this, this._onPopupMenuItemClick, layerInfo, popupMenu)));
        //
        // this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);

      // }
    },

    _showTitlePane: function () {
      this.set('title', this.title.replace("+ ", "- "));
    },

    _hideTitlePane: function () {
      this.set('title', this.title.replace("- ", "+ "));
    },

    _toggleLayerVis: function(evt){
      console.log("holla");
      var layerchkBox = evt.target;
      //get reference to the layer
      var layerStructure = LayerStructure.getInstance();
      var loi = layerchkBox.id.replace('switch','');
      var layerObj = layerStructure.getNodeById(loi);
      // //toggle layer visibility
        if(!layerchkBox.checked){
          // layerchkBox.checked = false;
          if(layerObj.isTiled()){
            vs.map.getLayer(layerObj.getRootNode().id).hide();
          }else{
            layerObj.hide();
          }
        }else{
           // layerchkBox.checked = true;
          if(layerObj.isTiled()){
            vs.map.getLayer(layerObj.getRootNode().id).show();
          }else{
            layerObj.show();
          }
        }
      //


    },

    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    },

    showVertexCount: function(count){
      this.vertexCount.innerHTML = 'The vertex count is: ' + count;
    }
  });
});