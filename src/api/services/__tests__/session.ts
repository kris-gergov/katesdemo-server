import SessionService from '../session/session';
import Session from '@models/session';

describe('session service', () => {
  it('has a module', () => {
    expect(SessionService).toBeDefined();
  });

  it('gets all sessions', async () => {
    const expected = {
      sessions: ['session1', 'session2'],
    };
    Session.find = jest.fn().mockResolvedValue(expected);
    const sessionService = SessionService(Session);

    await expect(sessionService.findSessions({})).resolves.toEqual(expected);
  });

  it('creates a session', async () => {
    const expected = {
      sessionId: 'testId123',
    };
    Session.create = jest.fn().mockResolvedValue(expected);
    const sessionService = SessionService(Session);

    await expect(sessionService.createSession('userId123', 'testagent')).resolves.toEqual(expected);
  });

  it('updates a session', async () => {
    Session.updateOne = jest.fn().mockResolvedValue('updatedSession');
    const sessionService = SessionService(Session);
    const expected = 'updatedSession';

    await expect(sessionService.updateSession({ id: 'testId' }, { hours: 10 })).resolves.toEqual(expected);
  });
});
