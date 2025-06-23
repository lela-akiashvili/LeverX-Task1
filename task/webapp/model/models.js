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
            {
              ID: "P004",
              Name: "Smartphone X100",
              Description:
                "A sleek smartphone with top-tier performance and camera.",
              ReleaseDate: new Date(2022, 2, 10),
              DiscontinuedDate: null,
              Rating: 4,
              Price: 699.99,
              Categories: [
                { ID: "C01", Name: "Category 1" },
                { ID: "C03", Name: "Category 3" },
              ],
              Supplier: {
                ID: "S02",
                Name: "Mobile Tech Ltd.",
                Address: "22 Silicon Alley, Tech City, Country",
              },
            },
            {
              ID: "P005",
              Name: "Wireless Headphones Pro",
              Description:
                "Noise-cancelling headphones with 40-hour battery life.",
              ReleaseDate: new Date(2019, 10, 1),
              DiscontinuedDate: new Date(2024, 3, 1),
              Rating: 3,
              Price: 129.99,
              Categories: [{ ID: "C02", Name: "Category 2" }],
              Supplier: {
                ID: "S01",
                Name: "AudioCorp",
                Address: "10 Sound Street, Musicville, Country",
              },
            },
            {
              ID: "P006",
              Name: "Eco-Friendly Notebook",
              Description:
                "Recycled paper, biodegradable cover, and plant-based ink.",
              ReleaseDate: new Date(2023, 6, 5),
              DiscontinuedDate: null,
              Rating: 5,
              Price: 9.5,
              Categories: [
                { ID: "C04", Name: "Category 4" },
                { ID: "C06", Name: "Category 6" },
              ],
              Supplier: {
                ID: "S06",
                Name: "GreenStationery Inc.",
                Address: "Eco Park 6, Nature Town, Country",
              },
            },
            {
              ID: "P007",
              Name: "Gaming Laptop ZX",
              Description:
                "High-performance laptop for gaming and content creation.",
              ReleaseDate: new Date(2021, 8, 22),
              DiscontinuedDate: null,
              Rating: 4,
              Price: 1499.0,
              Categories: [
                { ID: "C01", Name: "Category 1" },
                { ID: "C05", Name: "Category 5" },
              ],
              Supplier: {
                ID: "S07",
                Name: "GameTech Corp",
                Address: "99 Pixel Ave, Gamerville, Country",
              },
            },
            {
              ID: "P009",
              Name: "Kitchen Blender 3000",
              Description: "Powerful blender with multiple speed settings.",
              ReleaseDate: new Date(2020, 0, 15),
              DiscontinuedDate: new Date(2023, 11, 31),
              Rating: 2,
              Price: 49.99,
              Categories: [{ ID: "C03", Name: "Category 3" }],
              Supplier: {
                ID: "S08",
                Name: "HomeAppliances Co.",
                Address: "12 Kitchen Street, Appliance City, Country",
              },
            },
            {
              ID: "P010",
              Name: "Office Chair Ergonomic",
              Description: "Adjustable ergonomic chair with lumbar support.",
              ReleaseDate: new Date(2022, 3, 3),
              DiscontinuedDate: null,
              Rating: 5,
              Price: 199.0,
              Categories: [
                { ID: "C02", Name: "Category 2" },
                { ID: "C04", Name: "Category 4" },
              ],
              Supplier: {
                ID: "S09",
                Name: "Comfort Office Ltd.",
                Address: "7 Work Street, OfficeTown, Country",
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

      /**
       * Creates and returns a configuration model for app‑wide settings.
       * @param {object} [oConfig] initial config
       */
      getConfigModel: function (oConfig) {
        const oModel = new JSONModel(
          oConfig || {
            theme: "light",
            language: sap.ui.getCore().getConfiguration().getLanguage(),
          }
        );
        oModel.setDefaultBindingMode("OneWay"); 
        return oModel;
      },
    };
  }
);
