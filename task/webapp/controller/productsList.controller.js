sap.ui.define(
  [
    "task/BaseController.controller",
    "task/utils/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/ui/model/type/String",
    "task/model/models",
    "sap/ui/comp/library",
  ],
  function (
    BaseController,
    formatter,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator,
    FilterType,
    TypeString,
    models,
    compLibrary
  ) {
    "use strict";

    return BaseController.extend("task.controller.ProductsList", {
      formatter: formatter,

      onInit: function () {
        this.onInitBase();

        // Set up filter bar clear handler
        const oFilterBar = this.byId("filterBar");
        oFilterBar.attachClear(this.onFilterClear, this);

        // Multiple Conditions Input
        this._oMultipleConditionsInput = this.byId("supplierInput");
        if (this._oMultipleConditionsInput) {
          this._oMultipleConditionsInput.setTokens([]);
          // When user manually removes a token, reapply filters
          this._oMultipleConditionsInput.attachTokenUpdate(
            function () {
              this._applyAllFilters();
            }.bind(this)
          );
        }
      },

      onFilterSearch: function (oEvent) {
        let sQuery = "";
        if (oEvent && typeof oEvent.getParameter === "function") {
          const sParamQuery = oEvent.getParameter("query");
          if (sParamQuery !== undefined) {
            sQuery = sParamQuery;
          }
        }
        if (!sQuery) {
          const oSearchField = this.byId("generalSearchField");
          if (oSearchField) {
            sQuery = oSearchField.getValue();
          }
        }
        this._applyAllFilters(sQuery);
      },

      onFilterClear: function (oEvent) {
        // Clear general search field
        const oSearchField = this.byId("generalSearchField");
        if (oSearchField && typeof oSearchField.setValue === "function") {
          oSearchField.setValue("");
        }
        // Clear product name input
        const oProductInput = this.byId("productNameInput");
        if (oProductInput && typeof oProductInput.setValue === "function") {
          oProductInput.setValue("");
        }
        // Clear releaseDateRange DDR
        const oDDRRel = this.byId("releaseDateRange");
        if (oDDRRel) {
          if (typeof oDDRRel.removeAllTokens === "function") {
            oDDRRel.removeAllTokens();
          } else if (typeof oDDRRel.setValue === "function") {
            // If it's a different control
            oDDRRel.setValue({});
          }
        }
        // Clear discontinuedDateRange DDR
        const oDDRDisc = this.byId("discontinuedDateRange");
        if (oDDRDisc) {
          if (typeof oDDRDisc.removeAllTokens === "function") {
            oDDRDisc.removeAllTokens();
          } else if (typeof oDDRDisc.setValue === "function") {
            oDDRDisc.setValue({});
          }
        }
        // Clear MultiComboBox categories
        const oCategoryMCB = this.byId("categoryFilter");
        if (
          oCategoryMCB &&
          typeof oCategoryMCB.setSelectedKeys === "function"
        ) {
          oCategoryMCB.setSelectedKeys([]);
        }

        if (this._oMultipleConditionsInput) {
          this._oMultipleConditionsInput.setTokens([]);
        }
        // Reapply filters with empty query
        this._applyAllFilters("");
      },

      onReleaseDateChange: function () {
        this._applyAllFilters();
      },

      onDiscontinuedDateChange: function () {
        this._applyAllFilters();
      },

      handleSelectionFinish: function (oEvent) {
        this._applyAllFilters();
      },

      _applyAllFilters: function (sQuery) {
        const oView = this.getView();
        const oTable = oView.byId("productsTable");
        if (!oTable) {
          return;
        }
        const oBinding = oTable.getBinding("items");
        if (!oBinding) {
          return;
        }

        // General free-text search
        if (sQuery === undefined) {
          const oSearchField = oView.byId("generalSearchField");
          sQuery = oSearchField ? oSearchField.getValue() : "";
        }
        const sQueryLower = (sQuery || "").trim().toLowerCase();
        let oGeneralFilter = null;
        if (sQueryLower) {
          const aGeneralFilters = [
            new Filter("ID", FilterOperator.Contains, sQueryLower),
            new Filter("Name", FilterOperator.Contains, sQueryLower),
            new Filter("Supplier/Name", FilterOperator.Contains, sQueryLower),
            new Filter({
              path: "Categories",
              // Categories is an array so - test function
              test: function (aCategories) {
                if (!Array.isArray(aCategories)) {
                  return false;
                }
                return aCategories.some(function (oCat) {
                  return (
                    oCat &&
                    oCat.Name &&
                    oCat.Name.toString().toLowerCase().includes(sQueryLower)
                  );
                });
              },
            }),
          ];
          oGeneralFilter = new Filter({ filters: aGeneralFilters, and: false });
        }

        // Product Name Suggestions filter
        let oProductNameFilter = null;
        const oProductInput = oView.byId("productNameInput");
        if (oProductInput) {
          const sProductName = (oProductInput.getValue() || "").trim();
          if (sProductName) {
            oProductNameFilter = new Filter(
              "Name",
              FilterOperator.Contains,
              sProductName
            );
          }
        }

        // Date filters from DDRs
        const oDDRRel = oView.byId("releaseDateRange");
        const oDDRDisc = oView.byId("discontinuedDateRange");
        const oValRel = oDDRRel ? oDDRRel.getValue() : null;
        const oValDisc = oDDRDisc ? oDDRDisc.getValue() : null;
        const aDateFilters = [];
        const oFilterRel = this._createDateFilter("ReleaseDate", oValRel);
        if (oFilterRel) {
          aDateFilters.push(oFilterRel);
        }
        const oFilterDisc = this._createDateFilter(
          "DiscontinuedDate",
          oValDisc
        );
        if (oFilterDisc) {
          aDateFilters.push(oFilterDisc);
        }
        let oDateCombinedFilter = null;
        if (aDateFilters.length === 1) {
          oDateCombinedFilter = aDateFilters[0];
        } else if (aDateFilters.length > 1) {
          oDateCombinedFilter = new Filter({
            filters: aDateFilters,
            and: true,
          });
        }

        // Category filter via MultiComboBox
        let oCategoryFilter = null;
        const oCategoryMCB = oView.byId("categoryFilter");
        if (oCategoryMCB) {
          const aSelectedKeys = oCategoryMCB.getSelectedKeys();
          if (Array.isArray(aSelectedKeys) && aSelectedKeys.length > 0) {
            oCategoryFilter = new Filter({
              path: "Categories",
              test: function (aCategories) {
                if (!Array.isArray(aCategories)) {
                  return false;
                }
                return aCategories.some(function (oCat) {
                  return oCat && aSelectedKeys.indexOf(oCat.ID) !== -1;
                });
              },
            });
          }
        }

        // Supplier Name conditions from ValueHelpDialog tokens
        let oSupplierFilter = null;
        const aTokens = this._oMultipleConditionsInput
          ? this._oMultipleConditionsInput.getTokens() || []
          : [];
        if (aTokens.length > 0) {
          const aRangeFilters = aTokens
            .map(function (oToken) {
              const oRange = oToken.data("range");
              if (!oRange) {
                return null;
              }
              // Only keyField "Name" for Supplier
              if (oRange.keyField !== "Name") {
                return null;
              }
              const sOp = oRange.operation;
              const v1 = oRange.value1;
              switch (sOp) {
                case compLibrary
                  .valuehelpdialog.ValueHelpRangeOperation.Contains:
                  return new Filter(
                    "Supplier/Name",
                    FilterOperator.Contains,
                    v1
                  );
                case compLibrary
                  .valuehelpdialog.ValueHelpRangeOperation.StartsWith:
                  return new Filter(
                    "Supplier/Name",
                    FilterOperator.StartsWith,
                    v1
                  );
                case compLibrary.valuehelpdialog.ValueHelpRangeOperation.EQ:
                  return new Filter("Supplier/Name", FilterOperator.EQ, v1);
                case compLibrary
                  .valuehelpdialog.ValueHelpRangeOperation.EndsWith:
                  return new Filter(
                    "Supplier/Name",
                    FilterOperator.EndsWith,
                    v1
                  );
                default:
                  return null;
              }
            })
            .filter(function (f) {
              return f;
            });

          if (aRangeFilters.length === 1) {
            oSupplierFilter = aRangeFilters[0];
          } else if (aRangeFilters.length > 1) {
            // Combine multiple with AND
            oSupplierFilter = new Filter({ filters: aRangeFilters, and: true });
          }
        }

        // Combine all filters with AND semantics
        const aAllFilters = [];
        if (oGeneralFilter) {
          aAllFilters.push(oGeneralFilter);
        }
        if (oProductNameFilter) {
          aAllFilters.push(oProductNameFilter);
        }
        if (oDateCombinedFilter) {
          aAllFilters.push(oDateCombinedFilter);
        }
        if (oCategoryFilter) {
          aAllFilters.push(oCategoryFilter);
        }
        if (oSupplierFilter) {
          aAllFilters.push(oSupplierFilter);
        }

        let oFinalFilter = null;
        if (aAllFilters.length === 1) {
          oFinalFilter = aAllFilters[0];
        } else if (aAllFilters.length > 1) {
          oFinalFilter = new Filter({ filters: aAllFilters, and: true });
        }

        if (oFinalFilter) {
          oBinding.filter(oFinalFilter, FilterType.Application);
        } else {
          oBinding.filter([], FilterType.Application);
        }
      },

      _createDateFilter: function (fieldName, oVal) {
        if (!oVal || !oVal.operator) {
          return null;
        }
        const op = oVal.operator;
        const vals = oVal.values || [];
        // Helpers for day boundaries
        const startOfDay = (date) =>
          new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = (date) => {
          const d = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );
          d.setDate(d.getDate() + 1);
          d.setMilliseconds(d.getMilliseconds() - 1);
          return d;
        };
        switch (op) {
          case "DATE": {
            const dateObj = vals[0];
            if (!(dateObj instanceof Date)) return null;
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(dateObj),
              value2: endOfDay(dateObj),
            });
          }
          case "DATERANGE": {
            const [dateStart, dateEnd] = vals;
            if (!(dateStart instanceof Date) || !(dateEnd instanceof Date))
              return null;
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(dateStart),
              value2: endOfDay(dateEnd),
            });
          }
          case "FROM": {
            const dateObj = vals[0];
            if (!(dateObj instanceof Date)) return null;
            return new Filter(
              fieldName,
              FilterOperator.GE,
              startOfDay(dateObj)
            );
          }
          case "TO": {
            const dateObj = vals[0];
            if (!(dateObj instanceof Date)) return null;
            return new Filter(fieldName, FilterOperator.LE, endOfDay(dateObj));
          }
          case "TODAY": {
            const today = new Date();
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: startOfDay(today),
              value2: endOfDay(today),
            });
          }
          case "THISWEEK": {
            const now = new Date();
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            const weekStart = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - diffToMonday
            );
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            weekEnd.setMilliseconds(weekEnd.getMilliseconds() - 1);
            return new Filter({
              path: fieldName,
              operator: FilterOperator.BT,
              value1: weekStart,
              value2: weekEnd,
            });
          }
          default:
            console.warn("Operator not handled:", op);
            return null;
        }
      },

      // Navigate on row press
      onRowPress: function (oEvent) {
        const oCtx = oEvent.getSource().getBindingContext("products");
        if (oCtx) {
          const sProductID = oCtx.getProperty("ID");
          this.getRouter().navTo("ProductDetails", {
            productId: sProductID,
          });
        }
      },

      onSelectionChange: function (oEvent) {
        const oTable = this.byId("productsTable");
        const aSelectedItems = oTable.getSelectedItems();
        const bHasSelections = aSelectedItems.length > 0;

        const oDeleteBtn = this.byId("deleteButton");
        if (oDeleteBtn) {
          oDeleteBtn.setEnabled(bHasSelections);
        }
      },

      onDelete: function () {
        const oTable = this.byId("productsTable");
        const aSelectedItems = oTable.getSelectedItems();
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

        // Reapply filters
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

      onCreatePress: function () {
        const sNewId = "P" + Date.now();
        const oNewProdModel = models.createNewProductData(sNewId);
        this.getOwnerComponent().setModel(oNewProdModel, "newProduct");
        this.getRouter().navTo("ProductDetails", {
          productId: sNewId,
        });
      },

      onVHRequested: function () {
        if (!this._oSupplierVHD) {
          this.loadFragment({
            name: "task.view.fragments.ValueHelpDialog",
          }).then(
            function (oDialog) {
              this._oSupplierVHD = oDialog;
              this.getView().addDependent(this._oSupplierVHD);

              this._oSupplierVHD.setRangeKeyFields([
                {
                  label: "Supplier Name",
                  key: "Name",
                  type: "string",
                  typeInstance: new TypeString({}, { maxLength: 100 }),
                },
              ]);

              // populate existing tokens so user sees previous conditions
              const aExistingTokens =
                this._oMultipleConditionsInput.getTokens() || [];
              this._oSupplierVHD.setTokens(aExistingTokens);

              this._oSupplierVHD.open();
            }.bind(this)
          );
        } else {
          const aExisting = this._oMultipleConditionsInput.getTokens() || [];
          this._oSupplierVHD.setTokens(aExisting);
          this._oSupplierVHD.open();
        }
      },

      onValueHelpOkPress: function (oEvent) {
        const aTokens = oEvent.getParameter("tokens") || [];
        this._oMultipleConditionsInput.setTokens(aTokens);
        this._applyAllFilters();
        this._oSupplierVHD.close();
      },

      onVHDCancelPress: function () {
        if (this._oSupplierVHD) {
          this._oSupplierVHD.close();
        }
      },

      onVHDAfterClose: function () {
        if (this._oSupplierVHD) {
          this._oSupplierVHD.destroy();
          this._oSupplierVHD = null;
        }
      },
    });
  }
);
