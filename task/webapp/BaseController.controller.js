sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "task/model/models",
  ],
  function (Controller, models) {
    "use strict";

    return Controller.extend("task.BaseController", {

      initModels: function () {
        const oComponent = this.getOwnerComponent();

        // Product model
        if (!oComponent.getModel("products")) {
          const oProductModel = models.getProductModel();
          oComponent.setModel(oProductModel, "products");
        }
        // Config model
        // if (!oComponent.getModel("config")) {
        //   const oConfigModel = models.createConfigModel();
        //   oComponent.setModel(oConfigModel, "config");
        // }
      },

      /**
       * Convenience: get the products JSONModel
       * @returns {sap.ui.model.json.JSONModel}
       */
      getProductModel: function () {
        return this.getOwnerComponent().getModel("products");
      },

      /**
       * Convenience: get the config JSONModel
       * @returns {sap.ui.model.json.JSONModel}
       */
      // getConfigModel: function () {
      //   return this.getOwnerComponent().getModel("config");
      // },

      /**
       * Convenience: get the router from Component
       * @returns {sap.ui.core.UIComponent.getRouter()}
       */
      getRouter: function () {
        return this.getOwnerComponent().getRouter();
      },

      /**
       * set a model on the view or on component. By default sets on view unless bGlobal=true.
       * @param {sap.ui.model.Model} oModel
       * @param {string} sName
       * @param {boolean} [bGlobal]  if true, set on component; otherwise on view
       */
      setModel: function (oModel, sName, bGlobal) {
        if (bGlobal) {
          this.getOwnerComponent().setModel(oModel, sName);
        } else {
          this.getView().setModel(oModel, sName);
        }
      },

      /**
       * get a named model from view or global
       * @param {string} sName
       * @param {boolean} [bGlobal]
       */
      getModel: function (sName, bGlobal) {
        if (bGlobal) {
          return this.getOwnerComponent().getModel(sName);
        } else {
          return this.getView().getModel(sName);
        }
      },
      
      onInitBase: function () {
        this.initModels();
      },
    });
  }
);
