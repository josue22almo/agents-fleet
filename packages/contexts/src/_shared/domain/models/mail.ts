export class Mail {
  private constructor(
    private _to: string,
    private _subject: string,
    private _body: string,
  ) {}

  toPrimitives() {
    return {
      to: this._to,
      subject: this._subject,
      body: this._body,
    };
  }

  static create(params: { to: string; subject: string; body: string }): Mail {
    if (!params.to) throw new Error("Mail recipient is required");
    if (!params.subject) throw new Error("Mail subject is required");
    if (!params.body) throw new Error("Mail body is required");
    return new Mail(params.to, params.subject, params.body);
  }
}
