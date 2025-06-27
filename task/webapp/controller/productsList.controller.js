sap.ui.define(
  ["task/controller/BaseController.controller"],
  function (BaseController) {
    "use strict";

    return BaseController.extend("task.controller.ProductsList", {
      onInit: function () {},

      onBeforeRebindTable: function (oEvent) {
        const p = oEvent.getParameter("bindingParams");
        p.parameters = p.parameters || {};

        // Expand nav props
        const aExp = (p.parameters.expand || "").split(",").filter(Boolean);
        ["Supplier", "Category"].forEach(function (n) {
          if (aExp.indexOf(n) < 0) {
            aExp.push(n);
          }
        });
        p.parameters.expand = aExp.join(",");
      },

      onRowPress: function (oEvent) {
        const oCtx = oEvent.getSource().getBindingContext();
        if (!oCtx) {
          return;
        }
        
        const sPath = oCtx.getPath().slice(1); // strip leading '/'
        this.getRouter().navTo("ProductDetails", {
          productPath: encodeURIComponent(sPath),
        });
      },

    });
  }
);
