const moment = require('moment');
const { expect } = require('chai'); // eslint-disable-line import/no-extraneous-dependencies
const GoogleCalendarEvent = require('./GoogleCalendarEvent');

describe('[class] GoogleCalendarEvent', () => {
  /* eslint no-unused-expressions: off */
  let event;
  let nullEvent;

  beforeEach(() => {
    nullEvent = new GoogleCalendarEvent({});
    event = new GoogleCalendarEvent({
      kind: 'calendar#event',
      etag: '"3083072775434000"',
      id: '68p6ac9k60sj2b9g74oj8b9kcoojcb9p6gpm6b9mckomacj160q32e9o74',
      status: 'confirmed',
      htmlLink: 'calendar.com/event/myEvent',
      created: '2018-06-07T16:20:55.000Z',
      updated: '2019-04-08T00:45:19.865Z',
      summary: 'bbq at 4',
      creator: {
        email: 'john.h.hatcher@gmail.com',
        displayName: 'John Hatcher',
        self: true,
      },
      organizer: {
        email: 'john.h.hatcher@gmail.com',
        displayName: 'John Hatcher',
        self: true,
      },
      start: {
        dateTime: '2018-07-22T16:30:00-04:00',
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: '2018-07-22T17:30:00-04:00',
        timeZone: 'America/New_York',
      },
      iCalUID: '68p6ac9k60sj2b9g74oj8b9kcoojcb9p6gpm6b9mckomacj160q32e9o74@google.com',
      sequence: 0,
      attendees: [
        {
          email: 'john.h.hatcher@gmail.com',
          displayName: 'John Hatcher',
          organizer: true,
          self: true,
          responseStatus: 'accepted',
        },
        {
          email: 'akgw@akgw.com',
          responseStatus: 'needsAction',
        },
      ],
      reminders: {
        useDefault: false,
        overrides: [],
      },
      date: '2018-07-22T16:30:00-04:00',
      phrase: '39 weeks ago',
    });
  });

  describe('[static]', () => {
    describe('[method] emailMatch, using [method] cleanEmail', () => {
      it('should match regardless of periods before the @', () => {
        expect(GoogleCalendarEvent.emailMatch('john.doe@gmail.com', 'johndoe@gmail.com')).to.be.true;
        expect(GoogleCalendarEvent.emailMatch('jo.hn.doe@gmail.com', 'joh..ndoe.@gmail.com')).to.be.true;
        expect(GoogleCalendarEvent.emailMatch('john.doe@g.mail.com', 'john.doe@gmail.com')).to.be.false;
      });

      it('should match regardless of case', () => {
        expect(GoogleCalendarEvent.emailMatch('john.Doe@gmail.com', 'john.doe@gmail.com')).to.be.true;
        expect(GoogleCalendarEvent.emailMatch('JOHN.doe@gMail.com', 'john.doe@gmail.com')).to.be.true;
      });

      it('should match regardless of trailing/leading whitespace', () => {
        expect(GoogleCalendarEvent.emailMatch(' john.doe@gmail.com', 'john.doe@gmail.com')).to.be.true;
        expect(GoogleCalendarEvent.emailMatch('john.doe@gmail.com ', ' john.doe@gmail.com')).to.be.true;
      });
    });

    describe('[method] sortByDateAsc', () => {
      it('should sort by start date, ascending', () => {
        const earlier = new GoogleCalendarEvent({ start: { date: moment().subtract(1, 'week').toISOString() } });
        const middle = new GoogleCalendarEvent({ start: { date: moment().toISOString() } });
        const later = new GoogleCalendarEvent({ start: { date: moment().add(1, 'week').toISOString() } });
        const unsorted = [middle, later, earlier, middle];
        const sorted = unsorted.sort(GoogleCalendarEvent.sortByDateAsc);

        expect(sorted).to.deep.equal([earlier, middle, middle, later]);
      });
    });

    describe('[method] sortByDateDesc', () => {
      it('should sort by start date, descending', () => {
        const earlier = new GoogleCalendarEvent({ start: { date: moment().subtract(1, 'week').toISOString() } });
        const middle = new GoogleCalendarEvent({ start: { date: moment().toISOString() } });
        const later = new GoogleCalendarEvent({ start: { date: moment().add(1, 'week').toISOString() } });
        const unsorted = [middle, earlier, later, middle];
        const sorted = unsorted.sort(GoogleCalendarEvent.sortByDateDesc);

        expect(sorted).to.deep.equal([later, middle, middle, earlier]);
      });
    });
  });

  describe('[method] isAttending', () => {
    it('should return false if no attendees', () => {
      expect(nullEvent.isAttending('john.doe@gmail.com')).to.be.false;
    });

    it('should return false if email does not match attendees', () => {
      expect(event.isAttending('john.doe@gmail.com')).to.be.false;
    });

    it('should return true if email does match attendees', () => {
      expect(event.isAttending('akgw@akgw.com')).to.be.true;
    });
  });

  describe('[method] isFuture', () => {
    it('should return false if event is in the past', () => {
      event.date = moment().subtract(1, 'week').toISOString();
      expect(event.isFuture()).to.be.false;
    });

    it('should return true if event is in the future', () => {
      event.date = moment().add(1, 'week').toISOString();
      expect(event.isFuture()).to.be.true;
    });

    it('should return false if event is now', () => {
      event.date = moment();
      expect(event.isFuture()).to.be.false;
    });
  });

  describe('[method] toObject', () => {
    it('should return only the necessary fields', () => {
      expect(event.toObject()).to.deep.equal({
        summary: 'bbq at 4',
        htmlLink: 'calendar.com/event/myEvent',
        date: '2018-07-22T16:30:00-04:00',
      });
    });
  });
});
