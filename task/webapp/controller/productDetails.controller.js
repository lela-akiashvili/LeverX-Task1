sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/message/Message",
    "sap/ui/core/library",
    "sap/m/MessageBox",
    "task/model/models",
  ],
  function (
    Controller,
    MessageToast,
    Message,
    coreLibrary,
    MessageBox,
    models
  ) {
    "use strict";

    const MessageType = coreLibrary.MessageType;

    return Controller.extend("task.controller.ProductDetails", {
      onInit: function () {
        // Router
        this._oRouter = this.getOwnerComponent().getRouter();

        // MessageManager for validation messages
        this._oMessageManager = sap.ui.getCore().getMessageManager();
        this._oMessageManager.registerObject(this.getView(), true);

        // View model to hold editable/isNew flags
        const oViewModel = models.createViewModel();
        this.getView().setModel(oViewModel, "viewModel");

        // Attach route match
        this._oRouter
          .getRoute("ProductDetails")
          .attachPatternMatched(this._onMatched, this);
      },

      /**
       * Route matched handler: load existing product or newProduct model.
       */
      _onMatched: function (oEvent) {
        const sProductId = oEvent.getParameter("arguments").productId;
        const oView = this.getView();
        const oViewModel = oView.getModel("viewModel");
        const oComponent = this.getOwnerComponent();

        this._oMessageManager.removeAllMessages();

        // If there's a "newProduct" model in component and its ID matches, treat as new
        const oNewProdModel = oComponent.getModel("newProduct");
        if (oNewProdModel) {
          const sNewModelId = oNewProdModel.getProperty("/ID");
          if (sNewModelId === sProductId) {
            // create a new product mode
            oView.setModel(oNewProdModel, "product");
            oViewModel.setProperty("/editable", true);
            oViewModel.setProperty("/isNew", true);
            // store snapshot for Cancel
            this._storeOriginalData(oNewProdModel.getData());
            return;
          }
        }

        const oProductsModel = oComponent.getModel("products");
        const aProducts = oProductsModel.getProperty("/Products") || [];
        const oProduct = aProducts.find((p) => p.ID === sProductId);

        if (oProduct) {
          // Deep clone, preserving Date objects
          const oCloned = this._cloneProductPreserveDates(oProduct);

          const oProductModel = models.createProductModel(oCloned);
          oView.setModel(oProductModel, "product");

          // read-only mode initially
          oViewModel.setProperty("/editable", false);
          oViewModel.setProperty("/isNew", false);
          this._oMessageManager.removeAllMessages();

          // Store original data for Cancel revert
          this._storeOriginalData(oProduct);
        } else {
          MessageToast.show("Product not found");
          this._oRouter.navTo("ProductsList");
        }
      },

      /**
       * Store a deep clone of original data in this._oOriginalData
       * so that Cancel can revert. Input oData may have Date objects.
       */
      _storeOriginalData: function (oData) {
        this._oOriginalData = this._cloneProductPreserveDates(oData);
      },

      /**
       * Helper: deep-clone a product object, preserving Date fields.
       */
      _cloneProductPreserveDates: function (oProduct) {
        if (!oProduct) {
          return null;
        }
        const oClone = {
          ID: oProduct.ID,
          Name: oProduct.Name,
          Description: oProduct.Description,
          ReleaseDate:
            oProduct.ReleaseDate instanceof Date
              ? new Date(oProduct.ReleaseDate.getTime())
              : oProduct.ReleaseDate
              ? new Date(oProduct.ReleaseDate)
              : null,
          DiscontinuedDate:
            oProduct.DiscontinuedDate instanceof Date
              ? new Date(oProduct.DiscontinuedDate.getTime())
              : oProduct.DiscontinuedDate
              ? new Date(oProduct.DiscontinuedDate)
              : null,
          Rating: oProduct.Rating,
          Price: oProduct.Price,
          // Clone categories array
          Categories: Array.isArray(oProduct.Categories)
            ? oProduct.Categories.map((c) => ({
                ID: c.ID,
                Name: c.Name,
              }))
            : [],
          // Clone supplier object
          Supplier: oProduct.Supplier
            ? {
                ID: oProduct.Supplier.ID,
                Name: oProduct.Supplier.Name,
                Address: oProduct.Supplier.Address,
              }
            : { ID: "", Name: "", Address: "" },
        };
        return oClone;
      },

      onNavHome: function () {
        const oViewModel = this.getView().getModel("viewModel");
        if (oViewModel.getProperty("/isNew")) {
          this._discardNewProduct();
        }
        this._oRouter.navTo("ProductsList");
      },

      onEditPress: function () {
        const oViewModel = this.getView().getModel("viewModel");
        oViewModel.setProperty("/editable", true);
        this._oMessageManager.removeAllMessages();

        // Store original data for Cancel.
        const oCurrentData = this.getView().getModel("product").getData();
        this._storeOriginalData(oCurrentData);
      },

      /**
       * validate, persist to master model, then exit edit mode.
       */
      onSavePress: function () {
        const oView = this.getView();
        const oProductModel = oView.getModel("product");
        const oViewModel = oView.getModel("viewModel");
        const oData = oProductModel.getData();

        // Clear previous messages
        this._oMessageManager.removeAllMessages();

        // Basic validation
        if (!oData.Name || oData.Name.trim() === "") {
          this._addMessage("Name is required", "/Name");
          return;
        }
        if (!oData.Price || isNaN(oData.Price) || oData.Price <= 0) {
          this._addMessage("Price must be greater than 0", "/Price");
          return;
        }
        // Rating between 1 and 5
        if (
          oData.Rating != null &&
          (isNaN(oData.Rating) || oData.Rating < 1 || oData.Rating > 5)
        ) {
          this._addMessage("Rating must be between 1 and 5", "/Rating");
          return;
        }
        // Persist to master "products" JSONModel
        const oComponent = this.getOwnerComponent();
        const oMasterModel = oComponent.getModel("products");
        const aProducts = oMasterModel.getProperty("/Products") || [];
        const sId = oData.ID;

        if (oViewModel.getProperty("/isNew")) {
          // New product: add to master
          // Deep clone so we don't keep UI bindings
          aProducts.push(this._cloneProductPreserveDates(oData));
          oMasterModel.setProperty("/Products", aProducts);
          MessageToast.show("New product created.");

          // Clear the newProduct model so _onMatched won't think it's still new
          oComponent.setModel(null, "newProduct");

          this._oRouter.navTo("ProductDetails", { productId: sId }, true);

          return;
        } else {
          // Existing product: update in master
          const iIndex = aProducts.findIndex((p) => p.ID === sId);
          if (iIndex >= 0) {
            aProducts[iIndex] = this._cloneProductPreserveDates(oData);
            oMasterModel.setProperty("/Products", aProducts);
            MessageToast.show("Saved successfully");
          } else {
            MessageToast.show("Could not find product to update");
          }
          oViewModel.setProperty("/editable", false);
          oViewModel.setProperty("/isNew", false);
          this._oOriginalData = null;
        }
      },

      // Cancel button - if new, discard; else revert to original data, then exit edit mode.

      onCancelPress: function () {
        const oView = this.getView();
        const oViewModel = oView.getModel("viewModel");
        this._oMessageManager.removeAllMessages();

        if (oViewModel.getProperty("/isNew")) {
          this._discardNewProduct();
        } else {
          // Existing: revert to original clone if available, else reload from master
          if (this._oOriginalData) {
            const oProductModel = models.createProductModel(
              this._cloneProductPreserveDates(this._oOriginalData)
            );
            oView.setModel(oProductModel, "product");
          } else {
            // Fallback: reload from master list
            const oData = this.getView().getModel("product").getData();
            const sId = oData.ID;
            const oMasterModel = this.getOwnerComponent().getModel("products");
            const aProducts = oMasterModel.getProperty("/Products") || [];
            const oOrig = aProducts.find((p) => p.ID === sId);
            if (oOrig) {
              const oCloned = this._cloneProductPreserveDates(oOrig);
              const oProductModel = models.createProductModel(oCloned);
              this.getView().setModel(oProductModel, "product");
            }
          }
          // Exit edit mode
          oViewModel.setProperty("/editable", false);
        }
      },

      /**
       * Add validation message via MessageManager
       */
      _addMessage: function (sMsg, sTargetPath) {
        this._oMessageManager.addMessages(
          new Message({
            message: sMsg,
            type: MessageType.Error,
            target: sTargetPath,
            processor: this.getView().getModel("product"),
          })
        );
      },

      /**
       * Delete button pressed - confirm then delete.
       */
      onDeletePress: function () {
        const oProductModel = this.getView().getModel("product");
        if (!oProductModel) {
          MessageToast.show("No product loaded");
          return;
        }
        const oData = oProductModel.getData();
        const sId = oData.ID;

        MessageBox.confirm(
          `Are you sure you want to delete the product "${oData.Name}"? This action cannot be undone.`,
          {
            icon: MessageBox.Icon.WARNING,
            title: "Confirm Deletion",
            actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.DELETE,
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.DELETE) {
                this._performDelete(sId);
              }
            },
          }
        );
      },

      _performDelete: function (sId) {
        const oMasterModel = this.getOwnerComponent().getModel("products");
        const aProducts = oMasterModel.getProperty("/Products") || [];
        const iIndex = aProducts.findIndex((p) => p.ID === sId);

        if (iIndex >= 0) {
          aProducts.splice(iIndex, 1);
          oMasterModel.setProperty("/Products", aProducts);
          MessageToast.show("Product deleted");
        } else {
          MessageToast.show("Could not delete product");
        }

        const oViewModel = this.getView().getModel("viewModel");
        if (oViewModel.getProperty("/isNew")) {
          this._discardNewProduct();
        }
        this._oRouter.navTo("ProductsList");
      },

      /**
       * DatePicker change handler: parse MM/YYYY input into Date. On invalid, set error state.
       */
      onDateChange: function (oEvent) {
        const oDP = oEvent.getSource();
        const sValue = oDP.getValue();
        const aParts = sValue.split("/");
        if (aParts.length === 2) {
          const sMonth = aParts[0].trim();
          const sYear = aParts[1].trim();
          const iMonth = parseInt(sMonth, 10);
          const iYear = parseInt(sYear, 10);
          if (!isNaN(iMonth) && iMonth >= 1 && iMonth <= 12 && !isNaN(iYear)) {
            const oDate = new Date(iYear, iMonth - 1, 1);
            oDP.setDateValue(oDate);
            oDP.setValueState("None");
            return;
          }
        }
      },

      onAddCategory: function () {
        const oProductModel = this.getView().getModel("product");
        if (!oProductModel) {
          MessageToast.show("No product loaded");
          return;
        }
        const oData = oProductModel.getData();
        oData.Categories = oData.Categories || [];
        oData.Categories.push({ ID: "", Name: "" });
        oProductModel.setProperty("/Categories", oData.Categories);
      },

      onDeleteCategory: function () {
        const oTable = this.byId("categoriesTable");
        const aSelectedItems = oTable.getSelectedItems();

        if (aSelectedItems.length === 0) {
          MessageToast.show("Please select at least one category to delete.");
          return;
        }
        const oProductModel = this.getView().getModel("product");
        if (!oProductModel) {
          MessageToast.show("No product loaded.");
          return;
        }
        const aCategories = oProductModel.getProperty("/Categories");

        // Compute indices from binding contexts
        const aIndices = aSelectedItems.map((oItem) =>
          parseInt(
            oItem.getBindingContext("product").getPath().split("/").pop(),
            10
          )
        );
        // Remove in descending index order
        aIndices.sort((a, b) => b - a);
        aIndices.forEach((i) => {
          if (!isNaN(i) && i >= 0 && i < aCategories.length) {
            aCategories.splice(i, 1);
          }
        });
        oProductModel.setProperty("/Categories", aCategories);
        oTable.removeSelections(true);

        MessageToast.show("Selected categories deleted.");
      },

      _discardNewProduct: function () {
        const oComponent = this.getOwnerComponent();
        oComponent.setModel(null, "newProduct");
        this.getView().setModel(null, "product");
        const oViewModel = this.getView().getModel("viewModel");
        oViewModel.setProperty("/isNew", false);
        oViewModel.setProperty("/editable", false);
        this._oOriginalData = null;
        this._oRouter.navTo("ProductsList");
      },
    });
  }
);
