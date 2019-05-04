const GoogleAPI = require('./GoogleAPI');

/**
 * Send emails through your G-Mail account
 * @class
 */
class GoogleMail extends GoogleAPI {
  static getApiVersion() {
    return { name: 'gmail', version: 'v1' };
  }

  /**
   * Send some HTML through your gmail account
   * @param {{name: string, email: string}} from
   * @param {{name: string, email: string}} to
   * @param {{subject: string, html: string}} contents
   */
  send(from, to, contents) {
    const utf8Subject = `=?utf-8?B?${Buffer.from(contents.subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${from.name} <${from.email}>`,
      `To: ${to.name} <${to.email}>`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      contents.html,
    ];
    const message = messageParts.join('\n');

    // The body needs to be base64url encoded.
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return new Promise((resolve, reject) => {
      this.api.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMessage,
        },
      }, (err, res) => {
        if (err) return reject(new Error(`Failed to send email: ${err}`));
        return resolve(res);
      });
    });
  }
}

module.exports = GoogleMail;
