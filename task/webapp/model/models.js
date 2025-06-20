sap.ui.define(
  ["sap/ui/model/json/JSONModel", "sap/ui/Device"],
  function (JSONModel, Device) {
    "use strict";

    return {
      /**
       * Provides runtime information for the device the UI5 app is running on as a JSONModel.
       * @returns {sap.ui.model.json.JSONModel} The device model.
       */
      getDefaultProducts: function () {
        const oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("TwoWay");

        const oData = {
          Products: [
            {
              ID: "P001",
              Name: "Product 1",
              Description: "This is the description for product 1.",
              ReleaseDate: new Date(2020, 5, 17),
              DiscontinuedDate: new Date(2023, 5, 17),
              Rating: 1,
              Price: 70.9,
              Categories: [
                {
                  ID: "C02",
                  Name: "Category 2",
                },
              ],
              Supplier: {
                ID: "S05",
                Name: "Supplier 5",
                Address: "5 Example Street, City 5, Country",
              },
            },
            {
              ID: "P008",
              Name: "Product 2",
              Description: "This is the description for product 2.",
              ReleaseDate: new Date(2021, 5, 17),
              DiscontinuedDate: new Date(2022, 5, 17),
              Rating: 5,
              Price: 54.5,
              Categories: [
                {
                  ID: "C01",
                  Name: "Category 1",
                },
                {
                  ID: "C04",
                  Name: "Category 4",
                },
              ],
              Supplier: {
                ID: "S04",
                Name: "Supplier 4",
                Address: "4 Example Street, City 4, Country",
              },
            },
            {
              ID: "P002",
              Name: "Product 2",
              Description: "This is the description for product 2.",
              ReleaseDate: new Date(2021, 5, 17),
              DiscontinuedDate: new Date(2025, 5, 17),
              Rating: 5,
              Price: 54.5,
              Categories: [
                {
                  ID: "C01",
                  Name: "Category 1",
                },
                {
                  ID: "C04",
                  Name: "Category 4",
                },
              ],
              Supplier: {
                ID: "S04",
                Name: "Supplier 4",
                Address: "4 Example Street, City 4, Country",
              },
            },
            {
              ID: "P003",
              Name: "Product 3",
              Description: "This is the description for product 3.",
              ReleaseDate: new Date(2025, 1, 17),
              DiscontinuedDate: null,
              Rating: 4,
              Price: 89.33,
              Categories: [
                {
                  ID: "C05",
                  Name: "Category 5",
                },
              ],
              Supplier: {
                ID: "S03",
                Name: "test 3",
                Address: "3 Example Street, City 3, Country",
              },
            },
          ],
        };

        oModel.setData(oData);
        return oModel;
      },

      createNewProductData: function (sNewId) {
        const oNewProdModel = new JSONModel({
          ID: sNewId,
          Name: "",
          Description: "",
          ReleaseDate: null,
          DiscontinuedDate: null,
          Rating: null,
          Price: null,
          Categories: [],
          Supplier: {
            ID: "",
            Name: "",
            Address: "",
          },
        });
        return oNewProdModel;
      },

      /**
       * Create the view model for ProductDetails (editable/isNew flags).
       * @returns {sap.ui.model.json.JSONModel}
       */
      createViewModel: function () {
        return new JSONModel({
          editable: false,
          isNew: false,
        });
      },

      createProductModel: function (oProductData) {
        return new JSONModel(oProductData);
      },
    };
  }
);
