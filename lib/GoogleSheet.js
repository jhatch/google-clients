const GoogleAPI = require('./GoogleAPI');

/**
 * Read and write rows in a Google Sheet
 * @class
 * @param {Object} creds
 * @param {Object} config
 */
class GoogleSheet extends GoogleAPI {
  constructor(creds, config = {}) {
    super(creds);
    this.orderedColumnHeaders = config.orderedColumnHeaders;
    this.rows = [];
  }

  static getApiVersion() {
    return { version: 'v4', name: 'sheets' };
  }

  inflateRow(rawRowData) {
    if (this.orderedColumnHeaders) {
      const rowObj = {};

      this.orderedColumnHeaders.forEach((header, index) => {
        rowObj[header] = rawRowData[index];
      });

      return rowObj;
    }

    return rawRowData;
  }

  /**
   * Load a given range in a given sheet
   * @param {string} sheetId
   * @param {string} range
   * @return {Promise}
   */
  load(sheetId, range) {
    return new Promise((resolve, reject) => {
      this.api.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      }, (err, res) => {
        if (err) {
          return reject(err);
        }

        this.rows = res.data.values
          .map(rawRowData => this.inflateRow(rawRowData));

        return resolve(this);
      });
    });
  }

  /**
   * Write the given values into the given range of
   * the given sheet
   * @param {string} id
   * @param {string} range
   * @param {Array[]} values
   * @return {Promise}
   */
  update(id, range, values) {
    return new Promise((resolve, reject) => {
      this.api.spreadsheets.values.update({
        spreadsheetId: id,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values,
        },
      }, (err, response) => {
        if (err) {
          return reject(err);
        }

        return resolve(response);
      });
    });
  }
}

module.exports = GoogleSheet;
