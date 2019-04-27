const moment = require('moment');

/*
  Purpose:
    - add helpful utilities
    - handle data inconsistencies
    - hide data we don't use, so tests don't have to mock it all
  */
class GoogleCalendarEvent {
  constructor(rawApiEventData) {
    this.summary = rawApiEventData.summary;
    this.htmlLink = rawApiEventData.htmlLink;
    this.attendees = rawApiEventData.attendees || [];
    this.date = rawApiEventData.start && (rawApiEventData.start.dateTime || rawApiEventData.start.date);
  }

  static cleanEmail(email) {
    const parts = email.trim().toLowerCase().split('@');
    const name = parts[0];
    const domain = parts[1];

    return [name.replace(/\./g, ''), domain].join('@');
  }

  static emailMatch(emailA, emailB) {
    return this.cleanEmail(emailA) === this.cleanEmail(emailB);
  }

  // compareFunction
  static sortByDateAsc(a, b) {
    if (a.date < b.date) {
      return -1;
    }

    if (a.date > b.date) {
      return 1;
    }

    return 0;
  }

  // compareFunction
  static sortByDateDesc(a, b) {
    if (a.date > b.date) {
      return -1;
    }

    if (a.date < b.date) {
      return 1;
    }

    return 0;
  }

  isAttending(email) {
    return this.attendees
      .some(attendee => this.constructor.emailMatch(attendee.email, email));
  }

  isFuture() {
    return moment(this.date).isAfter();
  }

  toObject() {
    return {
      summary: this.summary,
      htmlLink: this.htmlLink,
      date: this.date,
    };
  }
}

module.exports = GoogleCalendarEvent;
