const moment = require('moment');

/**
 * Add utilities, handle data inconsistencies, and provide a clean
 * interface for interacting with
 * <a href="https://developers.google.com/calendar/v3/reference/events">Google Calendar Event data</a>
 * @class
*/
class GoogleCalendarEvent {
  constructor(rawApiEventData) {
    this.summary = rawApiEventData.summary;
    this.htmlLink = rawApiEventData.htmlLink;
    this.attendees = rawApiEventData.attendees || [];
    this.date = rawApiEventData.start && (rawApiEventData.start.dateTime || rawApiEventData.start.date);
  }

  /**
   * clean an email so its reliable in a comparison
   * remove: white space and periods
   * @param {string} email
   * @return {string}
   */
  static cleanEmail(email) {
    const emailStr = `${email}`;
    const parts = emailStr.trim().toLowerCase().split('@');
    const name = parts[0];
    const domain = parts[1];

    return [name.replace(/\./g, ''), domain].join('@');
  }

  /**
   * clean and compare two emails
   * @param {string} emailA
   * @param {string} emailB
   * @return {boolean}
   */
  static emailMatch(emailA, emailB) {
    return this.cleanEmail(emailA) === this.cleanEmail(emailB);
  }

  /**
   * Implement a compare function for Array#sort on events
   * to sort by date ascending
   * @param {GoogleCalendarEvent} a
   * @param {GoogleCalendarEvent} b
   * @return {number} 1: greater, -1: less, 0: equal
   */
  static sortByDateAsc(a, b) {
    if (a.date < b.date) {
      return -1;
    }

    if (a.date > b.date) {
      return 1;
    }

    return 0;
  }

  /**
   * Implement a compare function for Array#sort on events
   * to sort by date descending
   * @param {GoogleCalendarEvent} a
   * @param {GoogleCalendarEvent} b
   * @return {number} 1: greater, -1: less, 0: equal
   */
  static sortByDateDesc(a, b) {
    if (a.date > b.date) {
      return -1;
    }

    if (a.date < b.date) {
      return 1;
    }

    return 0;
  }

  /**
   * Is the given email on your attendee list?
   * @param {string} email
   * @return {boolean}
   */
  isAttending(email) {
    return this.attendees
      .some(attendee => this.constructor.emailMatch(attendee.email, email));
  }

  /**
   * Is this event currently in the future?
   * @return {boolean}
   */
  isFuture() {
    return moment(this.date).isAfter();
  }

  /**
   * Get an object representation of this event for us in
   * email template rendering
   * @return {{summary, htmlLink, date}}
   */
  toObject() {
    return {
      summary: this.summary,
      htmlLink: this.htmlLink,
      date: this.date,
    };
  }
}

module.exports = GoogleCalendarEvent;
