const moment = require('moment');
const GoogleAPI = require('./GoogleAPI');
const GoogleCalendarEvent = require('./GoogleCalendarEvent');

/**
 * Pull event data from your Google Calendar
 * @class GoogleCalendar
 * @param {Object} creds
 */
class GoogleCalendar extends GoogleAPI {
  constructor(creds) {
    super(creds);
    this.events = [];
  }

  /**
   * @static
   * @private
   * @param {string} targetFrequency
   * @return {number}
   */
  static getTargetMaxWeeksApart(targetFrequency) {
    const targetMaxWeeksApart = {
      weekly: 1,
      monthly: 4,
      quarterly: 12,
      biannually: 26,
      annually: 52,
    };

    return targetMaxWeeksApart[targetFrequency.toLowerCase()];
  }

  /**
   * @static
   * @override
   * @private
   * @return {{name: string, version: string}}
   */
  static getApiVersion() {
    return { name: 'calendar', version: 'v3' };
  }

  /**
   * load all events on your calendar for given time range
   * @param {Date} from
   * @param {Date} to
   * @return {Promise}
   */
  load(from, to) {
    return new Promise((resolve, reject) => {
      this.api.events.list({
        calendarId: 'primary',
        timeMax: to,
        timeMin: from,
        maxEvents: 2500, // max allowed
        singleEvents: true,
        orderBy: 'startTime',
      }, (err, res) => {
        if (err) {
          return reject(err);
        }

        this.events = res.data.items
          .map(rawApiData => new GoogleCalendarEvent(rawApiData));

        return resolve(this);
      });
    });
  }

  /**
   * get the next event in the future that
   * has given email as an attendee
   * @param {string} email
   * @return {GoogleCalendarEvent|null}
   */
  getNextEvent(email) {
    const nextEvent = this.events
      .filter(event => event.isFuture())
      .filter(event => event.isAttending(email))
      .sort(GoogleCalendarEvent.sortByDateAsc)
      .shift();

    return nextEvent ? nextEvent.toObject() : null;
  }

  /**
   * get the last event in the past that
   * has given email as an attendee
   * @param {string} email
   * @return {GoogleCalendarEvent|null}
   */
  getLastEvent(email) {
    const lastEvent = this.events
      .filter(event => !event.isFuture())
      .filter(event => event.isAttending(email))
      .sort(GoogleCalendarEvent.sortByDateDesc)
      .shift();

    return lastEvent ? lastEvent.toObject() : null;
  }

  /**
   * return true if any event in the future
   * has given email as an attendee
   * @param {string} email
   * @return {boolean}
   */
  isScheduled(email) {
    return this.events
      .filter(event => event.isFuture())
      .some(event => event.isAttending(email));
  }

  /**
   * Count how many weeks it's been
   * since you last had an event with
   * the given attendee
   * @param {string} email
   * @return {number} -1, no events with this attendee found
   */
  computeWeeksSinceLastSeen(email) {
    const event = this.getLastEvent(email);

    if (event) {
      const lastSeenDate = moment(event.date);

      return moment().diff(lastSeenDate, 'weeks');
    }

    return -1;
  }

  /**
   * Based on your target frequency in seeing someone, compute
   * based on how long since you last saw them - how far off you are
   *
   * weeks since seen / target weeks apart
   *
   * @param {string} email
   * @param {string} targetFrequency weekly|monthly|quarterly|biannually|annually
   * @return {number}
   */
  computeLastSeenScore(email, targetFrequency) {
    const targetMaxWeeksApart = this.constructor.getTargetMaxWeeksApart(targetFrequency);
    const weeksSinceLastSeen = this.computeWeeksSinceLastSeen(email);

    return weeksSinceLastSeen === -1 ? -1 : weeksSinceLastSeen / targetMaxWeeksApart;
  }
}

module.exports = GoogleCalendar;
