sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "task/model/models",
  ],
  function (UIComponent, models) {
    "use strict";
    return UIComponent.extend("task.Component", {
      metadata: { manifest: "json" },

      init: function () {
        UIComponent.prototype.init.apply(this, arguments);

        // Device model
        this.setModel(models.getDefaultProducts(), "device");

       
        const oProducstModel = models.getDefaultProducts();
        this.setModel(oProducstModel, "products");

        // Initialize routing
        this.getRouter().initialize();
      },
    });
  }
);
