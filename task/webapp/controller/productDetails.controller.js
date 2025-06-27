sap.ui.define(
  [
    "task/controller/BaseController.controller",
    "sap/ui/core/routing/History",
  ],
  function (BaseController, History) {
    "use strict";


    return BaseController.extend("task.controller.ProductDetails", {
      onInit: function () {
        this.onInitBase();

        this.getRouter()
          .getRoute("ProductDetails")
          .attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: function (oEvent) {
        const sEncoded = oEvent.getParameter("arguments").productPath;
        const sPath = decodeURIComponent(sEncoded);
        this.getView().bindElement({
          path: `/${sPath}`,
          parameters: { expand: "Category,Supplier" },
        });
      },
      
      onNavHome: function () {
        const oHistory = History.getInstance();
        const sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          this.getRouter().navTo("ProductsList", {}, true);
        }
      },
    });
  }
);
