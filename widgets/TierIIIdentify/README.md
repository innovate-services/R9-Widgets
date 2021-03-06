# Tier II Widget

The Tier II Identify Widget can be used to quickly display Tier II information stored in multiple layers (tables). Currently, the widget works with CA, HI, NV and AZ data made available in the form of a map service (widget can be adapted to support feature services, if necessary). The widget provides a limited level of configurability through the ESRI Web AppBuilder configuration tools. This configuration is limited to choosing which layers in a map service correspond to Facilities, Contact, Chemicals, etc. If a layer is not available for portions of this data, the widget will simply not attempt to load that data.  

In order to make this widget work for data from other states, some customization is required. Starting with Lines 133-142 in TierIIIdentify/setting/TierIISettingsDijit.js, update to display the appropriate states. Next on lines ~56-287, in TierIIIdentify/Widget.js, there are many attributes referenced who's names and availability vary from state to state. Using the configuration JSON created using the ESRI Web AppBuilder configuration UI, we can check which state is being viewed and perform logic to adjust fields based on that state. For example, line 95 provides an example of how to access the state abbreviation, created in TierIIIdentify/setting/TierIISettingsDijit.js using `service.config.state.abbr === 'HI'`.  

Lastly, we have included the ability to display status information when the widget initially loads. There is no UI to edit this data.  Instead, this data must be edited through normal ArcMap edit tools.


### Contact Information

* **Cheryl Henley**, GIS Coordinator 415-972-3586 henley.cheryl@epa.gov
* **Travis Bock**, Geospatial Developer 757-201-8188 bock.travis@epa.gov
