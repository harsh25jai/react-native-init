import { startSpinner, stopSpinner } from './spinner';

describe('spinner utility', () => {
  const originalIsTTY = process.stdout.isTTY;

  let clearLineSpy: jest.SpyInstance;
  let cursorToSpy: jest.SpyInstance;
  let writeSpy: jest.SpyInstance;
  let setIntervalSpy: jest.SpyInstance;
  let clearIntervalSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.useFakeTimers();

    // Force TTY to true so our spinner logic runs
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true,
    });

    // Mock stdout methods used by spinner
    clearLineSpy = jest
      .spyOn(process.stdout, 'clearLine')      
      .mockImplementation(() => true);

    cursorToSpy = jest
      .spyOn(process.stdout, 'cursorTo')      
      .mockImplementation(() => true);

    writeSpy = jest
      .spyOn(process.stdout, 'write')      
      .mockImplementation(() => true as any);

    // Spy on global timer functions
    setIntervalSpy = jest.spyOn(global, 'setInterval');
    clearIntervalSpy = jest.spyOn(global, 'clearInterval');
  });

  afterAll(() => {
    jest.useRealTimers();

    // Restore original TTY flag
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      configurable: true,
    });

    clearLineSpy.mockRestore();
    cursorToSpy.mockRestore();
    writeSpy.mockRestore();
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  afterEach(() => {
    // Ensure spinner is stopped after each test
    stopSpinner();
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('starts spinner and schedules interval updates', () => {
    startSpinner('Loading');

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    // Fast-forward a few ticks
    jest.advanceTimersByTime(120 * 3);

    // Should write multiple times
    expect(writeSpy).toHaveBeenCalled();
    const firstCallArg = writeSpy.mock.calls[0][0] as string;

    // Contains the text and one of the frames
    expect(firstCallArg).toContain('Loading');
    expect(firstCallArg).toMatch(/[|\/\\-]/);
  });

  it('stops spinner and clears the line', () => {
    startSpinner('Loading');

    jest.advanceTimersByTime(120 * 2);

    stopSpinner();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearLineSpy).toHaveBeenCalled();
    expect(cursorToSpy).toHaveBeenCalledWith(0);
  });

  it('prints finalText when stopping', () => {
    startSpinner('Installing');

    jest.advanceTimersByTime(120);

    stopSpinner('✔ Done');

    // Last write should contain finalText
    const lastCallArg =
      writeSpy.mock.calls[writeSpy.mock.calls.length - 1][0];

    expect(lastCallArg).toContain('✔ Done');
  });

  it('resets frame index when starting multiple times', () => {
    startSpinner('First');
    jest.advanceTimersByTime(120 * 2);
    stopSpinner();

    startSpinner('Second');
    jest.advanceTimersByTime(120);

    // First write after second start should be a fresh frame
    const firstCallArg = writeSpy.mock.calls[0][0] as string;
    expect(firstCallArg).toContain('Second');
    expect(firstCallArg).toMatch(/[|\/\\-]/);
  });
});
