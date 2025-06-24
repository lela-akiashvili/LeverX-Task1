sap.ui.define(
  [
    "task/controller/BaseController.controller",
    "sap/m/MessageToast",
    "sap/ui/core/message/Message",
    "sap/ui/core/library",
    "sap/m/MessageBox",
    "task/model/models",
  ],
  function (
    BaseController,
    MessageToast,
    Message,
    coreLibrary,
    MessageBox,
    models
  ) {
    "use strict";
    const MessageType = coreLibrary.MessageType;

    return BaseController.extend("task.controller.ProductDetails", {
      PRODUCTTABLE_ID: "categoriesTable",

      onInit: function () {
        this.onInitBase();

        // MessageManager for validation messages
        this._oMessageManager = sap.ui.getCore().getMessageManager();
        this._oMessageManager.registerObject(this.getView(), true);

        // View model to hold editable/isNew flags
        const oViewModel = models.createViewModel();
        this.setModel(oViewModel, "viewModel");

        // Attach route match using router from BaseController
        this.getRouter()
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

        // Clear any previous validation messages
        this._oMessageManager.removeAllMessages();

        // If there's a "newProduct" model in component and its ID matches, treat as new
        const oNewProdModel = oComponent.getModel("newProduct");
        if (oNewProdModel) {
          const sNewModelId = oNewProdModel.getProperty("/ID");
          if (sNewModelId === sProductId) {
            // CREATE NEW PRODUCT MODE
            oView.setModel(oNewProdModel, "product");
            oViewModel.setProperty("/editable", true);
            oViewModel.setProperty("/isNew", true);
            // Store snapshot for Cancel
            this._storeOriginalData(oNewProdModel.getData());
            return;
          }
        }

        // Otherwise load existing product
        // Use getProductModel() from BaseController for the global products model
        const oProductsModel = this.getProductModel();
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
          // Clear any leftover messages
          this._oMessageManager.removeAllMessages();

          // Store original data for Cancel revert
          this._storeOriginalData(oProduct);
        } else {
          MessageToast.show("Product not found");
          this.getRouter().navTo("ProductsList");
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
        const oViewModel = this.getModel("viewModel");
        if (oViewModel.getProperty("/isNew")) {
          this._discardNewProduct();
        }
        this.getRouter().navTo("ProductsList");
      },

      onEditPress: function () {
        const oViewModel = this.getModel("viewModel");
        oViewModel.setProperty("/editable", true);
        this._oMessageManager.removeAllMessages();

        // Store original data for Cancel.
        const oCurrentData = this.getModel("product").getData();
        this._storeOriginalData(oCurrentData);
      },
      onSavePress: function () {
        const oView = this.getView();
        const oProductModel = oView.getModel("product");
        const oViewModel = oView.getModel("viewModel");
        const oData = oProductModel.getData();

        // Clear previous messages
        this._oMessageManager.removeAllMessages();
        const aErrors = [];

        if (!oData.Name || oData.Name.trim() === "") {
          aErrors.push({ message: "Name is required", path: "/Name" });
        }

        if (oData.Price == null || isNaN(oData.Price) || oData.Price <= 0) {
          aErrors.push({
            message: "Price must be a number greater than 0",
            path: "/Price",
          });
        }

        if (
          oData.Rating == null ||
          isNaN(oData.Rating) ||
          oData.Rating < 1 ||
          oData.Rating > 5
        ) {
          aErrors.push({
            message: "Rating must be a number between 1 and 5",
            path: "/Rating",
          });
        }
        if (aErrors.length > 0) {
          aErrors.forEach((err) => {
            this._addMessage(err.message, err.path);
          });
          return;
        }

        const oMasterModel = this.getProductModel();
        const aProducts = oMasterModel.getProperty("/Products") || [];
        const sId = oData.ID;

        if (oViewModel.getProperty("/isNew")) {
          aProducts.push(this._cloneProductPreserveDates(oData));
          oMasterModel.setProperty("/Products", aProducts);
          MessageToast.show("New product created.");

          //remove "newProduct" model so _onMatched won't treat it as new
          this.getOwnerComponent().setModel(null, "newProduct");

          // new JSONModel for the now-saved product data
          const oSavedDataClone = this._cloneProductPreserveDates(oData);
          const oSavedProductModel = models.createProductModel(oSavedDataClone);
          oView.setModel(oSavedProductModel, "product");

          // update viewModel to read-only
          oViewModel.setProperty("/editable", false);
          oViewModel.setProperty("/isNew", false);

          // Clear stored data
          this._oOriginalData = null;

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
          // Exit edit mode
          oViewModel.setProperty("/editable", false);
          oViewModel.setProperty("/isNew", false);
          this._oOriginalData = null;
        }
      },

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
            const oData = this.getModel("product").getData();
            const sId = oData.ID;
            const oMasterModel = this.getProductModel();
            const aProducts = oMasterModel.getProperty("/Products") || [];
            const oOrig = aProducts.find((p) => p.ID === sId);
            if (oOrig) {
              const oCloned = this._cloneProductPreserveDates(oOrig);
              const oProductModel = models.createProductModel(oCloned);
              this.setModel(oProductModel, "product");
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
            processor: this.getModel("product"),
          })
        );
      },

      /**
       * Delete button pressed - confirm then delete.
       */
      onDeletePress: function () {
        const oProductModel = this.getModel("product");
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
        const oMasterModel = this.getProductModel();
        const aProducts = oMasterModel.getProperty("/Products") || [];
        const iIndex = aProducts.findIndex((p) => p.ID === sId);

        if (iIndex >= 0) {
          aProducts.splice(iIndex, 1);
          oMasterModel.setProperty("/Products", aProducts);
          MessageToast.show("Product deleted");
        } else {
          MessageToast.show("Could not delete product");
        }

        const oViewModel = this.getModel("viewModel");
        if (oViewModel.getProperty("/isNew")) {
          this._discardNewProduct();
        }
        this.getRouter().navTo("ProductsList");
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
        const oProductModel = this.getModel("product");
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
        const oTable = this.byId(PRODUCTTABLE_ID);
        const aSelectedItems = oTable.getSelectedItems();

        if (aSelectedItems.length === 0) {
          MessageToast.show("Please select at least one category to delete.");
          return;
        }
        const oProductModel = this.getModel("product");
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
        this.setModel(null, "newProduct", true);
        this.setModel(null, "product");
        const oViewModel = this.getModel("viewModel");
        if (oViewModel) {
          oViewModel.setProperty("/isNew", false);
          oViewModel.setProperty("/editable", false);
        }
        this._oOriginalData = null;
        this.getRouter().navTo("ProductsList");
      },
    });
  }
);
