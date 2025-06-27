sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/base/Log"],
  function (UIComponent) {
    "use strict";
    return UIComponent.extend("task.Component", {
      metadata: {
        manifest: "json",
      },

      init: function () {
        UIComponent.prototype.init.apply(this, arguments);

        // Initialize routing
        this.getRouter().initialize();
      },
    });
  }
);
