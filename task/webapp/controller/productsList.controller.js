sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "task/controller/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/ui/model/type/String",
    "sap/m/Token",

  ],
  function (
    Controller,
    formatter,
    MessageToast,
    MessageBox,
    JSONModel,
    Filter,
    FilterOperator,
    FilterType,
    TypeString,
    Token,
  ) {
    "use strict";

    return Controller.extend("task.controller.ProductsList", {
      formatter: formatter,

      onInit: function () {
        this._oRouter = this.getOwnerComponent().getRouter();

        // Initialize filter model
        const oFilterData = {
          GeneralSearch: "",
          ProductName: "",
          ReleaseDate: { from: null, to: null },
          SupplierName: {},
          CategoryKeys: [],
          ProductIds: [],
        };
        const oFilterModel = new JSONModel(oFilterData);
        this.getView().setModel(oFilterModel, "filters");

        // Initialize categories model
        const oProductsModel = this.getView().getModel("products");
        if (oProductsModel) {
          const oData = oProductsModel.getProperty("/Products");
          if (Array.isArray(oData)) {
            this._setCategoryModel(oData);
          } else {
            oProductsModel.attachRequestCompleted(
              function () {
                const aProducts = oProductsModel.getProperty("/Products") || [];
                this._setCategoryModel(aProducts);
              }.bind(this)
            );
          }
        } else {
          // If the products model is not yet set, wait for the modelContextChange event
          this.getView().attachEventOnce(
            "modelContextChange",
            function () {
              const oLaterProductsModel = this.getView().getModel("products");
              if (oLaterProductsModel) {
                const aProducts =
                  oLaterProductsModel.getProperty("/Products") || [];
                this._setCategoryModel(aProducts);
              }
            }.bind(this)
          );
        }
      },

      /**
       * Build and set the 'cats' model from the array of products.
       * Expects aProducts: Array of product objects, each with a Categories array of { ID, Name }.
       */
      _setCategoryModel: function (aProducts) {
        // Build a map of unique categories by ID
        const mCatById = {};
        aProducts.forEach(function (oProd) {
          if (Array.isArray(oProd.Categories)) {
            oProd.Categories.forEach(function (oCat) {
              if (oCat && oCat.ID) {
                mCatById[oCat.ID] = {
                  ID: oCat.ID,
                  Name: oCat.Name,
                };
              }
            });
          }
        });
        // Convert map to array
        const aCats = Object.values(mCatById);
        // Optionally sort by Name or ID:
        aCats.sort(function (a, b) {
          return a.Name.localeCompare(b.Name);
        });

        // Create or update the "cats" JSONModel
        let oCatsModel = this.getView().getModel("cats");
        if (!oCatsModel) {
          oCatsModel = new JSONModel({ Categories: aCats });
          this.getView().setModel(oCatsModel, "cats");
        } else {
          oCatsModel.setData({ Categories: aCats });
        }
      },

      /**
       * Navigate on row press
       */
      onRowPress: function (oEvent) {
        const oCtx = oEvent.getSource().getBindingContext("products");
        const sProductID = oCtx.getProperty("ID");
        this._oRouter.navTo("ProductDetails", {
          productId: sProductID,
        });
      },

      onSelectionChange: function (oEvent) {
        const oTable = this.byId("productsTable");
        const aSelectedItems = oTable.getSelectedItems();
        const bHasSelections = aSelectedItems.length > 0;

        const oDeleteBtn = this.byId("deleteButton");
        oDeleteBtn.setEnabled(bHasSelections);
      },

      onDelete: function () {
        const oTable = this.byId("productsTable");
        const aSelectedItems = oTable.getSelectedItems();
        if (aSelectedItems.length === 0) {
          MessageToast.show("No products selected for deletion.");
          return;
        }
        const aSelectedData = aSelectedItems.map(function (oItem) {
          return oItem.getBindingContext("products").getObject();
        });
        const aNames = aSelectedData.map(function (oProd) {
          return oProd.Name || oProd.ID;
        });

        let sMessage = "";
        if (aNames.length === 1) {
          sMessage =
            'Do you really want to delete product "' + aNames[0] + '"?';
        } else {
          const sList = aNames
            .map(function (name) {
              return "- " + name;
            })
            .join("\n");
          sMessage =
            "Do you really want to delete the following products?\n" + sList;
        }

        MessageBox.confirm(sMessage, {
          title: "Confirm Deletion",
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
              this._deleteProducts(aSelectedData);
            }
          }.bind(this),
        });
      },

      _deleteProducts: function (aSelectedData) {
        const oModel = this.getView().getModel("products");
        const aProducts = oModel.getProperty("/Products") || [];
        const oIdsToDelete = new Set(
          aSelectedData.map(function (o) {
            return o.ID;
          })
        );
        const aRemaining = aProducts.filter(function (oProd) {
          return !oIdsToDelete.has(oProd.ID);
        });
        oModel.setProperty("/Products", aRemaining);

        // After modifying products, update category model as well
        this._setCategoryModel(aRemaining);

        // Also update FilteredProducts: reapply filters
        this.onFilterSearch();

        const oTable = this.byId("productsTable");
        oTable.removeSelections(true);
        if (aSelectedData.length === 1) {
          MessageToast.show(
            'Product "' +
              (aSelectedData[0].Name || aSelectedData[0].ID) +
              '" deleted.'
          );
        } else {
          MessageToast.show(
            aSelectedData.length + " products deleted successfully."
          );
        }
      },

      /**
       * Create new product (navigate to details)
       */
      onCreatePress: function () {
        const sNewId = "P" + Date.now();
        const oNewProductData = {
          ID: sNewId,
          Name: "",
          Description: "",
          ReleaseDate: null,
          DiscontinuedDate: null,
          Rating: 0,
          Price: null,
          Categories: [],
          Supplier: {
            ID: "",
            Name: "",
            Address: "",
          },
        };
        const oNewProdModel = new JSONModel(oNewProductData);
        this.getOwnerComponent().setModel(oNewProdModel, "newProduct");
        this._oRouter.navTo("ProductDetails", {
          productId: sNewId,
        });
      },

      /**
       * Handler for DynamicDateRange change (ReleaseDate)
       */
      onReleaseDateChange: function (oEvt) {
        const oDDR = oEvt.getSource();
        const aTokens = oDDR.getTokens();
        if (aTokens.length === 1) {
          // Prefer conditions API if available
          const aConds = oDDR.getConditions && oDDR.getConditions();
          if (Array.isArray(aConds) && aConds.length > 0) {
            const oCond = aConds[0];
            const oFrom = oCond.values[0];
            const oTo = oCond.values[1];
            this.getView()
              .getModel("filters")
              .setProperty("/ReleaseDate/from", oFrom);
            this.getView()
              .getModel("filters")
              .setProperty("/ReleaseDate/to", oTo);
          } else {
            // Clear if no valid condition
            this.getView()
              .getModel("filters")
              .setProperty("/ReleaseDate/from", null);
            this.getView()
              .getModel("filters")
              .setProperty("/ReleaseDate/to", null);
          }
        } else {
          // Cleared or no tokens
          this.getView()
            .getModel("filters")
            .setProperty("/ReleaseDate/from", null);
          this.getView()
            .getModel("filters")
            .setProperty("/ReleaseDate/to", null);
        }
        // After changing date filter, reapply
        this.onFilterSearch();
      },

      /**
       * Open ValueHelpDialog for multiple conditions (e.g., ProductId)
       */
      onMultipleConditionsVHRequested: function () {
        // Ensure the input control is retrieved when the user triggers the value help
        this._oMultipleConditionsInput = this.byId("supplierInput");

        this.loadFragment({
          name: "task.view.fragments.ValueHelpDialog",
        }).then(
          function (oMultipleConditionsDialog) {
            this._oMultipleConditionsDialog = oMultipleConditionsDialog;
            this.getView().addDependent(oMultipleConditionsDialog);
            oMultipleConditionsDialog.setRangeKeyFields([
              {
                label: "Product",
                key: "ID",
                type: "string",
                typeInstance: new TypeString({}, { maxLength: 64 }),
              },
            ]);
            // Pass existing tokens if available
            if (this._oMultipleConditionsInput) {
              const aExistingTokens =
                this._oMultipleConditionsInput.getTokens();
              oMultipleConditionsDialog.setTokens(aExistingTokens);
            }
            oMultipleConditionsDialog.open();
          }.bind(this)
        );
      },

      onMultipleConditionsValueHelpOkPress: function (oEvent) {
        const aTokens = oEvent.getParameter("tokens");
        if (this._oMultipleConditionsInput) {
          this._oMultipleConditionsInput.setTokens(aTokens);
        }
        const aIds = aTokens.map(function (oToken) {
          return oToken.getKey();
        });
        this.getView().getModel("filters").setProperty("/ProductIds", aIds);

        this._oMultipleConditionsDialog.close();
        // After selecting tokens, reapply filters
        this.onFilterSearch();
      },

      onMultipleConditionsCancelPress: function () {
        if (this._oMultipleConditionsDialog) {
          this._oMultipleConditionsDialog.close();
        }
      },

      onMultipleConditionsAfterClose: function () {
        if (this._oMultipleConditionsDialog) {
          this._oMultipleConditionsDialog.destroy();
        }
      },

      /**
       * Filter reset - not used yet
       */
      onFilterReset: function () {
        const oFilterModel = this.getView().getModel("filters");
        oFilterModel.setProperty("/GeneralSearch", "");
        oFilterModel.setProperty("/ProductName", "");
        oFilterModel.setProperty("/ReleaseDate/from", null);
        oFilterModel.setProperty("/ReleaseDate/to", null);
        oFilterModel.setProperty("/SupplierName", {});
        oFilterModel.setProperty("/CategoryKeys", []);
        oFilterModel.setProperty("/ProductIds", []);

        // Clear tokens in ValueHelpDialog input
        if (!this._oMultipleConditionsInput) {
          this._oMultipleConditionsInput = this.byId("supplierInput");
        }
        if (this._oMultipleConditionsInput) {
          this._oMultipleConditionsInput.removeAllTokens();
        }

        // Clear supplier MultiInput tokens if any
        const oSupplierInput = this.byId("supplierInput");
        if (oSupplierInput) {
          oSupplierInput.removeAllTokens();
        }
        // Clear category selection UI if present
        const oCategoryFilter = this.byId("categoryFilter");
        if (oCategoryFilter && oCategoryFilter.removeAllSelectedItems) {
          oCategoryFilter.removeAllSelectedItems();
        }
        // Clear DynamicDateRange tokens
        const oDDR = this.byId("releaseDateRange");
        if (oDDR) {
          oDDR.destroyTokens();
          oDDR.setValueState("None");
        }
        // Finally reapply filters to show all
        this.onFilterSearch();
      },

      /**
       * Category MultiComboBox selection finish
       */
      onCategorySelectionFinish: function (oEvt) {
        const aItems = oEvt.getParameter("selectedItems") || [];
        const aKeys = aItems.map((item) => item.getKey());
        this.getView().getModel("filters").setProperty("/CategoryKeys", aKeys);
        this.onFilterSearch();
      },

      _onSupplierDialogConfirm: function (oEvent) {
        const aSelectedItems = oEvent.getParameter("selectedItems");
        const aSupplierIDs = aSelectedItems
          .map(function (oItem) {
            const oCustomData = oItem
              .getCustomData()
              .find((cd) => cd.getKey() === "supplierID");
            return oCustomData && oCustomData.getValue();
          })
          .filter(Boolean);

        this.getView()
          .getModel("filters")
          .setProperty("/SupplierName", aSupplierIDs);

        const oMultiInput = this.byId("supplierInput");
        oMultiInput.removeAllTokens();
        aSelectedItems.forEach(function (oItem) {
          const sName = oItem.getTitle();
          const oCustomData = oItem.getCustomData().find(function (cd) {
            return cd.getKey() === "supplierID";
          });
          const sID = oCustomData && oCustomData.getValue();
          if (sID) {
            const oToken = new Token({
              key: sID,
              text: sName,
            });
            oMultiInput.addToken(oToken);
          }
        });
        this.onFilterSearch();
      },

      onFilterSearch: function () {
        const aFilters = this._buildFilterArray(); // extract filter construction into a helper
        const oTable = this.byId("productsTable");
        oTable.getBinding("items").filter(aFilters, FilterType.Application);
      },

      _buildFilterArray: function () {
        const oFilterModel = this.getView().getModel("filters");
        const oData = oFilterModel.getData();
        const aFilters = [];

        // General Search
        if (oData.GeneralSearch) {
          aFilters.push(
            new Filter({
              filters: [
                new Filter(
                  "Name",
                  FilterOperator.Contains,
                  oData.GeneralSearch
                ),
                new Filter(
                  "Description",
                  FilterOperator.Contains,
                  oData.GeneralSearch
                ),
              ],
              and: false,
            })
          );
        }

        // Product Name
        if (oData.ProductName) {
          aFilters.push(
            new Filter("Name", FilterOperator.Contains, oData.ProductName)
          );
        }

        // Release Date
        if (oData.ReleaseDate.from || oData.ReleaseDate.to) {
          if (oData.ReleaseDate.from && oData.ReleaseDate.to) {
            aFilters.push(
              new Filter(
                "ReleaseDate",
                FilterOperator.BT,
                oData.ReleaseDate.from,
                oData.ReleaseDate.to
              )
            );
          } else if (oData.ReleaseDate.from) {
            aFilters.push(
              new Filter(
                "ReleaseDate",
                FilterOperator.GE,
                oData.ReleaseDate.from
              )
            );
          } else {
            aFilters.push(
              new Filter("ReleaseDate", FilterOperator.LE, oData.ReleaseDate.to)
            );
          }
        }

        // Supplier IDs
        if (
          Array.isArray(oData.SupplierName) &&
          oData.SupplierName.length > 0
        ) {
          const aSupplierFilters = oData.SupplierName.map(function (sID) {
            return new Filter("Supplier/ID", FilterOperator.EQ, sID);
          });
          aFilters.push(new Filter(aSupplierFilters, false)); // OR
        }

        // Categories
        if (
          Array.isArray(oData.CategoryKeys) &&
          oData.CategoryKeys.length > 0
        ) {
          // Create a filter for each category key
          const aCatFilters = oData.CategoryKeys.map(function (sKey) {
         
            return new Filter("Categories", FilterOperator.Contains, sKey);
          });
          aFilters.push(new Filter(aCatFilters, false)); // OR
        }

        // ProductIds from ValueHelpDialog
        if (Array.isArray(oData.ProductIds) && oData.ProductIds.length > 0) {
          const aProductFilters = oData.ProductIds.map(function (sId) {
            return new Filter("ID", FilterOperator.EQ, sId);
          });
          aFilters.push(new Filter(aProductFilters, false));
        }

        return aFilters;
      },
    });
  }
);
