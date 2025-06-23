sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "task/model/models",
  ],
  function (Controller, models) {
    "use strict";

    return Controller.extend("task.BaseController", {
      /**
       * Initialize global models on the Component.
       * Call this from child controllers in onInit via this.onInitBase().
       */
      initModels: function () {
        const oComponent = this.getOwnerComponent();

        if (!oComponent.getModel("products")) {

          if (models.getProductModel) {
            const oProductModel = models.getProductModel();
            oComponent.setModel(oProductModel, "products");
          }
        }
      
      },

      /**
       * Convenience: get the products JSONModel from Component
       * @returns {sap.ui.model.Model}
       */
      getProductModel: function () {
        return this.getOwnerComponent().getModel("products");
      },

      /**
       * Convenience: get the router
       * @returns {sap.ui.core.routing.Router}
       */

      getRouter: function () {
        return this.getOwnerComponent().getRouter();
      },

      /**
       * Convenience to set a model on view (default) or globally on component.
       * @param {sap.ui.model.Model} oModel
       * @param {string} sName
       * @param {boolean} [bGlobal=false] if true: component, else: view
       */
      setModel: function (oModel, sName, bGlobal) {
        if (bGlobal) {
          this.getOwnerComponent().setModel(oModel, sName);
        } else {
          this.getView().setModel(oModel, sName);
        }
      },

      /**
       * Convenience to get a named model from view (default) or component.
       * @param {string} sName
       * @param {boolean} [bGlobal=false]
       * @returns {sap.ui.model.Model}
       */
      getModel: function (sName, bGlobal) {
        if (bGlobal) {
          return this.getOwnerComponent().getModel(sName);
        } else {
          return this.getView().getModel(sName);
        }
      },

      /**
       * Call this in child controllers' onInit() to run base initialization.
       */
      onInitBase: function () {
        this.initModels();
      },

      // You can add more shared methods here, e.g. common error handlers, navigation shortcuts, etc.
    });
  }
);
