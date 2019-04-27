const moment = require('moment');
const GoogleAPI = require('./GoogleAPI');
const GoogleCalendarEvent = require('./GoogleCalendarEvent');

class GoogleCalendar extends GoogleAPI {
  constructor(creds) {
    super(creds);
    this.events = [];

    this.targetMaxWeeksApart = {
      weekly: 1,
      monthly: 4,
      quarterly: 12,
      biannually: 26,
      annually: 52,
    };
  }

  static getApiVersion() {
    return { name: 'calendar', version: 'v3' };
  }

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

  getNextEvent(email) {
    const nextEvent = this.events
      .filter(event => event.isFuture())
      .filter(event => event.isAttending(email))
      .sort(GoogleCalendarEvent.sortByDateAsc)
      .shift();

    return nextEvent ? nextEvent.toObject() : null;
  }

  getLastEvent(email) {
    const lastEvent = this.events
      .filter(event => !event.isFuture())
      .filter(event => event.isAttending(email))
      .sort(GoogleCalendarEvent.sortByDateDesc)
      .shift();

    return lastEvent ? lastEvent.toObject() : null;
  }

  isScheduled(email) {
    return this.events
      .filter(event => event.isFuture())
      .some(event => event.isAttending(email));
  }

  //  0 => saw them in the past 7 days
  // -1 => never seen them in the past
  // >0 => # of weeks since last seen (decimals round down)
  computeWeeksSinceLastSeen(email) {
    const event = this.getLastEvent(email);

    if (event) {
      const lastSeenDate = moment(event.date);

      return moment().diff(lastSeenDate, 'weeks');
    }

    return -1;
  }

  // 1) weekly, 3 weeks => 3/1 => 3.0
  // 2) monthly, 3 weeks => 3/4 => 0.75
  // 3) quarterly, 10 weeks => 10/12 => 0.83
  // 4) biannually, 10 weeks => 10/26 => 0.38
  // 5) annually. 26 weeks => 26/52 => 0.5
  // ranks: 1, 3, 2, 4, 5
  computeLastSeenScore(email, targetFrequency) {
    const targetMaxWeeksApart = this.targetMaxWeeksApart[targetFrequency];
    const weeksSinceLastSeen = this.computeWeeksSinceLastSeen(email);

    return weeksSinceLastSeen === -1 ? -1 : weeksSinceLastSeen / targetMaxWeeksApart;
  }
}

module.exports = GoogleCalendar;
