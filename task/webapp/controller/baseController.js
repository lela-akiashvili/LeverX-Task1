sap.ui.define([], function () {
  "use strict";
  return {
    parseDateYYYYMMDD: function (s) {
      if (!s) {
        return null;
      }
      const a = s.split("-");
      return new Date(
        parseInt(a[0], 10),
        parseInt(a[1], 10) - 1,
        parseInt(a[2], 10)
      );
    },
  };
});
