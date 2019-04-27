# Google API Clients for Node.js

## Tests

```
  [class] GoogleAPI
    [method] authorize
      ✓ should instantiate with a default config

  [class] GoogleCalendar
    [method] constructor
      ✓ should export a constructor
    [method] load
      ✓ should load calendar data, returning a promise
      ✓ should load calendar data, await syntax
      ✓ should reject w/error
    [method] getNextEvent
      ✓ should return null if email is not on any future events
      ✓ should return null if email is only on a past event
      ✓ should return the date if email is on a future event
      ✓ should return the date if email is on a future event using date field
    [method] getLastEvent
      ✓ should return null if no prior event is found
      ✓ should return null if no prior event is found, ignoring future events
      ✓ should return the last prior event found
      ✓ should return the date of the most recent prior event found
      ✓ should return the stable order date of the most recent prior event found
    [method] isScheduled
      ✓ should return false if email is not on any future events
      ✓ should return false if email is only on a past event
      ✓ should return true if email is on a future event
    [method] computeWeeksSinceLastSeen
      ✓ should return -1 if no prior event is found
      ✓ should return -1 if no prior event is found, ignoring future events
      ✓ should return the number of weeks since the last prior event found
      ✓ should return the number of weeks since the most recent prior event found
    [method] computeLastSeenScore
      ✓ should correctly compute: weekly, never seen => 0
      ✓ should correctly compute: weekly, 3 weeks => 3/1 => 3.0
      ✓ should correctly compute: monthly, 3 weeks => 3/4 => 0.75
      ✓ should correctly compute: quarterly, 10 weeks => 10/12 => 0.83
      ✓ should correctly compute: biannually, 10 weeks => 10/26 => 0.38
      ✓ should correctly compute: annually, 26 weeks => 26/52 => 0.5
      ✓ should correctly compute: quarterly, 1 week => 1/12 => 0.08

  [class] GoogleCalendarEvent
    [static]
      [method] emailMatch, using [method] cleanEmail
        ✓ should match regardless of periods before the @
        ✓ should match regardless of case
        ✓ should match regardless of trailing/leading whitespace
      [method] sortByDateAsc
        ✓ should sort by start date, ascending
      [method] sortByDateDesc
        ✓ should sort by start date, descending
    [method] isAttending
      ✓ should return false if no attendees
      ✓ should return false if email does not match attendees
      ✓ should return true if email does match attendees
    [method] isFuture
      ✓ should return false if event is in the past
      ✓ should return true if event is in the future
      ✓ should return false if event is now
    [method] toObject
      ✓ should return only the necessary fields

  [class] GoogleSheet
    [method] constructor
      ✓ should export a constructor
    [method] load
      ✓ should load sheet data, returning a promise
      ✓ should reject w/error
      ✓ should load sheet data, await syntax
      ✓ should load sheet data raw if no column headers given
      ✓ should load sheet data inflated if column headers given
    [method] inflateRow
      ✓ should convert a flat row to an object
    [method] update
      ✓ should update sheet data, await syntax
      ✓ should reject w/error


  49 passing (103ms)

------------------------|----------|----------|----------|----------|-------------------|
File                    |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
------------------------|----------|----------|----------|----------|-------------------|
All files               |      100 |      100 |      100 |      100 |                   |
 GoogleAPI.js           |      100 |      100 |      100 |      100 |                   |
 GoogleCalendar.js      |      100 |      100 |      100 |      100 |                   |
 GoogleCalendarEvent.js |      100 |      100 |      100 |      100 |                   |
 GoogleSheet.js         |      100 |      100 |      100 |      100 |                   |
------------------------|----------|----------|----------|----------|-------------------|
```