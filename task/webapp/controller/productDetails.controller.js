sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/message/Message",
    "sap/ui/core/library",
    "sap/m/MessageBox",
    "task/model/models",
  ],
  function (
    Controller,
    JSONModel,
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
        this._oRouter = this.getOwnerComponent().getRouter();
        this._oMessageManager = sap.ui.getCore().getMessageManager();
        this._oMessageManager.registerObject(this.getView(), true);

        const oViewModel = models.createViewModel();
        this.getView().setModel(oViewModel, "viewModel");

        this._oRouter
          .getRoute("ProductDetails")
          .attachPatternMatched(this._onMatched, this);
      },

      _onMatched: function (oEvent) {
        const sProductId = oEvent.getParameter("arguments").productId;
        const oView = this.getView();
        const oViewModel = oView.getModel("viewModel");
        const oComponent = this.getOwnerComponent();

        const oNewProdModel = oComponent.getModel("newProduct");
        if (oNewProdModel && oNewProdModel.getProperty("/ID") === sProductId) {
          oView.setModel(oNewProdModel, "product");
          oViewModel.setProperty("/editable", true);
          oViewModel.setProperty("/isNew", true);
          this._oMessageManager.removeAllMessages();
          return;
        }

        const oProductsModel = oComponent.getModel("products");
        const aProducts = oProductsModel.getProperty("/Products") || [];
        const oProduct = aProducts.find((p) => p.ID === sProductId);

        if (oProduct) {
          const oCloned = JSON.parse(JSON.stringify(oProduct));
          const oProductModel = models.createProductModel(oCloned);
          oView.setModel(oProductModel, "product");
          oViewModel.setProperty("/editable", false);
          oViewModel.setProperty("/isNew", false);
          this._oMessageManager.removeAllMessages();
        } else {
          MessageToast.show("Product not found");
          this._oRouter.navTo("ProductsList");
        }
      },
      onNavHome: function () {
        const oViewModel = this.getView().getModel("viewModel");
        if (oViewModel.getProperty("/isNew")) {
          this._discardNewProduct();
        }
        this._oRouter.navTo("ProductsList");
      },

      onEditPress: function () {
        this.getView().getModel("viewModel").setProperty("/editable", true);
        this._oMessageManager.removeAllMessages();
      },

      onSavePress: function () {
        const oView = this.getView();
        const oProductModel = oView.getModel("product");
        const oViewModel = oView.getModel("viewModel");

        const oData = oProductModel.getData();
        this._oMessageManager.removeAllMessages();

        if (!oData.Name) {
          this._addMessage("Name is required", "/Name");
          return
        }
        if (!oData.Price || oData.Price <= 0) {
          this._addMessage("Price must be greater than 0", "/Price");
          return
        }

        const oMasterModel = this.getOwnerComponent().getModel("products");
        const aProducts = oMasterModel.getProperty("/Products") || [];
        const sId = oData.ID;

        if (oViewModel.getProperty("/isNew")) {
          aProducts.push(Object.assign({}, oData));
          oMasterModel.setProperty("/Products", aProducts);
          MessageToast.show("New product created.");
        } else {
          const iIndex = aProducts.findIndex((p) => p.ID === sId);
          if (iIndex >= 0) {
            aProducts[iIndex] = Object.assign({}, oData);
            oMasterModel.setProperty("/Products", aProducts);
            MessageToast.show("Saved successfully");
          } else {
            MessageToast.show("Could not find product to update");
          }
        }

        oViewModel.setProperty("/editable", false);
        oViewModel.setProperty("/isNew", false);
      },

      onCancelPress: function () {
        const oView = this.getView();
        const oViewModel = oView.getModel("viewModel");
        this._oMessageManager.removeAllMessages();

        if (oViewModel.getProperty("/isNew")) {
          this._discardNewProduct();
        } else {
          const oData = oView.getModel("product").getData();
          const sId = oData.ID;
          const oMasterModel = this.getOwnerComponent().getModel("products");
          const aProducts = oMasterModel.getProperty("/Products") || [];
          const oOrig = aProducts.find((p) => p.ID === sId);
          if (oOrig) {
            const oCloned = JSON.parse(JSON.stringify(oOrig));
            const oProductModel = models.createProductModel(oCloned);
            oView.setModel(oProductModel, "product");
          }
          oViewModel.setProperty("/editable", false);
        }
      },

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

      onDateChange: function (oEvent) {
        const oDatePicker = oEvent.getSource();
        const sValue = oDatePicker.getValue();

        const aParts = sValue.split("/");
        if (aParts.length === 2) {
          const sMonth = aParts[0].padStart(2, "0");
          const sYear = aParts[1];

          const sFormatted = `${sYear}/${sMonth}`;
          oDatePicker.setDateValue(new Date(sFormatted));
        } else {
          oDatePicker.setValueState("Error");
          oDatePicker.setValueStateText(
            "Please enter month and year in MM/YYYY format."
          );
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
        oProductModel.setData(oData);
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

        const aIndices = aSelectedItems.map((oItem) =>
          parseInt(
            oItem.getBindingContext("product").getPath().split("/").pop()
          )
        );

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
        this._oRouter.navTo("ProductsList");
      },
    });
  }
);
