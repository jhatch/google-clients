const moment = require('moment');
const sinon = require('sinon'); // eslint-disable-line import/no-extraneous-dependencies
const { expect } = require('chai'); // eslint-disable-line import/no-extraneous-dependencies
const GoogleCalendar = require('./GoogleCalendar');
const GoogleCalendarEvent = require('./GoogleCalendarEvent');

describe('[class] GoogleCalendar', () => {
  /* eslint no-unused-expressions: off */

  let token;
  let oauth;
  let config;

  beforeEach(() => {
    token = {
      access_token: 'ya29.GlvlBl0RsTtU8uZNOI5P5ErrGPVm5OXB9YdU0KppVOZSMBbn1i2snGg9Xj_kxRGjTRHDSAWvsrB',
      refresh_token: '1/kSncFfEAZy5tgIknvaUhr4T8EW6FvpOTBofUNwBBLO8',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      token_type: 'Bearer',
      expiry_date: 1554684728523,
    };

    oauth = {
      client_id: '164452747151-9fs797qomrppmnol162m7vmi3k9d2ig3.apps.googleusercontent.com',
      project_id: 'quickstart-1551571748055',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_secret: 'wEkEaKZxQ5YJ9DJM3LU91mxY',
      redirect_uris: [
        'urn:ietf:wg:oauth:2.0:oob',
        'http://localhost',
      ],
    };

    config = { token, oauth };
  });

  describe('[method] constructor', () => {
    it('should export a constructor', () => {
      const calendar = new GoogleCalendar(config);

      expect(calendar).to.be.instanceOf(GoogleCalendar);
    });
  });

  describe('[method] getTargetMaxWeeksApart', () => {
    it('should auto lowercase the frequency given', () => {
      expect(GoogleCalendar.getTargetMaxWeeksApart('WEEKLY')).to.equal(1);
    });

    it('should return undefined for bogus inputs', () => {
      expect(GoogleCalendar.getTargetMaxWeeksApart(undefined)).to.be.undefined;
    });
  });

  describe('[method] load', () => {
    const events = [{}];
    const from = moment().subtract(12, 'months').toDate();
    const to = moment().add(12, 'months').toDate();
    let calendar;

    beforeEach(() => {
      calendar = new GoogleCalendar(config);

      sinon.stub(calendar.api.events, 'list').callsFake((options, cb) => {
        expect(options.timeMin).to.deep.equal(from);
        expect(options.timeMax).to.deep.equal(to);
        cb(null, { data: { items: events } });
      });
    });

    it('should load calendar data, returning a promise', (done) => {
      calendar.load(from, to)
        .then(() => {
          expect(calendar.events).to.be.an('array');
          expect(calendar.events).to.have.lengthOf(1);
        })
        .then(done)
        .catch(done);
    });

    it('should load calendar data, await syntax', async () => {
      await calendar.load(from, to);
      expect(calendar.events).to.be.an('array');
      expect(calendar.events).to.have.lengthOf(1);
    });

    it('should reject w/error', (done) => {
      calendar.api.events.list.restore();
      sinon.stub(calendar.api.events, 'list').callsFake((options, cb) => {
        cb({ name: 'Boom!' });
      });

      calendar.load(from, to).catch((error) => {
        expect(error.name).to.equal('Boom!');
        done();
      });
    });
  });

  describe('[method] getNextEvent', () => {
    it('should return null if email is not on any future events', () => {
      const calendar = new GoogleCalendar(config);
      const date = moment().add(500, 'years').toISOString();

      calendar.events.push(new GoogleCalendarEvent({
        start: {
          dateTime: date,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }));

      expect(calendar.getNextEvent('bob.dole@gmail.com')).to.equal(null);
    });

    it('should return null if email is only on a past event', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime: moment().subtract(500, 'years').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.getNextEvent('john.doe@gmail.com')).to.equal(null);
    });

    it('should return the date if email is on a future event', () => {
      const calendar = new GoogleCalendar(config);
      const date = moment().add(500, 'years').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        summary: 'Event.',
        start: {
          dateTime: date,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
        htmlLink: 'event.com',
      })];

      expect(calendar.getNextEvent('john.doe@gmail.com')).to.deep.equal({
        date,
        summary: 'Event.',
        htmlLink: 'event.com',
      });
    });

    it('should return the date if email is on a future event using date field', () => {
      const calendar = new GoogleCalendar(config);
      const date = moment().add(500, 'years').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        summary: 'Event.',
        start: {
          date,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
        htmlLink: 'event.com',
      })];

      expect(calendar.getNextEvent('john.doe@gmail.com')).to.deep.equal({
        date,
        summary: 'Event.',
        htmlLink: 'event.com',
      });
    });
  });

  describe('[method] getLastEvent', () => {
    it('should return null if no prior event is found', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [];
      expect(calendar.getLastEvent('john.doe@gmail.com')).to.equal(null);
    });

    it('should return null if no prior event is found, ignoring future events', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().add(2, 'week').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.getLastEvent('john.doe@gmail.com')).to.deep.equal(null);
    });

    it('should return the last prior event found', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(2, 'week').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        summary: 'event',
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
        htmlLink: 'calendar.com/event',
      })];

      expect(calendar.getLastEvent('john.doe@gmail.com')).to.deep.equal({
        summary: 'event',
        date: dateTime,
        htmlLink: 'calendar.com/event',
      });
    });

    it('should return the date of the most recent prior event found', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime1 = moment().subtract(2, 'week').toISOString();
      const dateTime2 = moment().subtract(4, 'week').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        summary: 'first',
        start: {
          dateTime: dateTime1,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
        htmlLink: 'calendar.com/event',
      }), new GoogleCalendarEvent({
        start: {
          dateTime: dateTime2,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
        htmlLink: 'calendar.com/event',
      })];

      expect(calendar.getLastEvent('john.doe@gmail.com')).to.deep.equal({
        date: dateTime1,
        summary: 'first',
        htmlLink: 'calendar.com/event',
      });
    });

    it('should return the stable order date of the most recent prior event found', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime1 = moment().subtract(2, 'week').toISOString();
      const dateTime2 = moment().subtract(4, 'week').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        summary: 'second',
        start: {
          dateTime: dateTime2,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
        htmlLink: 'calendar.com/event',
      }), new GoogleCalendarEvent({
        summary: 'third',
        start: {
          dateTime: dateTime2,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
        htmlLink: 'calendar.com/event',
      }), new GoogleCalendarEvent({
        summary: 'first',
        start: {
          dateTime: dateTime1,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
        htmlLink: 'calendar.com/event',
      })];

      expect(calendar.getLastEvent('john.doe@gmail.com')).to.deep.equal({
        date: dateTime1,
        summary: 'first',
        htmlLink: 'calendar.com/event',
      });
    });
  });

  describe('[method] isScheduled', () => {
    it('should return false if email is not on any future events', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime: moment().add(500, 'years').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.isScheduled('bob.dole@gmail.com')).to.be.false;
    });

    it('should return false if email is only on a past event', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime: moment().subtract(500, 'years').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.isScheduled('john.doe@gmail.com')).to.be.false;
    });

    it('should return true if email is on a future event', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime: moment().add(500, 'years').toISOString(),
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.isScheduled('john.doe@gmail.com')).to.be.true;
    });
  });

  describe('[method] computeWeeksSinceLastSeen', () => {
    it('should return -1 if no prior event is found', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [];
      expect(calendar.computeWeeksSinceLastSeen('john.doe@gmail.com')).to.equal(-1);
    });

    it('should return -1 if no prior event is found, ignoring future events', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().add(2, 'week').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.computeWeeksSinceLastSeen('john.doe@gmail.com')).to.equal(-1);
    });

    it('should return the number of weeks since the last prior event found', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(2, 'week').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.computeWeeksSinceLastSeen('john.doe@gmail.com')).to.equal(2);
    });

    it('should return the number of weeks since the most recent prior event found', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime1 = moment().subtract(2, 'week').toISOString();
      const dateTime2 = moment().subtract(4, 'week').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime: dateTime1,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      }), new GoogleCalendarEvent({
        start: {
          dateTime: dateTime2,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.computeWeeksSinceLastSeen('john.doe@gmail.com')).to.equal(2);
    });
  });

  describe('[method] computeLastSeenScore', () => {
    it('should correctly compute: weekly, never seen => 0', () => {
      const calendar = new GoogleCalendar(config);

      calendar.events = [];
      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'weekly')).to.equal(-1);
    });

    it('should correctly compute: weekly, 3 weeks => 3/1 => 3.0', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(3, 'weeks').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'weekly')).to.equal(3 / 1);
    });

    it('should correctly compute: monthly, 3 weeks => 3/4 => 0.75', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(3, 'weeks').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'monthly')).to.equal(3 / 4);
    });

    it('should correctly compute: quarterly, 10 weeks => 10/12 => 0.83', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(10, 'weeks').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'quarterly')).to.equal(10 / 12);
    });

    it('should correctly compute: biannually, 10 weeks => 10/26 => 0.38', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(10, 'weeks').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'biannually')).to.equal(10 / 26);
    });

    it('should correctly compute: annually, 26 weeks => 26/52 => 0.5', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(26, 'weeks').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'annually')).to.equal(26 / 52);
    });

    it('should correctly compute: quarterly, 1 week => 1/12 => 0.08', () => {
      const calendar = new GoogleCalendar(config);
      const dateTime = moment().subtract(1, 'week').toISOString();

      calendar.events = [new GoogleCalendarEvent({
        start: {
          dateTime,
        },
        attendees: [{
          email: 'john.doe@gmail.com',
        }],
      })];

      expect(calendar.computeLastSeenScore('john.doe@gmail.com', 'quarterly')).to.equal(1 / 12);
    });
  });
});
